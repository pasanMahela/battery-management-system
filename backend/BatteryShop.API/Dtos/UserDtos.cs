namespace BatteryShop.API.Dtos;

public record UserLoginDto(string Username, string Password);
public record UserRegisterDto(string Username, string Password, string Role);
