namespace BatteryShop.API.Dtos;

public class BatteryReturnCreateDto
{
    public string BatteryId { get; set; } = null!;
    public string CompensationType { get; set; } = null!; // "Money" or "Replacement"
    public decimal? MoneyAmount { get; set; }
    public string? Notes { get; set; }
    
    // If compensation is replacement battery
    public string? ReplacementSerialNumber { get; set; }
    public string? ReplacementBarcode { get; set; }
    public string? ReplacementBrand { get; set; }
    public string? ReplacementModel { get; set; }
    public string? ReplacementCapacity { get; set; }
    public float? ReplacementVoltage { get; set; }
    public decimal? ReplacementPurchasePrice { get; set; }
    public decimal? ReplacementSellingPrice { get; set; }
    public DateTime? ReplacementPurchaseDate { get; set; }
    public int? ReplacementStockQuantity { get; set; }
    public int? ReplacementWarrantyPeriodMonths { get; set; }
    public int? ReplacementShelfLifeMonths { get; set; }
    public string? ReplacementSalesRep { get; set; }
    public string? ReplacementInvoiceNumber { get; set; }
}

public class BatteryReturnUpdateDto
{
    public string Status { get; set; } = null!;
    public string? Notes { get; set; }
}
