using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace BatteryShop.API.Models;

public class ActivityLog
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    public string Action { get; set; } = null!;       // Created, Updated, Deleted, Login, PasswordChanged, etc.
    public string EntityType { get; set; } = null!;    // Battery, Sale, Return, User, Auth
    public string? EntityId { get; set; }
    public string Description { get; set; } = null!;   // Human-readable summary
    public string? UserId { get; set; }
    public string? Username { get; set; }
    public string? Details { get; set; }                // Optional extra context (JSON string)
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
