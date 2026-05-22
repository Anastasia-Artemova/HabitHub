namespace HabitHub.Api.Services.Mail;

public interface IMailService
{
    Task SendEmailChangedEmail(string oldEmail, string newEmail);

    Task SendPasswordChangedEmail(string email);
}