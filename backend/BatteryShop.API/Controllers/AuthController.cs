using BatteryShop.API.Dtos;
using BatteryShop.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BatteryShop.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly AuthService _authService;

    public AuthController(AuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Register(UserRegisterDto dto)
    {
        var user = await _authService.RegisterAsync(dto);
        if (user == null) return BadRequest("User already exists");
        
        return Ok(new { user.Id, user.Username, user.Role });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(UserLoginDto dto)
    {
        var token = await _authService.LoginAsync(dto);
        if (token == null) return Unauthorized("Invalid credentials");
        
        return Ok(new { token });
    }

    [HttpGet("users")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetUsers()
    {
        var users = await _authService.GetAllUsersAsync();
        return Ok(users.Select(u => new { u.Id, u.Username, u.Role }));
    }

    [HttpDelete("users/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteUser(string id)
    {
        var deleted = await _authService.DeleteUserAsync(id);
        if (!deleted) return NotFound("User not found");
        
        return Ok(new { message = "User deleted successfully" });
    }
}
