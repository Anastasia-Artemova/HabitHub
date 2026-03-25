namespace HabitHub.Api.Models;

public class Message
{
    public Guid MessageId { get; set; }
    public Guid ChatId { get; set; }
    public TeamChat Chat { get; set; } = null!;

    public Guid SenderId { get; set; }
    public Member Sender { get; set; } = null!;
    public required string Content { get; set; }
    public DateTime SendDate { get; set; }
}
