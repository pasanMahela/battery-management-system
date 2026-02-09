using MongoDB.Driver;
using BatteryShop.API.Constants;
using BatteryShop.API.Models;

namespace BatteryShop.API;

/// <summary>
/// Simple utility to create the first admin user
/// Run this once to initialize your system with an admin account
/// </summary>
public class CreateFirstAdmin
{
    public static async Task Main(string[] args)
    {
        Console.WriteLine("=== Battery Shop - Create First Admin ===\n");

        // MongoDB connection
        var connectionString = "mongodb://localhost:27017"; // Update if different
        var databaseName = "BatteryShopDB";

        var client = new MongoClient(connectionString);
        var database = client.GetDatabase(databaseName);
        var users = database.GetCollection<User>(AppConstants.Collections.Users);

        // Check if admin already exists
        var existingAdmin = await users.Find(u => u.Role == AppConstants.Roles.Admin).FirstOrDefaultAsync();
        if (existingAdmin != null)
        {
            Console.WriteLine("⚠️  An admin user already exists!");
            Console.WriteLine($"Username: {existingAdmin.Username}");
            Console.WriteLine("\nIf you need to reset, delete the user from MongoDB first.");
            return;
        }

        // Get admin details
        Console.Write("Enter admin username: ");
        var username = Console.ReadLine();

        Console.Write("Enter admin password: ");
        var password = Console.ReadLine();

        if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
        {
            Console.WriteLine("\n❌ Username and password cannot be empty!");
            return;
        }

        // Hash password using BCrypt
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(password);

        // Create admin user
        var adminUser = new User
        {
            Username = username,
            PasswordHash = passwordHash,
            Role = AppConstants.Roles.Admin
        };

        await users.InsertOneAsync(adminUser);

        Console.WriteLine("\n✅ Admin user created successfully!");
        Console.WriteLine($"Username: {username}");
        Console.WriteLine($"Role: Admin");
        Console.WriteLine("\nYou can now log in to the application.");
    }
}
