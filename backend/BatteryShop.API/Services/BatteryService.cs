using BatteryShop.API.Constants;
using BatteryShop.API.Dtos;
using BatteryShop.API.Exceptions;
using BatteryShop.API.Models;
using MongoDB.Driver;

namespace BatteryShop.API.Services;

public class BatteryService
{
    private readonly IMongoCollection<Battery> _batteries;
    private readonly IMongoCollection<Sale> _sales;

    public BatteryService(MongoDbService mongoDbService)
    {
        _batteries = mongoDbService.Database.GetCollection<Battery>(AppConstants.Collections.Batteries);
        _sales = mongoDbService.Database.GetCollection<Sale>(AppConstants.Collections.Sales);
    }

    public async Task<List<Battery>> GetAllAsync(int page = 1, int pageSize = AppConstants.Defaults.PageSize)
    {
        var skip = (page - 1) * pageSize;
        return await _batteries
            .Find(b => !b.IsDeleted)
            .Skip(skip)
            .Limit(pageSize)
            .ToListAsync();
    }

    public async Task<long> GetCountAsync()
    {
        return await _batteries.CountDocumentsAsync(b => !b.IsDeleted);
    }

    public async Task<Battery?> GetByIdAsync(string id)
    {
        return await _batteries.Find(b => b.Id == id && !b.IsDeleted).FirstOrDefaultAsync();
    }

    public async Task<Battery?> GetBySerialNumberAsync(string serialNumber)
    {
        return await _batteries.Find(b => b.SerialNumber == serialNumber && !b.IsDeleted).FirstOrDefaultAsync();
    }

    public async Task<Battery> CreateAsync(BatteryCreateDto dto, string? createdBy = null)
    {
        var battery = new Battery
        {
            SerialNumber = dto.SerialNumber,
            Barcode = dto.Barcode,
            Brand = dto.Brand,
            Model = dto.Model,
            Capacity = dto.Capacity,
            Voltage = dto.Voltage,
            PurchasePrice = dto.PurchasePrice,
            SellingPrice = dto.SellingPrice,
            PurchaseDate = dto.PurchaseDate,
            StockQuantity = dto.StockQuantity,
            WarrantyPeriodMonths = dto.WarrantyPeriodMonths,
            ShelfLifeMonths = dto.ShelfLifeMonths,
            SalesRep = dto.SalesRep,
            InvoiceNumber = dto.InvoiceNumber,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = createdBy
        };
        
        await _batteries.InsertOneAsync(battery);
        return battery;
    }

    public async Task<bool> UpdateAsync(string id, BatteryUpdateDto dto, string? updatedBy = null)
    {
        var update = Builders<Battery>.Update
            .Set(b => b.SerialNumber, dto.SerialNumber)
            .Set(b => b.Barcode, dto.Barcode)
            .Set(b => b.Brand, dto.Brand)
            .Set(b => b.Model, dto.Model)
            .Set(b => b.Capacity, dto.Capacity)
            .Set(b => b.Voltage, dto.Voltage)
            .Set(b => b.PurchasePrice, dto.PurchasePrice)
            .Set(b => b.SellingPrice, dto.SellingPrice)
            .Set(b => b.PurchaseDate, dto.PurchaseDate)
            .Set(b => b.StockQuantity, dto.StockQuantity)
            .Set(b => b.WarrantyPeriodMonths, dto.WarrantyPeriodMonths)
            .Set(b => b.ShelfLifeMonths, dto.ShelfLifeMonths)
            .Set(b => b.SalesRep, dto.SalesRep)
            .Set(b => b.InvoiceNumber, dto.InvoiceNumber)
            .Set(b => b.UpdatedAt, DateTime.UtcNow)
            .Set(b => b.UpdatedBy, updatedBy);

        var result = await _batteries.UpdateOneAsync(b => b.Id == id && !b.IsDeleted, update);
        return result.ModifiedCount > 0;
    }

    public async Task<bool> DeleteAsync(string id, string? deletedBy = null)
    {
        // Check if battery has been sold
        var hasSales = await _sales.Find(s => 
            s.Items.Any(i => i.BatteryId == id) && !s.IsDeleted
        ).AnyAsync();
        
        if (hasSales)
        {
            throw new DependencyException("Cannot delete battery that has been sold. Use soft delete instead.");
        }

        // Check if battery has been returned
        var battery = await GetByIdAsync(id);
        if (battery?.IsReturned == true)
        {
            throw new DependencyException("Cannot delete battery that has been returned.");
        }

        // Soft delete
        var update = Builders<Battery>.Update
            .Set(b => b.IsDeleted, true)
            .Set(b => b.DeletedAt, DateTime.UtcNow)
            .Set(b => b.DeletedBy, deletedBy);

        var result = await _batteries.UpdateOneAsync(b => b.Id == id && !b.IsDeleted, update);
        return result.ModifiedCount > 0;
    }

    public async Task<bool> HardDeleteAsync(string id)
    {
        var result = await _batteries.DeleteOneAsync(b => b.Id == id);
        return result.DeletedCount > 0;
    }
}
