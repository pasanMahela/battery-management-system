using BatteryShop.API.Dtos;
using BatteryShop.API.Models;
using MongoDB.Driver;

namespace BatteryShop.API.Services;

public class SaleService
{
    private readonly IMongoCollection<Sale> _sales;
    private readonly IMongoCollection<Battery> _batteries;

    public SaleService(MongoDbService mongoDbService)
    {
        _sales = mongoDbService.Database.GetCollection<Sale>("Sales");
        _batteries = mongoDbService.Database.GetCollection<Battery>("Batteries");
    }

    public async Task<List<Sale>> GetAllAsync()
    {
        return await _sales.Find(_ => true).SortByDescending(s => s.Date).ToListAsync();
    }

    public async Task<Sale?> GetByIdAsync(string id)
    {
        return await _sales.Find(s => s.Id == id).FirstOrDefaultAsync();
    }

    public async Task<List<Sale>> SearchByCustomerIdAsync(string searchTerm)
    {
        var filter = Builders<Sale>.Filter.Regex(s => s.CustomerId, new MongoDB.Bson.BsonRegularExpression(searchTerm, "i"));
        return await _sales.Find(filter)
            .SortByDescending(s => s.Date)
            .Limit(10)
            .ToListAsync();
    }

    public async Task<Sale> CreateAsync(SaleCreateDto dto, string cashierId, string cashierName)
    {
        // Fetch all required batteries in ONE query instead of one-by-one
        var batteryIds = dto.Items.Select(i => i.BatteryId).ToList();
        var batteries = await _batteries.Find(b => batteryIds.Contains(b.Id)).ToListAsync();
        var batteryDict = batteries.ToDictionary(b => b.Id!);

        var saleItems = new List<SaleItem>();
        decimal totalAmount = 0;

        // Process items
        foreach (var item in dto.Items)
        {
            if (!batteryDict.TryGetValue(item.BatteryId, out var battery))
            {
                throw new InvalidOperationException($"Battery {item.BatteryId} not found");
            }

            if (battery.StockQuantity < item.Quantity)
            {
                throw new InvalidOperationException($"Insufficient stock for {battery.Brand} {battery.Model}");
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
                Subtotal = subtotal,
                WarrantyPeriodMonths = battery.WarrantyPeriodMonths,
                WarrantyStartDate = warrantyStartDate,
                WarrantyExpiryDate = warrantyExpiryDate
            });
            totalAmount += subtotal;
        }

        // Update stock for all items in parallel (batch operations)
        var stockUpdateTasks = dto.Items.Select(item =>
        {
            var updateStock = Builders<Battery>.Update.Inc(b => b.StockQuantity, -item.Quantity);
            return _batteries.UpdateOneAsync(b => b.Id == item.BatteryId, updateStock);
        });
        await Task.WhenAll(stockUpdateTasks);

        // Generate unique invoice number
        var today = DateTime.UtcNow.Date;
        var tomorrow = today.AddDays(1);
        var todaySalesCount = await _sales.CountDocumentsAsync(s => s.Date >= today && s.Date < tomorrow);
        var invoiceNumber = $"INV-{DateTime.UtcNow:yyyyMMdd}-{(todaySalesCount + 1):D4}";

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
            Items = saleItems
        };

        await _sales.InsertOneAsync(sale);
        return sale;
    }
}
