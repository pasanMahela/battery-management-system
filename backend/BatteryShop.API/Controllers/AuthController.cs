using BatteryShop.API.Dtos;
using BatteryShop.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace BatteryShop.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly AuthService _authService;
    private readonly ActivityLogService _log;

    public AuthController(AuthService authService, ActivityLogService activityLogService)
    {
        _authService = authService;
        _log = activityLogService;
    }

    [HttpPost("register")]
    [Authorize(Roles = "Admin")]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> Register(UserRegisterDto dto)
    {
        var user = await _authService.RegisterAsync(dto);
        if (user == null) return BadRequest("User already exists");
        
        var adminId = User.FindFirst("id")?.Value;
        var adminName = User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value;
        _log.Log("Created", "User", user.Id, $"Registered new user '{user.Username}' with role '{user.Role}'", adminId, adminName);
        return Ok(new { user.Id, user.Username, user.Role });
    }

    [HttpPost("login")]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> Login(UserLoginDto dto)
    {
        try
        {
            var token = await _authService.LoginAsync(dto);
            if (token == null)
            {
                _log.Log("LoginFailed", "Auth", null, $"Failed login attempt for username '{dto.Username}'");
                return Unauthorized("Invalid credentials");
            }
            
            _log.Log("Login", "Auth", null, $"User '{dto.Username}' logged in");
            return Ok(new { token });
        }
        catch (TimeoutException)
        {
            return StatusCode(503, "Database is temporarily unavailable. Please try again in a moment.");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Login error: {ex.Message}");
            return StatusCode(500, "An unexpected error occurred. Please try again.");
        }
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
        
        var adminId = User.FindFirst("id")?.Value;
        var adminName = User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value;
        _log.Log("Deleted", "User", id, $"Deleted user (ID: {id})", adminId, adminName);
        return Ok(new { message = "User deleted successfully" });
    }

    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword(ChangePasswordDto dto)
    {
        var userId = User.FindFirst("id")?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var success = await _authService.ChangePasswordAsync(userId, dto.CurrentPassword, dto.NewPassword);
        if (!success)
        {
            return BadRequest(new { message = "Current password is incorrect" });
        }

        var username = User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value;
        _log.Log("PasswordChanged", "Auth", userId, $"User '{username}' changed their password", userId, username);
        return Ok(new { message = "Password changed successfully" });
    }
}
