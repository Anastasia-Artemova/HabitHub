using HabitHub.Api.Data;
using HabitHub.Api.Enums;
using Microsoft.EntityFrameworkCore;

namespace HabitHub.Api.Services.Background;

public class AutoArchiveHabitsService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<AutoArchiveHabitsService> _logger;
    private readonly TimeSpan _interval = TimeSpan.FromMinutes(5);

    public AutoArchiveHabitsService(
        IServiceScopeFactory scopeFactory,
        ILogger<AutoArchiveHabitsService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("AutoArchiveHabitsService started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ArchiveExpiredHabitsAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while auto-archiving habits.");
            }

            await Task.Delay(_interval, stoppingToken);
        }
    }

    public async Task ArchiveExpiredHabitsAsync(CancellationToken cancellationToken = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var now = DateTime.UtcNow;

        var expiredHabits = await db.Habits
            .Include(h => h.Reminders)
            .Where(h => h.HabitState == HabitState.Active && h.ExpiryDate <= now)
            .ToListAsync(cancellationToken);

        if (expiredHabits.Count == 0)
            return;

        foreach (var habit in expiredHabits)
        {
            habit.HabitState = HabitState.Archived;

            // Per spec (section 6.4.3): disable reminders when habit becomes inactive
            foreach (var reminder in habit.Reminders)
            {
                reminder.Enabled = false;
            }
        }

        await db.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Auto-archived {Count} habit(s).", expiredHabits.Count);
    }
}
