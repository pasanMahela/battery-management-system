using BatteryShop.API.Dtos;
using BatteryShop.API.Models;
using MongoDB.Driver;

namespace BatteryShop.API.Services;

public class BatteryService
{
    private readonly IMongoCollection<Battery> _batteries;

    public BatteryService(MongoDbService mongoDbService)
    {
        _batteries = mongoDbService.Database.GetCollection<Battery>("Batteries");
    }

    public async Task<List<Battery>> GetAllAsync()
    {
        return await _batteries.Find(_ => true).ToListAsync();
    }

    public async Task<Battery?> GetByIdAsync(string id)
    {
        return await _batteries.Find(b => b.Id == id).FirstOrDefaultAsync();
    }

    public async Task<Battery> CreateAsync(BatteryCreateDto dto)
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
            InvoiceNumber = dto.InvoiceNumber
        };
        
        await _batteries.InsertOneAsync(battery);
        return battery;
    }

    public async Task<bool> UpdateAsync(string id, BatteryUpdateDto dto)
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
            .Set(b => b.InvoiceNumber, dto.InvoiceNumber);

        var result = await _batteries.UpdateOneAsync(b => b.Id == id, update);
        return result.ModifiedCount > 0;
    }

    public async Task<bool> DeleteAsync(string id)
    {
        var result = await _batteries.DeleteOneAsync(b => b.Id == id);
        return result.DeletedCount > 0;
    }
}
