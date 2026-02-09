using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace BatteryShop.API.Models;

public class Sale
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    public string InvoiceNumber { get; set; } = null!;

    public string CustomerName { get; set; } = null!;
    public string CustomerPhone { get; set; } = null!;
    public string CustomerId { get; set; } = null!;
    public DateTime Date { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal Discount { get; set; }
    public string CashierId { get; set; } = null!;
    public string CashierName { get; set; } = null!;
    public List<SaleItem> Items { get; set; } = new();
    
    // Soft delete
    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }
    public string? DeletedBy { get; set; }
    
    // Audit fields
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class SaleItem
{
    public string BatteryId { get; set; } = null!;
    public string SerialNumber { get; set; } = null!;
    public string Brand { get; set; } = null!;
    public string Model { get; set; } = null!;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal PurchasePrice { get; set; } // Store purchase price for accurate profit calculation
    public decimal Subtotal { get; set; }
    public int WarrantyPeriodMonths { get; set; }
    public DateTime WarrantyStartDate { get; set; }
    public DateTime WarrantyExpiryDate { get; set; }
}
