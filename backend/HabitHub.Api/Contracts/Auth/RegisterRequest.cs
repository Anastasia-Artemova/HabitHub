namespace HabitHub.Api.Contracts.Auth;

public class RegisterRequest
{
    public required string Username { get; set; }
    public required string Email { get; set; }
    public required string Password { get; set; }
    public string? Timezone { get; set; }
}