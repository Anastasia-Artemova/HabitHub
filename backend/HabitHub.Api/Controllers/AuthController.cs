namespace HabitHub.Api.Controllers;

using HabitHub.Api.Contracts.Auth;
using HabitHub.Api.Data;
using HabitHub.Api.Models;
using HabitHub.Api.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly PasswordHasher<Member> _passwordHasher;

    public AuthController(AppDbContext dbContext, IJwtTokenService jwtTokenService)
    {
        _dbContext = dbContext;
        _jwtTokenService = jwtTokenService;
        _passwordHasher = new PasswordHasher<Member>();
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request, CancellationToken cancellationToken)
    {
        var email = request.Email.Trim().ToLowerInvariant();

        var exist = await _dbContext.Members.AnyAsync(m => m.Email == email, cancellationToken);
        if (exist)
            return BadRequest("Email already in use");

        var member = new Member
        {
            Name = request.Username,
            Email = email,
            Timezone = string.IsNullOrWhiteSpace(request.Timezone) ? "UTC" : request.Timezone
        };

        member.PasswordHash = _passwordHasher.HashPassword(member, request.Password);

        _dbContext.Members.Add(member);
        await _dbContext.SaveChangesAsync(cancellationToken);

        var (token, expiresAt) = _jwtTokenService.CreateToken(member);

        var session = new Session
        {
            SessionId = Guid.NewGuid(),
            MemberId = member.MemberId,
            ExpiresAt = expiresAt
        };

        _dbContext.Sessions.Add(session);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(new AuthResponse
        {
            Token = token,
            UserId = member.MemberId,
            Username = member.Name,
            Email = member.Email,
            SessionId = session.SessionId
        });
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request, CancellationToken cancellationToken)
    {
        var email = request.Email.Trim().ToLowerInvariant();

        var member = await _dbContext.Members.FirstOrDefaultAsync(m => m.Email == email, cancellationToken);
        if (member == null)
            return BadRequest("Invalid email or password");

        var result = _passwordHasher.VerifyHashedPassword(member, member.PasswordHash, request.Password);
        if (result == PasswordVerificationResult.Failed)
            return BadRequest("Invalid email or password");

        var (token, expiresAt) = _jwtTokenService.CreateToken(member);

        var session = new Session
        {
            SessionId = Guid.NewGuid(),
            MemberId = member.MemberId,
            ExpiresAt = expiresAt
        };

        _dbContext.Sessions.Add(session);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(new AuthResponse
        {
            Token = token,
            UserId = member.MemberId,
            Username = member.Name,
            Email = member.Email,
            SessionId = session.SessionId
        });
    }
}