using HabitHub.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace HabitHub.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Member> Members => Set<Member>();
    public DbSet<HabitTeam> HabitTeams => Set<HabitTeam>();
    public DbSet<Membership> Memberships => Set<Membership>();
    public DbSet<Habit> Habits => Set<Habit>();
    public DbSet<HabitEntry> HabitEntries => Set<HabitEntry>();
    public DbSet<Reminder> Reminders => Set<Reminder>();
    public DbSet<Session> Sessions => Set<Session>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<TeamChat> TeamChats => Set<TeamChat>();
    public DbSet<Message> Messages => Set<Message>();
    public DbSet<InviteCode> InviteCodes => Set<InviteCode>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.Entity<HabitTeam>()
            .HasOne(t => t.Chat)
            .WithOne(c => c.Team)
            .HasForeignKey<TeamChat>(c => c.HabitTeamId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Habit>()
            .HasOne(h => h.Creator)
            .WithMany(m => m.CreatedHabits)
            .HasForeignKey(h => h.CreatorId);
    }

}
