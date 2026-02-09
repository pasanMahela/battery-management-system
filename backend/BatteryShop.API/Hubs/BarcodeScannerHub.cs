using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;

namespace BatteryShop.API.Hubs;

public class BarcodeScannerHub : Hub
{
    // sessionId → desktop connectionId (tracks who owns the session)
    private static readonly ConcurrentDictionary<string, string> _activeSessions = new();
    // connectionId → sessionId (for cleanup on disconnect)
    private static readonly ConcurrentDictionary<string, string> _connectionSessions = new();

    // Desktop creates a scanning session
    public async Task CreateSession(string sessionId)
    {
        _activeSessions[sessionId] = Context.ConnectionId;
        _connectionSessions[Context.ConnectionId] = sessionId;
        await Groups.AddToGroupAsync(Context.ConnectionId, sessionId);
    }

    // Phone joins an existing session — validates it still exists
    public async Task JoinSession(string sessionId)
    {
        if (!_activeSessions.ContainsKey(sessionId))
        {
            // Session doesn't exist or desktop already left
            await Clients.Caller.SendAsync("SessionEnded");
            return;
        }

        _connectionSessions[Context.ConnectionId] = sessionId;
        await Groups.AddToGroupAsync(Context.ConnectionId, sessionId);
        await Clients.OthersInGroup(sessionId).SendAsync("DeviceConnected", Context.ConnectionId);
    }

    // Phone sends a scanned barcode to the session
    public async Task SendBarcode(string sessionId, string barcode)
    {
        if (!_activeSessions.ContainsKey(sessionId))
        {
            await Clients.Caller.SendAsync("SessionEnded");
            return;
        }
        await Clients.OthersInGroup(sessionId).SendAsync("BarcodeReceived", barcode);
    }

    // Either side can leave
    public async Task LeaveSession(string sessionId)
    {
        _connectionSessions.TryRemove(Context.ConnectionId, out _);

        // If the desktop is leaving, destroy the session
        if (_activeSessions.TryGetValue(sessionId, out var desktopConnId) && desktopConnId == Context.ConnectionId)
        {
            _activeSessions.TryRemove(sessionId, out _);
        }

        await Clients.OthersInGroup(sessionId).SendAsync("DeviceDisconnected", Context.ConnectionId);
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, sessionId);
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        if (_connectionSessions.TryRemove(Context.ConnectionId, out var sessionId))
        {
            // If this was the desktop, destroy the session
            if (_activeSessions.TryGetValue(sessionId, out var desktopConnId) && desktopConnId == Context.ConnectionId)
            {
                _activeSessions.TryRemove(sessionId, out _);
            }

            await Clients.OthersInGroup(sessionId).SendAsync("DeviceDisconnected", Context.ConnectionId);
        }
        await base.OnDisconnectedAsync(exception);
    }
}
