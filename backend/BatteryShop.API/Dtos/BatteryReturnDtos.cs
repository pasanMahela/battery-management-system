using System.ComponentModel.DataAnnotations;

namespace BatteryShop.API.Dtos;

public class BatteryReturnCreateDto
{
    [Required(ErrorMessage = "Battery ID is required")]
    public string BatteryId { get; set; } = null!;
    
    [Required(ErrorMessage = "Compensation type is required")]
    [RegularExpression("^(Money|Replacement)$", ErrorMessage = "Compensation type must be 'Money' or 'Replacement'")]
    public string CompensationType { get; set; } = null!;
    
    [Range(0, 10000000, ErrorMessage = "Money amount must be a positive value")]
    public decimal? MoneyAmount { get; set; }
    
    [StringLength(500)]
    public string? Notes { get; set; }
    
    // If compensation is replacement battery
    [StringLength(100)]
    public string? ReplacementSerialNumber { get; set; }
    
    [StringLength(100)]
    public string? ReplacementBarcode { get; set; }
    
    [StringLength(100)]
    public string? ReplacementBrand { get; set; }
    
    [StringLength(100)]
    public string? ReplacementModel { get; set; }
    
    public string? ReplacementCapacity { get; set; }
    
    [Range(1, 100)]
    public float? ReplacementVoltage { get; set; }
    
    [Range(0, 10000000)]
    public decimal? ReplacementPurchasePrice { get; set; }
    
    [Range(0, 10000000)]
    public decimal? ReplacementSellingPrice { get; set; }
    
    public DateTime? ReplacementPurchaseDate { get; set; }
    
    [Range(0, 10000)]
    public int? ReplacementStockQuantity { get; set; }
    
    [Range(1, 120)]
    public int? ReplacementWarrantyPeriodMonths { get; set; }
    
    [Range(1, 120)]
    public int? ReplacementShelfLifeMonths { get; set; }
    
    [StringLength(100)]
    public string? ReplacementSalesRep { get; set; }
    
    [StringLength(100)]
    public string? ReplacementInvoiceNumber { get; set; }
}

public class BatteryReturnUpdateDto
{
    [Required(ErrorMessage = "Status is required")]
    [RegularExpression("^(Pending|Completed)$", ErrorMessage = "Status must be 'Pending' or 'Completed'")]
    public string Status { get; set; } = null!;
    
    [StringLength(500)]
    public string? Notes { get; set; }
}
