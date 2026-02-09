using System.ComponentModel.DataAnnotations;

namespace BatteryShop.API.Dtos;

public record BatteryCreateDto(
    [Required(ErrorMessage = "Serial number is required")]
    [StringLength(100, MinimumLength = 1, ErrorMessage = "Serial number must be between 1 and 100 characters")]
    string SerialNumber,
    
    [StringLength(100)]
    string? Barcode,
    
    [Required(ErrorMessage = "Brand is required")]
    [StringLength(100, MinimumLength = 1, ErrorMessage = "Brand must be between 1 and 100 characters")]
    string Brand,
    
    [Required(ErrorMessage = "Model is required")]
    [StringLength(100, MinimumLength = 1, ErrorMessage = "Model must be between 1 and 100 characters")]
    string Model,
    
    [Range(0.1, 10000, ErrorMessage = "Capacity must be between 0.1 and 10000 Ah")]
    double Capacity,
    
    [Range(1, 100, ErrorMessage = "Voltage must be between 1 and 100 V")]
    double Voltage,
    
    [Range(0, 10000000, ErrorMessage = "Purchase price must be a positive value")]
    decimal PurchasePrice,
    
    [Range(0, 10000000, ErrorMessage = "Selling price must be a positive value")]
    decimal SellingPrice,
    
    [Required(ErrorMessage = "Purchase date is required")]
    DateTime PurchaseDate,
    
    [Range(0, 10000, ErrorMessage = "Stock quantity must be between 0 and 10000")]
    int StockQuantity,
    
    [Range(1, 120, ErrorMessage = "Warranty period must be between 1 and 120 months")]
    int WarrantyPeriodMonths,
    
    [Range(1, 120, ErrorMessage = "Shelf life must be between 1 and 120 months")]
    int ShelfLifeMonths,
    
    [StringLength(100)]
    string? SalesRep,
    
    [StringLength(100)]
    string? InvoiceNumber
);

public record BatteryUpdateDto(
    [Required(ErrorMessage = "Serial number is required")]
    [StringLength(100, MinimumLength = 1)]
    string SerialNumber,
    
    [StringLength(100)]
    string? Barcode,
    
    [Required(ErrorMessage = "Brand is required")]
    [StringLength(100, MinimumLength = 1)]
    string Brand,
    
    [Required(ErrorMessage = "Model is required")]
    [StringLength(100, MinimumLength = 1)]
    string Model,
    
    [Range(0.1, 10000)]
    double Capacity,
    
    [Range(1, 100)]
    double Voltage,
    
    [Range(0, 10000000)]
    decimal PurchasePrice,
    
    [Range(0, 10000000)]
    decimal SellingPrice,
    
    [Required]
    DateTime PurchaseDate,
    
    [Range(0, 10000)]
    int StockQuantity,
    
    [Range(1, 120)]
    int WarrantyPeriodMonths,
    
    [Range(1, 120)]
    int ShelfLifeMonths,
    
    [StringLength(100)]
    string? SalesRep,
    
    [StringLength(100)]
    string? InvoiceNumber
);
