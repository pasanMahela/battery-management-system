using System.ComponentModel.DataAnnotations;

namespace BatteryShop.API.Dtos;

public record UserLoginDto(
    [Required(ErrorMessage = "Username is required")]
    [StringLength(50, MinimumLength = 3, ErrorMessage = "Username must be between 3 and 50 characters")]
    string Username,
    
    [Required(ErrorMessage = "Password is required")]
    string Password
);

public record UserRegisterDto(
    [Required(ErrorMessage = "Username is required")]
    [StringLength(50, MinimumLength = 3, ErrorMessage = "Username must be between 3 and 50 characters")]
    string Username,
    
    [Required(ErrorMessage = "Password is required")]
    string Password,
    
    [Required(ErrorMessage = "Role is required")]
    [RegularExpression("^(Admin|Cashier)$", ErrorMessage = "Role must be either 'Admin' or 'Cashier'")]
    string Role
);
