using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace BatteryShop.API.Models;

public class BatteryReturn
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    public string BatteryId { get; set; } = null!;
    public string SerialNumber { get; set; } = null!;
    public string Brand { get; set; } = null!;
    public string Model { get; set; } = null!;
    
    public DateTime ReturnDate { get; set; }
    public DateTime ExpiryDate { get; set; }
    public string Reason { get; set; } = "Expired";
    
    // Compensation details
    public string CompensationType { get; set; } = null!; // "Money" or "Replacement"
    public decimal? MoneyAmount { get; set; }
    public string? ReplacementBatteryId { get; set; }
    public string? ReplacementSerialNumber { get; set; }
    public string? ReplacementSalesRep { get; set; }
    public string? ReplacementInvoiceNumber { get; set; }
    
    // Tracking
    public string ReturnedBy { get; set; } = null!; // Admin username
    public string Status { get; set; } = "Pending"; // "Pending", "Completed"
    public string? Notes { get; set; }
    
    // Soft delete
    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }
    public string? DeletedBy { get; set; }
    
    // Audit fields
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }
}
