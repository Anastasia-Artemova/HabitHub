using HabitHub.Api.Data;
using HabitHub.Api.Enums;
using HabitHub.Api.Models;
using HabitHub.Api.Services.Background;
using HabitHub.Tests.Helpers;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;

namespace HabitHub.Tests.Services;

public class AutoArchiveHabitsServiceTests
{
    private static (AutoArchiveHabitsService service, AppDbContext db) CreateService()
    {
        var dbName = Guid.NewGuid().ToString();
        var dbRoot = new InMemoryDatabaseRoot();

        var dbOptions = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(dbName, dbRoot)
            .Options;

        var db = new AppDbContext(dbOptions);

        var services = new ServiceCollection();

        services.AddDbContext<AppDbContext>(options =>
            options.UseInMemoryDatabase(dbName, dbRoot));

        var provider = services.BuildServiceProvider();

        var scopeFactory = provider.GetRequiredService<IServiceScopeFactory>();
        var logger = new Mock<ILogger<AutoArchiveHabitsService>>();

        var service = new AutoArchiveHabitsService(scopeFactory, logger.Object);

        return (service, db);
    }

    [Fact]
    public async Task ArchiveExpiredHabits_ArchivesHabitsPastExpiryDate()
    {
        var (service, db) = CreateService();

        var creator = TestHelper.SeedMember(db);
        var team = TestHelper.SeedTeam(db, creator.MemberId);

        var expiredHabit = TestHelper.SeedHabit(
            db,
            team.HabitTeamId,
            creator.MemberId,
            name: "Expired",
            state: HabitState.Active,
            expiryDate: DateTime.UtcNow.AddDays(-1));

        var futureHabit = TestHelper.SeedHabit(
            db,
            team.HabitTeamId,
            creator.MemberId,
            name: "Future",
            state: HabitState.Active,
            expiryDate: DateTime.UtcNow.AddDays(1));

        await service.ArchiveExpiredHabitsAsync();

        db.ChangeTracker.Clear();

        var archivedHabit = await db.Habits.FindAsync(expiredHabit.HabitId);
        var stillActiveHabit = await db.Habits.FindAsync(futureHabit.HabitId);

        Assert.NotNull(archivedHabit);
        Assert.NotNull(stillActiveHabit);

        Assert.Equal(HabitState.Archived, archivedHabit!.HabitState);
        Assert.Equal(HabitState.Active, stillActiveHabit!.HabitState);
    }

    [Fact]
    public async Task ArchiveExpiredHabits_DoesNothingWhenNoExpiredHabits()
    {
        var (service, db) = CreateService();

        var creator = TestHelper.SeedMember(db);
        var team = TestHelper.SeedTeam(db, creator.MemberId);

        var futureHabit = TestHelper.SeedHabit(
            db,
            team.HabitTeamId,
            creator.MemberId,
            name: "Future",
            state: HabitState.Active,
            expiryDate: DateTime.UtcNow.AddDays(30));

        await service.ArchiveExpiredHabitsAsync();

        db.ChangeTracker.Clear();

        var habit = await db.Habits.FindAsync(futureHabit.HabitId);

        Assert.NotNull(habit);
        Assert.Equal(HabitState.Active, habit!.HabitState);
    }

    [Fact]
    public async Task ArchiveExpiredHabits_DoesNotReArchiveAlreadyArchivedHabits()
    {
        var (service, db) = CreateService();

        var creator = TestHelper.SeedMember(db);
        var team = TestHelper.SeedTeam(db, creator.MemberId);

        var alreadyArchivedHabit = TestHelper.SeedHabit(
            db,
            team.HabitTeamId,
            creator.MemberId,
            name: "Already archived",
            state: HabitState.Archived,
            expiryDate: DateTime.UtcNow.AddDays(-5));

        await service.ArchiveExpiredHabitsAsync();

        db.ChangeTracker.Clear();

        var habit = await db.Habits.FindAsync(alreadyArchivedHabit.HabitId);

        Assert.NotNull(habit);
        Assert.Equal(HabitState.Archived, habit!.HabitState);
    }

    [Fact]
    public async Task ArchiveExpiredHabits_DisablesRemindersForArchivedHabits()
    {
        var (service, db) = CreateService();

        var creator = TestHelper.SeedMember(db);
        var team = TestHelper.SeedTeam(db, creator.MemberId);

        var expiredHabit = TestHelper.SeedHabit(
            db,
            team.HabitTeamId,
            creator.MemberId,
            name: "Expired with reminder",
            state: HabitState.Active,
            expiryDate: DateTime.UtcNow.AddDays(-1));

        var reminder = new Reminder
        {
            ReminderId = Guid.NewGuid(),
            HabitId = expiredHabit.HabitId,
            MemberId = creator.MemberId,
            Enabled = true,
            LastSentAt = DateTime.UtcNow.AddDays(-1)
        };

        db.Reminders.Add(reminder);
        await db.SaveChangesAsync();

        await service.ArchiveExpiredHabitsAsync();

        db.ChangeTracker.Clear();

        var updatedHabit = await db.Habits.FindAsync(expiredHabit.HabitId);
        var updatedReminder = await db.Reminders.FindAsync(reminder.ReminderId);

        Assert.NotNull(updatedHabit);
        Assert.NotNull(updatedReminder);

        Assert.Equal(HabitState.Archived, updatedHabit!.HabitState);
        Assert.False(updatedReminder!.Enabled);
    }

    [Fact]
    public async Task ArchiveExpiredHabits_DoesNotDisableRemindersForFutureHabits()
    {
        var (service, db) = CreateService();

        var creator = TestHelper.SeedMember(db);
        var team = TestHelper.SeedTeam(db, creator.MemberId);

        var futureHabit = TestHelper.SeedHabit(
            db,
            team.HabitTeamId,
            creator.MemberId,
            name: "Future with reminder",
            state: HabitState.Active,
            expiryDate: DateTime.UtcNow.AddDays(1));

        var reminder = new Reminder
        {
            ReminderId = Guid.NewGuid(),
            HabitId = futureHabit.HabitId,
            MemberId = creator.MemberId,
            Enabled = true,
            LastSentAt = DateTime.UtcNow.AddDays(-1)
        };

        db.Reminders.Add(reminder);
        await db.SaveChangesAsync();

        await service.ArchiveExpiredHabitsAsync();

        db.ChangeTracker.Clear();

        var updatedHabit = await db.Habits.FindAsync(futureHabit.HabitId);
        var updatedReminder = await db.Reminders.FindAsync(reminder.ReminderId);

        Assert.NotNull(updatedHabit);
        Assert.NotNull(updatedReminder);

        Assert.Equal(HabitState.Active, updatedHabit!.HabitState);
        Assert.True(updatedReminder!.Enabled);
    }

    [Fact]
    public async Task ArchiveExpiredHabits_ArchivesOnlyActiveExpiredHabits()
    {
        var (service, db) = CreateService();

        var creator = TestHelper.SeedMember(db);
        var team = TestHelper.SeedTeam(db, creator.MemberId);

        var activeExpiredHabit = TestHelper.SeedHabit(
            db,
            team.HabitTeamId,
            creator.MemberId,
            name: "Active expired",
            state: HabitState.Active,
            expiryDate: DateTime.UtcNow.AddDays(-1));

        var archivedExpiredHabit = TestHelper.SeedHabit(
            db,
            team.HabitTeamId,
            creator.MemberId,
            name: "Archived expired",
            state: HabitState.Archived,
            expiryDate: DateTime.UtcNow.AddDays(-1));

        var closedExpiredHabit = TestHelper.SeedHabit(
            db,
            team.HabitTeamId,
            creator.MemberId,
            name: "Closed expired",
            state: HabitState.Closed,
            expiryDate: DateTime.UtcNow.AddDays(-1));

        await service.ArchiveExpiredHabitsAsync();

        db.ChangeTracker.Clear();

        var activeHabit = await db.Habits.FindAsync(activeExpiredHabit.HabitId);
        var archivedHabit = await db.Habits.FindAsync(archivedExpiredHabit.HabitId);
        var closedHabit = await db.Habits.FindAsync(closedExpiredHabit.HabitId);

        Assert.NotNull(activeHabit);
        Assert.NotNull(archivedHabit);
        Assert.NotNull(closedHabit);

        Assert.Equal(HabitState.Archived, activeHabit!.HabitState);
        Assert.Equal(HabitState.Archived, archivedHabit!.HabitState);
        Assert.Equal(HabitState.Closed, closedHabit!.HabitState);
    }
}