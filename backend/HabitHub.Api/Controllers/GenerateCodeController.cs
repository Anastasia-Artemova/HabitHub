using HabitHub.Api.Contracts.Team;
using HabitHub.Api.Data;
using HabitHub.Api.Enums;
using HabitHub.Api.Models;
using HabitHub.Api.Util;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HabitHub.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/teams")]
public class GenerateCodeController : ControllerBase
{
    private readonly AppDbContext _context;

    public GenerateCodeController(AppDbContext context)
    {
        _context = context;
    }

    [HttpPost("{teamId:guid}/invite-codes")]
    public async Task<IActionResult> GenerateInviteCode(Guid teamId)
    {
        var userId = GetCurrentUserId.GetUserId(User);
        if (userId == null)
            return Unauthorized();

        var team = await _context.HabitTeams
            .FirstOrDefaultAsync(t => t.HabitTeamId == teamId);

        if (team == null)
            return NotFound(new { error = "not-found", message = "Team not found." });

        if (team.CreatorId != userId.Value)
            return Forbid();

        var inviteCode = new InviteCode
        {
            InviteCodeId = Guid.NewGuid(),
            Code = await GenerateUniqueCodeAsync(),
            HabitTeamId = teamId,
            ExpiryDate = DateTime.UtcNow.AddDays(10),
            CodeStatus = CodeState.Active
        };

        _context.InviteCodes.Add(inviteCode);
        await _context.SaveChangesAsync();

        var response = ToCodeResponse(inviteCode);

        return CreatedAtAction(
            nameof(GenerateInviteCode),
            new { teamId },
            response
        );
    }

    [HttpGet("{teamId:guid}/invite-codes")]
    public async Task<IActionResult> GetInviteCodes(Guid teamId)
    {
        var userId = GetCurrentUserId.GetUserId(User);
        if (userId == null)
            return Unauthorized();

        var team = await _context.HabitTeams
            .FirstOrDefaultAsync(t => t.HabitTeamId == teamId);

        if (team == null)
            return NotFound(new { error = "not-found", message = "Team not found." });

        if (team.CreatorId != userId.Value)
            return Forbid();

        await ExpireActiveCodesForTeamAsync(teamId);

        var now = DateTime.UtcNow;

        var activeCodes = await _context.InviteCodes
            .Where(c =>
                c.HabitTeamId == teamId &&
                c.CodeStatus == CodeState.Active &&
                c.ExpiryDate > now)
            .OrderByDescending(c => c.ExpiryDate)
            .Select(c => new CodeResponse
            {
                InviteCodeId = c.InviteCodeId,
                Code = c.Code,
                ExpiryDate = c.ExpiryDate,
                HabitTeamId = c.HabitTeamId,
                CodeStatus = c.CodeStatus
            })
            .ToListAsync();

        return Ok(activeCodes);
    }

    [HttpDelete("{teamId:guid}/invite-codes/{codeId:guid}")]
    public async Task<IActionResult> InvalidateInviteCode(Guid teamId, Guid codeId)
    {
        var userId = GetCurrentUserId.GetUserId(User);
        if (userId == null)
            return Unauthorized();

        var team = await _context.HabitTeams
            .FirstOrDefaultAsync(t => t.HabitTeamId == teamId);

        if (team == null)
            return NotFound(new { error = "not-found", message = "Team not found." });

        if (team.CreatorId != userId.Value)
            return Forbid();

        var inviteCode = await _context.InviteCodes
            .FirstOrDefaultAsync(c =>
                c.InviteCodeId == codeId &&
                c.HabitTeamId == teamId);

        if (inviteCode == null)
            return NotFound(new { error = "not-found", message = "Invite code not found." });

        if (inviteCode.CodeStatus == CodeState.Invalid)
        {
            return Conflict(new
            {
                error = "code-invalid",
                message = "Invite code is already invalidated."
            });
        }

        if (inviteCode.CodeStatus == CodeState.Expired)
        {
            return Conflict(new
            {
                error = "code-expired",
                message = "Invite code is already expired."
            });
        }

        if (inviteCode.ExpiryDate <= DateTime.UtcNow)
        {
            inviteCode.CodeStatus = CodeState.Expired;
            await _context.SaveChangesAsync();

            return Conflict(new
            {
                error = "code-expired",
                message = "Invite code has expired."
            });
        }

        inviteCode.CodeStatus = CodeState.Invalid;
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpPost("join")]
    public async Task<IActionResult> JoinTeam([FromBody] JoinTeamRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var userId = GetCurrentUserId.GetUserId(User);
        if (userId == null)
            return Unauthorized();

        if (string.IsNullOrWhiteSpace(request.Code))
        {
            return BadRequest(new
            {
                error = "validation-error",
                message = "Invite code is required."
            });
        }

        var submittedCode = request.Code.Trim().ToUpperInvariant();

        var inviteCode = await _context.InviteCodes
            .FirstOrDefaultAsync(c => c.Code == submittedCode);

        if (inviteCode == null)
        {
            return NotFound(new
            {
                error = "code-not-found",
                message = "Invite code was not found."
            });
        }

        if (inviteCode.CodeStatus == CodeState.Invalid)
        {
            return Conflict(new
            {
                error = "code-invalid",
                message = "Invite code is invalid."
            });
        }

        if (inviteCode.CodeStatus == CodeState.Expired)
        {
            return Conflict(new
            {
                error = "code-expired",
                message = "Invite code has expired."
            });
        }

        if (inviteCode.ExpiryDate <= DateTime.UtcNow)
        {
            inviteCode.CodeStatus = CodeState.Expired;
            await _context.SaveChangesAsync();

            return Conflict(new
            {
                error = "code-expired",
                message = "Invite code has expired."
            });
        }

        var team = await _context.HabitTeams
            .FirstOrDefaultAsync(t => t.HabitTeamId == inviteCode.HabitTeamId);

        if (team == null)
        {
            return NotFound(new
            {
                error = "not-found",
                message = "Team linked to this invite code was not found."
            });
        }

        var existingActiveMembership = await _context.Memberships
            .FirstOrDefaultAsync(m =>
                m.MemberId == userId.Value &&
                m.HabitTeamId == inviteCode.HabitTeamId &&
                m.Status == MembershipStatus.Active);

        if (existingActiveMembership != null)
        {
            return Conflict(new
            {
                error = "already-member",
                message = "User is already a member of this team."
            });
        }

        var membership = new Membership
        {
            MembershipId = Guid.NewGuid(),
            MemberId = userId.Value,
            HabitTeamId = inviteCode.HabitTeamId,
            Status = MembershipStatus.Active,
            Role = MembershipRole.Member
        };

        _context.Memberships.Add(membership);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Joined team successfully.",
            teamId = team.HabitTeamId
        });
    }

    private async Task ExpireActiveCodesForTeamAsync(Guid teamId)
    {
        var now = DateTime.UtcNow;

        var expiredActiveCodes = await _context.InviteCodes
            .Where(c =>
                c.HabitTeamId == teamId &&
                c.CodeStatus == CodeState.Active &&
                c.ExpiryDate <= now)
            .ToListAsync();

        if (expiredActiveCodes.Count == 0)
            return;

        foreach (var code in expiredActiveCodes)
        {
            code.CodeStatus = CodeState.Expired;
        }

        await _context.SaveChangesAsync();
    }

    private async Task<string> GenerateUniqueCodeAsync()
    {
        string code;

        do
        {
            code = Guid.NewGuid()
                .ToString("N")
                .Substring(0, 8)
                .ToUpperInvariant();
        }
        while (await _context.InviteCodes.AnyAsync(c => c.Code == code));

        return code;
    }

    private static CodeResponse ToCodeResponse(InviteCode inviteCode)
    {
        return new CodeResponse
        {
            InviteCodeId = inviteCode.InviteCodeId,
            Code = inviteCode.Code,
            ExpiryDate = inviteCode.ExpiryDate,
            HabitTeamId = inviteCode.HabitTeamId,
            CodeStatus = inviteCode.CodeStatus
        };
    }
}