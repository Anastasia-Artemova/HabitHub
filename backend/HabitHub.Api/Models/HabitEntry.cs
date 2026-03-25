using System.ComponentModel.DataAnnotations;
using HabitHub.Api.Enums;

namespace HabitHub.Api.Models;

public class HabitEntry
{
    public Guid HabitId { get; set; }

    public Habit Habit { get; set; } = null!;

    public Guid MemberId { get; set; }
    public Member Member { get; set; } = null!;
    public Guid HabitEntryId { get; set; }
    public DateTime Date { get; set; }
    public EntryStatus Status { get; set; }
    public float? Value { get; set; }
    public required string Notes { get; set; }
}
