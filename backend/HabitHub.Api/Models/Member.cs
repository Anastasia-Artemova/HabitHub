
using System.ComponentModel.DataAnnotations;

namespace HabitHub.Api.Models;

public class Member
{
    public Guid MemberId { get; set; }
    public string Name { get; set; } = null!;
    [Required]
    public string Email { get; set; } = null!;
    public string PasswordHash { get; set; } = null!;
    public string Timezone { get; set; } = "UTC";

    public ICollection<Membership> Memberships { get; set; } = new List<Membership>();
    public ICollection<Session> Sessions { get; set; } = new List<Session>();
    public ICollection<Message> SentMessages { get; set; } = new List<Message>();
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
    public ICollection<HabitTeam> CreatedTeams { get; set; } = new List<HabitTeam>();
    public ICollection<Habit> CreatedHabits { get; set; } = new List<Habit>();
}