using System.ComponentModel.DataAnnotations;

namespace HabitHub.Api.Models;

public class TeamChat
{
    public Guid TeamChatId { get; set; }

    public Guid HabitTeamId { get; set; }
    public required HabitTeam Team { get; set; }

    public ICollection<Message> Messages { get; set; } = new List<Message>();
    
}
