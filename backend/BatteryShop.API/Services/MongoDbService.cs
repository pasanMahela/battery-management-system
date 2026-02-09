using BatteryShop.API.Models;
using BatteryShop.API.Settings;
using Microsoft.Extensions.Options;
using MongoDB.Driver;

namespace BatteryShop.API.Services;

public class MongoDbService
{
    private readonly IMongoDatabase _database;
    private readonly IMongoClient _client;

    public MongoDbService(IOptions<MongoDBSettings> settings)
    {
        var connectionString = settings.Value.ConnectionString;
        
        // Add server selection timeout so app doesn't hang if MongoDB is unreachable
        var mongoSettings = MongoClientSettings.FromConnectionString(connectionString);
        mongoSettings.ServerSelectionTimeout = TimeSpan.FromSeconds(10);
        mongoSettings.ConnectTimeout = TimeSpan.FromSeconds(10);
        
        _client = new MongoClient(mongoSettings);
        _database = _client.GetDatabase(settings.Value.DatabaseName);
        
        // Create indexes asynchronously with timeout
        try
        {
            CreateIndexesAsync().Wait(TimeSpan.FromSeconds(30));
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Warning: Index creation failed during startup: {ex.Message}");
        }
    }

    public IMongoDatabase Database => _database;
    public IMongoClient Client => _client;

    private async Task CreateIndexesAsync()
    {
        try
        {
            // Battery indexes
            var batteries = _database.GetCollection<Battery>("Batteries");
            var batteryIndexes = new List<CreateIndexModel<Battery>>
            {
                new CreateIndexModel<Battery>(
                    Builders<Battery>.IndexKeys.Ascending(b => b.SerialNumber),
                    new CreateIndexOptions { Unique = true, Background = true }
                ),
                new CreateIndexModel<Battery>(
                    Builders<Battery>.IndexKeys.Ascending(b => b.Barcode),
                    new CreateIndexOptions { Sparse = true, Background = true }
                ),
                new CreateIndexModel<Battery>(
                    Builders<Battery>.IndexKeys.Ascending(b => b.Brand).Ascending(b => b.Model),
                    new CreateIndexOptions { Background = true }
                ),
                new CreateIndexModel<Battery>(
                    Builders<Battery>.IndexKeys.Ascending(b => b.IsDeleted),
                    new CreateIndexOptions { Background = true }
                ),
                new CreateIndexModel<Battery>(
                    Builders<Battery>.IndexKeys.Ascending(b => b.PurchaseDate),
                    new CreateIndexOptions { Background = true }
                )
            };
            await batteries.Indexes.CreateManyAsync(batteryIndexes);

            // Sale indexes
            var sales = _database.GetCollection<Sale>("Sales");
            var saleIndexes = new List<CreateIndexModel<Sale>>
            {
                new CreateIndexModel<Sale>(
                    Builders<Sale>.IndexKeys.Ascending(s => s.InvoiceNumber),
                    new CreateIndexOptions { Unique = true, Background = true }
                ),
                new CreateIndexModel<Sale>(
                    Builders<Sale>.IndexKeys.Ascending(s => s.CustomerPhone),
                    new CreateIndexOptions { Background = true }
                ),
                new CreateIndexModel<Sale>(
                    Builders<Sale>.IndexKeys.Ascending(s => s.CustomerId),
                    new CreateIndexOptions { Sparse = true, Background = true }
                ),
                new CreateIndexModel<Sale>(
                    Builders<Sale>.IndexKeys.Descending(s => s.Date),
                    new CreateIndexOptions { Background = true }
                ),
                new CreateIndexModel<Sale>(
                    Builders<Sale>.IndexKeys.Ascending(s => s.IsDeleted),
                    new CreateIndexOptions { Background = true }
                )
            };
            await sales.Indexes.CreateManyAsync(saleIndexes);

            // User indexes
            var users = _database.GetCollection<User>("Users");
            var userIndexes = new List<CreateIndexModel<User>>
            {
                new CreateIndexModel<User>(
                    Builders<User>.IndexKeys.Ascending(u => u.Username),
                    new CreateIndexOptions { Unique = true, Background = true }
                )
            };
            await users.Indexes.CreateManyAsync(userIndexes);

            // ActivityLog indexes
            var activityLogs = _database.GetCollection<ActivityLog>("ActivityLogs");
            var activityLogIndexes = new List<CreateIndexModel<ActivityLog>>
            {
                new CreateIndexModel<ActivityLog>(
                    Builders<ActivityLog>.IndexKeys.Descending(l => l.Timestamp),
                    new CreateIndexOptions { Background = true }
                ),
                new CreateIndexModel<ActivityLog>(
                    Builders<ActivityLog>.IndexKeys.Ascending(l => l.EntityType),
                    new CreateIndexOptions { Background = true }
                ),
                new CreateIndexModel<ActivityLog>(
                    Builders<ActivityLog>.IndexKeys.Ascending(l => l.Action),
                    new CreateIndexOptions { Background = true }
                ),
                new CreateIndexModel<ActivityLog>(
                    Builders<ActivityLog>.IndexKeys.Ascending(l => l.UserId),
                    new CreateIndexOptions { Background = true }
                )
            };
            await activityLogs.Indexes.CreateManyAsync(activityLogIndexes);

            // BatteryReturn indexes
            var returns = _database.GetCollection<BatteryReturn>("BatteryReturns");
            var returnIndexes = new List<CreateIndexModel<BatteryReturn>>
            {
                new CreateIndexModel<BatteryReturn>(
                    Builders<BatteryReturn>.IndexKeys.Ascending(r => r.BatteryId),
                    new CreateIndexOptions { Background = true }
                ),
                new CreateIndexModel<BatteryReturn>(
                    Builders<BatteryReturn>.IndexKeys.Descending(r => r.ReturnDate),
                    new CreateIndexOptions { Background = true }
                ),
                new CreateIndexModel<BatteryReturn>(
                    Builders<BatteryReturn>.IndexKeys.Ascending(r => r.IsDeleted),
                    new CreateIndexOptions { Background = true }
                )
            };
            await returns.Indexes.CreateManyAsync(returnIndexes);
        }
        catch (Exception ex)
        {
            // Log index creation errors but don't fail startup
            Console.WriteLine($"Warning: Could not create indexes: {ex.Message}");
        }
    }
}
