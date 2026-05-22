namespace HabitHub.Api.Contracts.Team;
using System.ComponentModel.DataAnnotations;
using HabitHub.Api.Enums;

public class CodeResponse
{
    public Guid InviteCodeId { get; set; }
    [Required]
    public string Code { get; set; } = null!;
    public DateTime ExpiryDate { get; set; }
    public Guid HabitTeamId { get; set; }
    public CodeState CodeStatus { get; set; }
}
