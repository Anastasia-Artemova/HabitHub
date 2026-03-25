using HabitHub.Api.Enums;

namespace HabitHub.Api.Models;

public class Membership
{
    public Guid MembershipId { get; set; }

    public Guid MemberId { get; set; }
    public Member Member { get; set; } = null!;

    public Guid HabitTeamId { get; set; }
    public HabitTeam Team { get; set; } = null!;
    public MembershipStatus Status { get; set; }
    public MembershipRole Role { get; set; }
}