using BatteryShop.API.Dtos;
using BatteryShop.API.Models;
using MongoDB.Driver;

namespace BatteryShop.API.Services;

public class BatteryReturnService
{
    private readonly IMongoCollection<BatteryReturn> _returns;
    private readonly IMongoCollection<Battery> _batteries;

    public BatteryReturnService(MongoDbService mongoDbService)
    {
        _returns = mongoDbService.Database.GetCollection<BatteryReturn>("BatteryReturns");
        _batteries = mongoDbService.Database.GetCollection<Battery>("Batteries");
    }

    public async Task<List<BatteryReturn>> GetAllAsync()
    {
        return await _returns.Find(_ => true).ToListAsync();
    }

    public async Task<BatteryReturn?> GetByIdAsync(string id)
    {
        return await _returns.Find(r => r.Id == id).FirstOrDefaultAsync();
    }

    public async Task<BatteryReturn> CreateAsync(BatteryReturnCreateDto dto, string username)
    {
        // Get the battery being returned
        var battery = await _batteries.Find(b => b.Id == dto.BatteryId).FirstOrDefaultAsync();
        if (battery == null)
            throw new Exception("Battery not found");

        if (battery.IsReturned)
            throw new Exception("Battery has already been returned");

        // Calculate expiry date
        var expiryDate = battery.PurchaseDate.AddMonths(battery.ShelfLifeMonths);

        // Create return record - set status based on compensation type
        // Money returns are completed immediately, Replacement returns wait for battery to be added
        var batteryReturn = new BatteryReturn
        {
            BatteryId = dto.BatteryId,
            SerialNumber = battery.SerialNumber,
            Brand = battery.Brand,
            Model = battery.Model,
            ReturnDate = DateTime.UtcNow,
            ExpiryDate = expiryDate,
            CompensationType = dto.CompensationType,
            MoneyAmount = dto.MoneyAmount,
            ReturnedBy = username,
            Status = dto.CompensationType == "Money" ? "Completed" : "Pending",
            Notes = dto.Notes
        };

        await _returns.InsertOneAsync(batteryReturn);

        // Mark battery as returned and set stock to 0
        var updateBattery = Builders<Battery>.Update
            .Set(b => b.IsReturned, true)
            .Set(b => b.ReturnId, batteryReturn.Id)
            .Set(b => b.StockQuantity, 0);
        await _batteries.UpdateOneAsync(b => b.Id == dto.BatteryId, updateBattery);

        return batteryReturn;
    }

    public async Task<bool> UpdateStatusAsync(string id, BatteryReturnUpdateDto dto)
    {
        var update = Builders<BatteryReturn>.Update
            .Set(r => r.Status, dto.Status)
            .Set(r => r.Notes, dto.Notes);

        var result = await _returns.UpdateOneAsync(r => r.Id == id, update);
        return result.ModifiedCount > 0;
    }

    public async Task<bool> DeleteAsync(string id)
    {
        var result = await _returns.DeleteOneAsync(r => r.Id == id);
        return result.DeletedCount > 0;
    }

    public async Task<bool> SetReplacementBatteryIdAsync(string returnId, string batteryId)
    {
        var update = Builders<BatteryReturn>.Update.Set(r => r.ReplacementBatteryId, batteryId);
        var result = await _returns.UpdateOneAsync(r => r.Id == returnId, update);
        return result.ModifiedCount > 0;
    }

    public async Task<bool> SetReplacementDetailsAsync(string returnId, string batteryId, string serialNumber, string? salesRep, string? invoiceNumber)
    {
        var update = Builders<BatteryReturn>.Update
            .Set(r => r.ReplacementBatteryId, batteryId)
            .Set(r => r.ReplacementSerialNumber, serialNumber)
            .Set(r => r.ReplacementSalesRep, salesRep)
            .Set(r => r.ReplacementInvoiceNumber, invoiceNumber);
        var result = await _returns.UpdateOneAsync(r => r.Id == returnId, update);
        return result.ModifiedCount > 0;
    }
}
