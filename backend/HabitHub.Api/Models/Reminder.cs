namespace HabitHub.Api.Models;

public class Reminder
{
    public Guid ReminderId { get; set; }

    public Guid MemberId { get; set; }
    public Member Member { get; set; } = null!;

    public Guid HabitId { get; set; }
    public Habit Habit { get; set; } = null!;
    public bool Enabled { get; set; }
    public DateTime LastSentAt { get; set; }
}
