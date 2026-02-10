using System.ComponentModel.DataAnnotations;

namespace BatteryShop.API.Dtos;

public record SaleCreateDto(
    [Required(ErrorMessage = "Customer name is required")]
    [StringLength(200, MinimumLength = 1, ErrorMessage = "Customer name must be between 1 and 200 characters")]
    string CustomerName,
    
    [Required(ErrorMessage = "Customer phone is required")]
    [StringLength(20, MinimumLength = 10, ErrorMessage = "Phone number must be between 10 and 20 characters")]
    string CustomerPhone,
    
    [StringLength(50)]
    string CustomerId,
    
    [Range(0, 10000000, ErrorMessage = "Discount must be a positive value")]
    decimal Discount,
    
    decimal? PaidAmount,
    decimal? Balance,
    
    [Required(ErrorMessage = "At least one item is required")]
    [MinLength(1, ErrorMessage = "At least one item is required")]
    List<SaleItemDto> Items
);

public record SaleItemDto(
    [Required(ErrorMessage = "Battery ID is required")]
    string BatteryId,
    
    [Range(1, 1000, ErrorMessage = "Quantity must be between 1 and 1000")]
    int Quantity
);
