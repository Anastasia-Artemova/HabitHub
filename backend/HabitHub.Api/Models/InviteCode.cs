using HabitHub.Api.Enums;

namespace HabitHub.Api.Models;

public class InviteCode
{
    public Guid InviteCodeId { get; set; }
    public required string Code { get; set; }
    public Guid HabitTeamId { get; set; }
    public HabitTeam Team { get; set; } = null!;    
    public DateTime ExpiryDate { get; set; }
    public CodeState CodeStatus { get; set; }
}
