namespace HabitHub.Api.Contracts.Auth;

public class AuthResponse
{
    public required string Token { get; set; }
    public string Username { get; set; } = null!;
    public string Email { get; set; } = null!;
    public required Guid UserId { get; set; }
    public required Guid SessionId { get; set; }
}