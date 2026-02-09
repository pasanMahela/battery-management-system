using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace BatteryShop.API.Models;

public class Battery
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    public string SerialNumber { get; set; } = null!;
    public string? Barcode { get; set; }
    public string Brand { get; set; } = null!;
    public string Model { get; set; } = null!;
    public double Capacity { get; set; } // Ah
    public double Voltage { get; set; }
    public decimal PurchasePrice { get; set; }
    public decimal SellingPrice { get; set; }
    public DateTime PurchaseDate { get; set; }
    public int StockQuantity { get; set; }
    public int WarrantyPeriodMonths { get; set; }
    public int ShelfLifeMonths { get; set; } // Storage duration before battery expires
    public string? SalesRep { get; set; }
    public string? InvoiceNumber { get; set; }
    
    // Return tracking
    public bool IsReturned { get; set; } = false;
    public string? ReturnId { get; set; }
    
    // Soft delete
    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }
    public string? DeletedBy { get; set; }
    
    // Audit fields
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }
}
