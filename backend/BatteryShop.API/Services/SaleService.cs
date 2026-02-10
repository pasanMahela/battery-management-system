using BatteryShop.API.Constants;
using BatteryShop.API.Dtos;
using BatteryShop.API.Exceptions;
using BatteryShop.API.Models;
using MongoDB.Driver;

namespace BatteryShop.API.Services;

public class SaleService
{
    private readonly IMongoCollection<Sale> _sales;
    private readonly IMongoCollection<Battery> _batteries;
    private readonly IMongoCollection<Counter> _counters;
    private readonly IMongoClient _client;

    public SaleService(MongoDbService mongoDbService)
    {
        _sales = mongoDbService.Database.GetCollection<Sale>(AppConstants.Collections.Sales);
        _batteries = mongoDbService.Database.GetCollection<Battery>(AppConstants.Collections.Batteries);
        _counters = mongoDbService.Database.GetCollection<Counter>(AppConstants.Collections.Counters);
        _client = mongoDbService.Client;
        
        // Ensure counter exists
        EnsureInvoiceCounter().Wait();
    }

    private async Task EnsureInvoiceCounter()
    {
        var today = DateTime.UtcNow.ToString("yyyyMMdd");
        var counterId = $"invoice_{today}";
        
        var exists = await _counters.Find(c => c.Id == counterId).AnyAsync();
        if (!exists)
        {
            try
            {
                await _counters.InsertOneAsync(new Counter { Id = counterId, Value = 0 });
            }
            catch (MongoWriteException)
            {
                // Counter already exists, ignore
            }
        }
    }

    private async Task<string> GetNextInvoiceNumber()
    {
        var today = DateTime.UtcNow.ToString("yyyyMMdd");
        var counterId = $"invoice_{today}";

        // Atomic increment using FindOneAndUpdate
        var update = Builders<Counter>.Update.Inc(c => c.Value, 1);
        var options = new FindOneAndUpdateOptions<Counter>
        {
            IsUpsert = true,
            ReturnDocument = ReturnDocument.After
        };

        var counter = await _counters.FindOneAndUpdateAsync(
            c => c.Id == counterId,
            update,
            options
        );

        return $"{AppConstants.Defaults.InvoicePrefix}-{today}-{counter.Value:D4}";
    }

    public async Task<List<Sale>> GetAllAsync(int page = 1, int pageSize = AppConstants.Defaults.PageSize)
    {
        var skip = (page - 1) * pageSize;
        return await _sales
            .Find(s => !s.IsDeleted)
            .SortByDescending(s => s.Date)
            .Skip(skip)
            .Limit(pageSize)
            .ToListAsync();
    }

    public async Task<long> GetCountAsync()
    {
        return await _sales.CountDocumentsAsync(s => !s.IsDeleted);
    }

    public async Task<Sale?> GetByIdAsync(string id)
    {
        return await _sales.Find(s => s.Id == id && !s.IsDeleted).FirstOrDefaultAsync();
    }

    public async Task<List<Sale>> SearchByCustomerIdAsync(string searchTerm)
    {
        var filter = Builders<Sale>.Filter.And(
            Builders<Sale>.Filter.Regex(s => s.CustomerId, new MongoDB.Bson.BsonRegularExpression(searchTerm, "i")),
            Builders<Sale>.Filter.Eq(s => s.IsDeleted, false)
        );
        return await _sales.Find(filter)
            .SortByDescending(s => s.Date)
            .Limit(AppConstants.Defaults.SearchLimit)
            .ToListAsync();
    }

    public async Task<List<Sale>> SearchByPhoneAsync(string phoneNumber)
    {
        var filter = Builders<Sale>.Filter.And(
            Builders<Sale>.Filter.Regex(s => s.CustomerPhone, new MongoDB.Bson.BsonRegularExpression(phoneNumber, "i")),
            Builders<Sale>.Filter.Eq(s => s.IsDeleted, false)
        );
        return await _sales.Find(filter)
            .SortByDescending(s => s.Date)
            .Limit(AppConstants.Defaults.SearchLimit)
            .ToListAsync();
    }

    public async Task<Sale> CreateAsync(SaleCreateDto dto, string cashierId, string cashierName)
    {
        // Fetch all required batteries in ONE query
        var batteryIds = dto.Items.Select(i => i.BatteryId).ToList();
        var batteries = await _batteries.Find(b => b.Id != null && batteryIds.Contains(b.Id) && !b.IsDeleted).ToListAsync();
        var batteryDict = batteries.ToDictionary(b => b.Id!);

        // Validate all items before processing
        var saleItems = new List<SaleItem>();
        decimal totalAmount = 0;

        foreach (var item in dto.Items)
        {
            if (!batteryDict.TryGetValue(item.BatteryId, out var battery))
            {
                throw new NotFoundException("Battery", item.BatteryId);
            }

            if (battery.StockQuantity < item.Quantity)
            {
                throw new InsufficientStockException(item.BatteryId, item.Quantity, battery.StockQuantity);
            }

            var subtotal = battery.SellingPrice * item.Quantity;
            var warrantyStartDate = DateTime.UtcNow;
            var warrantyExpiryDate = warrantyStartDate.AddMonths(battery.WarrantyPeriodMonths);
            
            saleItems.Add(new SaleItem
            {
                BatteryId = battery.Id!,
                SerialNumber = battery.SerialNumber,
                Brand = battery.Brand,
                Model = battery.Model,
                Quantity = item.Quantity,
                UnitPrice = battery.SellingPrice,
                PurchasePrice = battery.PurchasePrice, // Store for accurate profit calculation
                Subtotal = subtotal,
                WarrantyPeriodMonths = battery.WarrantyPeriodMonths,
                WarrantyStartDate = warrantyStartDate,
                WarrantyExpiryDate = warrantyExpiryDate
            });
            totalAmount += subtotal;
        }

        // Generate invoice number atomically
        var invoiceNumber = await GetNextInvoiceNumber();

        var sale = new Sale
        {
            InvoiceNumber = invoiceNumber,
            CustomerName = dto.CustomerName,
            CustomerPhone = dto.CustomerPhone,
            CustomerId = dto.CustomerId,
            Date = DateTime.UtcNow,
            TotalAmount = totalAmount - dto.Discount,
            Discount = dto.Discount,
            CashierId = cashierId,
            CashierName = cashierName,
            PaidAmount = dto.PaidAmount,
            Balance = dto.Balance,
            Items = saleItems,
            CreatedAt = DateTime.UtcNow
        };

        // Use session for transaction (if replica set is available)
        using var session = await _client.StartSessionAsync();
        
        try
        {
            session.StartTransaction();

            // Update stock with atomic operations to prevent overselling
            foreach (var item in dto.Items)
            {
                var filter = Builders<Battery>.Filter.And(
                    Builders<Battery>.Filter.Eq(b => b.Id, item.BatteryId),
                    Builders<Battery>.Filter.Gte(b => b.StockQuantity, item.Quantity)
                );
                var update = Builders<Battery>.Update.Inc(b => b.StockQuantity, -item.Quantity);
                
                var result = await _batteries.UpdateOneAsync(session, filter, update);
                
                if (result.ModifiedCount == 0)
                {
                    throw new InsufficientStockException(item.BatteryId, item.Quantity, 0);
                }
            }

            await _sales.InsertOneAsync(session, sale);
            await session.CommitTransactionAsync();
        }
        catch
        {
            await session.AbortTransactionAsync();
            throw;
        }

        return sale;
    }
}

// Counter model for atomic invoice numbers
public class Counter
{
    public string Id { get; set; } = null!;
    public int Value { get; set; }
}
