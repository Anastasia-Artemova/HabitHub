using System.ComponentModel.DataAnnotations;

namespace HabitHub.Api.Models;

public class HabitTeam
{
    public Guid HabitTeamId { get; set; }
    [Required]
    public required string Name { get; set; }
    public Guid CreatorId { get; set; }
    public Member Creator { get; set; } = null!;
    public ICollection<Membership> Memberships { get; set; } = new List<Membership>();
    public ICollection<Habit> Habits { get; set; } = new List<Habit>();
    public ICollection<InviteCode> InviteCodes { get; set; } = new List<InviteCode>();
    // public Guid ChatId { get; set; }
    public required TeamChat Chat { get; set; }
}
