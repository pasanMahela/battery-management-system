using BatteryShop.API.Dtos;
using BatteryShop.API.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using MongoDB.Driver;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace BatteryShop.API.Services;

public class AuthService
{
    private readonly IMongoCollection<User> _users;
    private readonly IConfiguration _configuration;

    public AuthService(MongoDbService mongoDbService, IConfiguration configuration)
    {
        _users = mongoDbService.Database.GetCollection<User>("Users");
        _configuration = configuration;
        // Optionally ensure indexes here or in a separate startup task
    }

    public async Task<User?> RegisterAsync(UserRegisterDto dto)
    {
        var existing = await _users.Find(u => u.Username == dto.Username).FirstOrDefaultAsync();
        if (existing != null) return null;

        var user = new User
        {
            Username = dto.Username,
            // Use work factor of 10 for faster hashing while maintaining security
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password, workFactor: 10),
            Role = dto.Role
        };
        await _users.InsertOneAsync(user);
        return user;
    }

    public async Task<string?> LoginAsync(UserLoginDto dto)
    {
        var user = await _users.Find(u => u.Username == dto.Username).FirstOrDefaultAsync();
        if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
        {
            return null;
        }

        return GenerateJwtToken(user);
    }

    private string GenerateJwtToken(User user)
    {
        var jwtSettings = _configuration.GetSection("JwtSettings");
        var secretKey = jwtSettings["SecretKey"];
        var key = Encoding.ASCII.GetBytes(secretKey ?? "super_secret_key_that_is_long_enough_for_hmac_sha256");

        var tokenHandler = new JwtSecurityTokenHandler();
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.Name, user.Username),
                new Claim("role", user.Role),
                new Claim("id", user.Id!)
            }),
            Expires = DateTime.UtcNow.AddDays(7),
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    public async Task<bool> ChangePasswordAsync(string userId, string currentPassword, string newPassword)
    {
        var user = await _users.Find(u => u.Id == userId).FirstOrDefaultAsync();
        if (user == null)
        {
            return false;
        }

        // Verify current password
        if (!BCrypt.Net.BCrypt.Verify(currentPassword, user.PasswordHash))
        {
            return false;
        }

        // Hash and update new password (work factor 10 for performance)
        var newPasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword, workFactor: 10);
        var update = Builders<User>.Update.Set(u => u.PasswordHash, newPasswordHash);
        await _users.UpdateOneAsync(u => u.Id == userId, update);

        return true;
    }

    public async Task<List<User>> GetAllUsersAsync()
    {
        return await _users.Find(_ => true).ToListAsync();
    }

    public async Task<bool> DeleteUserAsync(string userId)
    {
        var result = await _users.DeleteOneAsync(u => u.Id == userId);
        return result.DeletedCount > 0;
    }
}
