using BatteryShop.API.Constants;
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
        _users = mongoDbService.Database.GetCollection<User>(AppConstants.Collections.Users);
        _configuration = configuration;
    }

    public async Task<User?> RegisterAsync(UserRegisterDto dto)
    {
        var existing = await _users.Find(u => u.Username == dto.Username && !u.IsDeleted).FirstOrDefaultAsync();
        if (existing != null) return null;

        var user = new User
        {
            Username = dto.Username,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password, workFactor: AppConstants.Defaults.BcryptWorkFactor),
            Role = dto.Role,
            CreatedAt = DateTime.UtcNow
        };
        await _users.InsertOneAsync(user);
        return user;
    }

    public async Task<string?> LoginAsync(UserLoginDto dto)
    {
        var user = await _users.Find(u => u.Username == dto.Username && !u.IsDeleted).FirstOrDefaultAsync();
        if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
        {
            return null;
        }

        // Update last login time
        var update = Builders<User>.Update.Set(u => u.LastLoginAt, DateTime.UtcNow);
        await _users.UpdateOneAsync(u => u.Id == user.Id, update);

        return GenerateJwtToken(user);
    }

    private string GenerateJwtToken(User user)
    {
        var jwtSettings = _configuration.GetSection("JwtSettings");
        var secretKey = jwtSettings["SecretKey"];
        
        if (string.IsNullOrEmpty(secretKey))
        {
            throw new InvalidOperationException("JWT SecretKey is not configured.");
        }
        
        var key = Encoding.ASCII.GetBytes(secretKey);
        var expiryDays = jwtSettings.GetValue<int>("ExpiryDays", AppConstants.Defaults.DefaultJwtExpiryDays);

        var tokenHandler = new JwtSecurityTokenHandler();
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.Name, user.Username),
                new Claim("role", user.Role),
                new Claim("id", user.Id!)
            }),
            Expires = DateTime.UtcNow.AddDays(expiryDays),
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    public async Task<bool> ChangePasswordAsync(string userId, string currentPassword, string newPassword)
    {
        var user = await _users.Find(u => u.Id == userId && !u.IsDeleted).FirstOrDefaultAsync();
        if (user == null)
        {
            return false;
        }

        if (!BCrypt.Net.BCrypt.Verify(currentPassword, user.PasswordHash))
        {
            return false;
        }

        var newPasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword, workFactor: AppConstants.Defaults.BcryptWorkFactor);
        var update = Builders<User>.Update.Set(u => u.PasswordHash, newPasswordHash);
        await _users.UpdateOneAsync(u => u.Id == userId, update);

        return true;
    }

    public async Task<List<User>> GetAllUsersAsync()
    {
        return await _users.Find(u => !u.IsDeleted).ToListAsync();
    }

    public async Task<bool> DeleteUserAsync(string userId)
    {
        // Soft delete
        var update = Builders<User>.Update
            .Set(u => u.IsDeleted, true)
            .Set(u => u.DeletedAt, DateTime.UtcNow);
        var result = await _users.UpdateOneAsync(u => u.Id == userId && !u.IsDeleted, update);
        return result.ModifiedCount > 0;
    }
}
