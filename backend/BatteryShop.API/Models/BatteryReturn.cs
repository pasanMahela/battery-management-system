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
}
