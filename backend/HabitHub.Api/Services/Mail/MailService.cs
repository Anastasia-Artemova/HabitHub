using System.Net;
using System.Net.Mail;

namespace HabitHub.Api.Services.Mail;

public class MailService : IMailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<MailService> _logger;

    public MailService(IConfiguration configuration, ILogger<MailService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SendEmailChangedEmail(string oldEmail, string newEmail)
    {
        var subject = "HabitHub Email Changed";

        var body =
            $@"Your HabitHub email was changed.

            Old Email: {oldEmail}
            New Email: {newEmail}

            If this wasn't you, please secure your account immediately.";

        await SendEmail(oldEmail, subject, body);

        await SendEmail(newEmail, subject, body);
    }

    public async Task SendPasswordChangedEmail(string email)
    {
        var subject = "HabitHub Password Changed";

        var body =
@"Your HabitHub password was changed successfully.

If this wasn't you, please reset your password immediately.";

        await SendEmail(email, subject, body);
    }

    private async Task SendEmail(
        string to,
        string subject,
        string body)
    {
        if (!bool.TryParse(_configuration["Email:Enabled"], out var smtpEnabled) || !smtpEnabled)
        {
            _logger.LogWarning("SMTP is disabled; email to {Email} was not sent.", to);
            return;
        }

        var smtpHost = _configuration["Email:SmtpHost"];
        var smtpPortString = _configuration["Email:SmtpPort"];
        if (string.IsNullOrWhiteSpace(smtpHost) || !int.TryParse(smtpPortString, out var smtpPort))
        {
            throw new InvalidOperationException("SMTP host or port is not configured.");
        }

        var smtpUser = _configuration["Email:Username"];
        var smtpPass = _configuration["Email:Password"];
        var fromEmail = _configuration["Email:From"] ?? smtpUser;

        if (string.IsNullOrWhiteSpace(smtpUser) || string.IsNullOrWhiteSpace(smtpPass) || string.IsNullOrWhiteSpace(fromEmail))
        {
            throw new InvalidOperationException("SMTP credentials are not configured.");
        }

        using var client = new SmtpClient(smtpHost, smtpPort)
        {
            UseDefaultCredentials = false,
            Credentials = new NetworkCredential(smtpUser, smtpPass),
            EnableSsl = true,
            DeliveryMethod = SmtpDeliveryMethod.Network
        };

        var message = new MailMessage(
            fromEmail,
            to,
            subject,
            body
        );

        try
        {
            await client.SendMailAsync(message);
            _logger.LogInformation("Sent email to {Email} via SMTP host {Host}.", to, smtpHost);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {Email} via SMTP.", to);
            throw;
        }
    }
}