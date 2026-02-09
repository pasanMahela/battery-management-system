using BatteryShop.API.Models;
using MongoDB.Driver;

namespace BatteryShop.API.Services;

public class ActivityLogService
{
    private readonly IMongoCollection<ActivityLog> _logs;

    public ActivityLogService(MongoDbService mongoDbService)
    {
        _logs = mongoDbService.Database.GetCollection<ActivityLog>("ActivityLogs");
    }

    /// <summary>
    /// Log an activity. Fire-and-forget safe — exceptions are swallowed.
    /// </summary>
    public async Task LogAsync(string action, string entityType, string? entityId, string description, string? userId = null, string? username = null, string? details = null)
    {
        try
        {
            var log = new ActivityLog
            {
                Action = action,
                EntityType = entityType,
                EntityId = entityId,
                Description = description,
                UserId = userId,
                Username = username,
                Details = details,
                Timestamp = DateTime.UtcNow
            };
            await _logs.InsertOneAsync(log);
        }
        catch
        {
            // Logging should never break business operations
        }
    }

    /// <summary>
    /// Fire-and-forget wrapper — call from controllers without awaiting.
    /// </summary>
    public void Log(string action, string entityType, string? entityId, string description, string? userId = null, string? username = null, string? details = null)
    {
        _ = Task.Run(() => LogAsync(action, entityType, entityId, description, userId, username, details));
    }

    public async Task<(List<ActivityLog> Items, long TotalCount)> GetLogsAsync(
        int page = 1,
        int pageSize = 50,
        string? entityType = null,
        string? action = null,
        string? userId = null,
        DateTime? startDate = null,
        DateTime? endDate = null,
        string? search = null)
    {
        var filterBuilder = Builders<ActivityLog>.Filter;
        var filters = new List<FilterDefinition<ActivityLog>>();

        if (!string.IsNullOrEmpty(entityType))
            filters.Add(filterBuilder.Eq(l => l.EntityType, entityType));

        if (!string.IsNullOrEmpty(action))
            filters.Add(filterBuilder.Eq(l => l.Action, action));

        if (!string.IsNullOrEmpty(userId))
            filters.Add(filterBuilder.Eq(l => l.UserId, userId));

        if (startDate.HasValue)
            filters.Add(filterBuilder.Gte(l => l.Timestamp, startDate.Value));

        if (endDate.HasValue)
            filters.Add(filterBuilder.Lte(l => l.Timestamp, endDate.Value.Date.AddDays(1)));

        if (!string.IsNullOrEmpty(search))
        {
            var searchFilter = filterBuilder.Or(
                filterBuilder.Regex(l => l.Description, new MongoDB.Bson.BsonRegularExpression(search, "i")),
                filterBuilder.Regex(l => l.Username, new MongoDB.Bson.BsonRegularExpression(search, "i")),
                filterBuilder.Regex(l => l.EntityId, new MongoDB.Bson.BsonRegularExpression(search, "i"))
            );
            filters.Add(searchFilter);
        }

        var combinedFilter = filters.Count > 0
            ? filterBuilder.And(filters)
            : filterBuilder.Empty;

        var totalCount = await _logs.CountDocumentsAsync(combinedFilter);

        var skip = (page - 1) * pageSize;
        var items = await _logs
            .Find(combinedFilter)
            .SortByDescending(l => l.Timestamp)
            .Skip(skip)
            .Limit(pageSize)
            .ToListAsync();

        return (items, totalCount);
    }

    public async Task<object> GetStatsAsync(DateTime? startDate = null, DateTime? endDate = null)
    {
        var filterBuilder = Builders<ActivityLog>.Filter;
        var filters = new List<FilterDefinition<ActivityLog>>();

        if (startDate.HasValue)
            filters.Add(filterBuilder.Gte(l => l.Timestamp, startDate.Value));
        if (endDate.HasValue)
            filters.Add(filterBuilder.Lte(l => l.Timestamp, endDate.Value.Date.AddDays(1)));

        var combinedFilter = filters.Count > 0
            ? filterBuilder.And(filters)
            : filterBuilder.Empty;

        var allLogs = await _logs.Find(combinedFilter).ToListAsync();

        return new
        {
            total = allLogs.Count,
            byEntityType = allLogs.GroupBy(l => l.EntityType).Select(g => new { type = g.Key, count = g.Count() }).OrderByDescending(x => x.count),
            byAction = allLogs.GroupBy(l => l.Action).Select(g => new { action = g.Key, count = g.Count() }).OrderByDescending(x => x.count),
            byUser = allLogs.GroupBy(l => l.Username ?? "System").Select(g => new { user = g.Key, count = g.Count() }).OrderByDescending(x => x.count)
        };
    }
}
