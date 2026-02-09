using BatteryShop.API.Constants;
using BatteryShop.API.Dtos;
using BatteryShop.API.Exceptions;
using BatteryShop.API.Models;
using MongoDB.Driver;

namespace BatteryShop.API.Services;

public class BatteryReturnService
{
    private readonly IMongoCollection<BatteryReturn> _returns;
    private readonly IMongoCollection<Battery> _batteries;

    public BatteryReturnService(MongoDbService mongoDbService)
    {
        _returns = mongoDbService.Database.GetCollection<BatteryReturn>(AppConstants.Collections.BatteryReturns);
        _batteries = mongoDbService.Database.GetCollection<Battery>(AppConstants.Collections.Batteries);
    }

    public async Task<List<BatteryReturn>> GetAllAsync(int page = 1, int pageSize = AppConstants.Defaults.PageSize)
    {
        var skip = (page - 1) * pageSize;
        return await _returns
            .Find(r => !r.IsDeleted)
            .SortByDescending(r => r.ReturnDate)
            .Skip(skip)
            .Limit(pageSize)
            .ToListAsync();
    }

    public async Task<long> GetCountAsync()
    {
        return await _returns.CountDocumentsAsync(r => !r.IsDeleted);
    }

    public async Task<BatteryReturn?> GetByIdAsync(string id)
    {
        return await _returns.Find(r => r.Id == id && !r.IsDeleted).FirstOrDefaultAsync();
    }

    public async Task<BatteryReturn?> GetByBatteryIdAsync(string batteryId)
    {
        return await _returns.Find(r => r.BatteryId == batteryId && !r.IsDeleted).FirstOrDefaultAsync();
    }

    public async Task<BatteryReturn> CreateAsync(BatteryReturnCreateDto dto, string username)
    {
        // Get the battery being returned
        var battery = await _batteries.Find(b => b.Id == dto.BatteryId && !b.IsDeleted).FirstOrDefaultAsync();
        if (battery == null)
            throw new NotFoundException("Battery", dto.BatteryId);

        if (battery.IsReturned)
            throw new AlreadyReturnedException(dto.BatteryId);

        // Calculate expiry date
        var expiryDate = battery.PurchaseDate.AddMonths(battery.ShelfLifeMonths);

        // Create return record - set status based on compensation type
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
            Status = dto.CompensationType == AppConstants.ReturnTypes.Money ? AppConstants.ReturnStatuses.Completed : AppConstants.ReturnStatuses.Pending,
            Notes = dto.Notes,
            CreatedAt = DateTime.UtcNow
        };

        await _returns.InsertOneAsync(batteryReturn);

        // Mark battery as returned and set stock to 0
        var updateBattery = Builders<Battery>.Update
            .Set(b => b.IsReturned, true)
            .Set(b => b.ReturnId, batteryReturn.Id)
            .Set(b => b.StockQuantity, 0)
            .Set(b => b.UpdatedAt, DateTime.UtcNow);
        await _batteries.UpdateOneAsync(b => b.Id == dto.BatteryId, updateBattery);

        return batteryReturn;
    }

    public async Task<bool> UpdateStatusAsync(string id, BatteryReturnUpdateDto dto, string? updatedBy = null)
    {
        var update = Builders<BatteryReturn>.Update
            .Set(r => r.Status, dto.Status)
            .Set(r => r.Notes, dto.Notes)
            .Set(r => r.UpdatedAt, DateTime.UtcNow)
            .Set(r => r.UpdatedBy, updatedBy);

        var result = await _returns.UpdateOneAsync(r => r.Id == id && !r.IsDeleted, update);
        return result.ModifiedCount > 0;
    }

    public async Task<bool> DeleteAsync(string id, string? deletedBy = null)
    {
        var update = Builders<BatteryReturn>.Update
            .Set(r => r.IsDeleted, true)
            .Set(r => r.DeletedAt, DateTime.UtcNow)
            .Set(r => r.DeletedBy, deletedBy);

        var result = await _returns.UpdateOneAsync(r => r.Id == id && !r.IsDeleted, update);
        return result.ModifiedCount > 0;
    }

    public async Task<bool> SetReplacementBatteryIdAsync(string returnId, string batteryId)
    {
        var update = Builders<BatteryReturn>.Update
            .Set(r => r.ReplacementBatteryId, batteryId)
            .Set(r => r.UpdatedAt, DateTime.UtcNow);
        var result = await _returns.UpdateOneAsync(r => r.Id == returnId, update);
        return result.ModifiedCount > 0;
    }

    public async Task<bool> SetReplacementDetailsAsync(string returnId, string batteryId, string serialNumber, string? salesRep, string? invoiceNumber)
    {
        var update = Builders<BatteryReturn>.Update
            .Set(r => r.ReplacementBatteryId, batteryId)
            .Set(r => r.ReplacementSerialNumber, serialNumber)
            .Set(r => r.ReplacementSalesRep, salesRep)
            .Set(r => r.ReplacementInvoiceNumber, invoiceNumber)
            .Set(r => r.Status, AppConstants.ReturnStatuses.Completed)
            .Set(r => r.UpdatedAt, DateTime.UtcNow);
        var result = await _returns.UpdateOneAsync(r => r.Id == returnId, update);
        return result.ModifiedCount > 0;
    }
}
