namespace HabitHub.Api.Controllers;

using HabitHub.Api.Contracts.Member;
using HabitHub.Api.Contracts.Team;
using HabitHub.Api.Data;
using HabitHub.Api.Enums;
using HabitHub.Api.Models;
using HabitHub.Api.Util;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Authorize]
[Route("api/teams")]
public class HabitTeamController : ControllerBase
{
    private readonly AppDbContext _context;

    public HabitTeamController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<List<TeamResponse>>> GetMyTeams()
    {
        var userId = GetCurrentUserId.GetUserId(User);
        if (userId == null)
            return Unauthorized();

        var teams = await _context.HabitTeams
            .Include(t => t.Memberships)
                .ThenInclude(m => m.Member)
            .Where(t =>
                t.CreatorId == userId.Value ||
                t.Memberships.Any(m =>
                    m.MemberId == userId.Value &&
                    m.Status == MembershipStatus.Active))
            .ToListAsync();

        var teamResponses = teams.Select(MapTeamResponse).ToList();

        return Ok(teamResponses);
    }

    [HttpGet("{teamId:guid}")]
    public async Task<ActionResult<TeamResponse>> GetTeam([FromRoute] Guid teamId)
    {
        var userId = GetCurrentUserId.GetUserId(User);
        if (userId == null)
            return Unauthorized();

        var team = await _context.HabitTeams
            .Include(t => t.Memberships)
                .ThenInclude(m => m.Member)
            .FirstOrDefaultAsync(t => t.HabitTeamId == teamId);

        if (team == null)
            return NotFound();

        if (!CanAccessTeam(team, userId.Value))
            return Forbid();

        return Ok(MapTeamResponse(team));
    }

    [HttpGet("{teamId:guid}/members")]
    public async Task<ActionResult<List<TeamMemberResponse>>> GetTeamMembers([FromRoute] Guid teamId)
    {
        var userId = GetCurrentUserId.GetUserId(User);
        if (userId == null)
            return Unauthorized();

        var team = await _context.HabitTeams
            .Include(t => t.Memberships)
                .ThenInclude(m => m.Member)
            .FirstOrDefaultAsync(t => t.HabitTeamId == teamId);

        if (team == null)
            return NotFound("not-found");

        if (!CanAccessTeam(team, userId.Value))
            return Forbid();

        return Ok(MapActiveMembers(team));
    }

    [HttpPost]
    public async Task<ActionResult<TeamResponse>> CreateTeam(CreateTeamRequest request)
    {
        var userId = GetCurrentUserId.GetUserId(User);
        if (userId == null)
            return Unauthorized();

        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest("validation-error");

        var creator = await _context.Members.FindAsync(userId.Value);
        if (creator == null)
            return Unauthorized();

        var teamId = Guid.NewGuid();

        var chat = new TeamChat
        {
            TeamChatId = Guid.NewGuid(),
            HabitTeamId = teamId
        };

        var team = new HabitTeam
        {
            HabitTeamId = teamId,
            Name = request.Name.Trim(),
            CreatorId = userId.Value,
            Creator = creator,
            Chat = chat
        };

        chat.Team = team;

        var membership = new Membership
        {
            MembershipId = Guid.NewGuid(),
            MemberId = userId.Value,
            Member = creator,
            HabitTeamId = teamId,
            Team = team,
            Role = MembershipRole.Creator,
            Status = MembershipStatus.Active
        };

        team.Memberships.Add(membership);

        _context.HabitTeams.Add(team);
        await _context.SaveChangesAsync();

        var createdTeam = await _context.HabitTeams
            .Include(t => t.Memberships)
                .ThenInclude(m => m.Member)
            .FirstAsync(t => t.HabitTeamId == teamId);

        return CreatedAtAction(
            nameof(GetTeam),
            new { teamId = createdTeam.HabitTeamId },
            MapTeamResponse(createdTeam));
    }

    [HttpPost("{teamId:guid}/members/{memberId:guid}/kick")]
    public async Task<ActionResult<TeamResponse>> KickMember(
        [FromRoute] Guid teamId,
        [FromRoute] Guid memberId)
    {
        var userId = GetCurrentUserId.GetUserId(User);
        if (userId == null)
            return Unauthorized();

        if (userId.Value == memberId)
            return Conflict("cannot-kick-self");

        var team = await _context.HabitTeams
            .Include(t => t.Memberships)
                .ThenInclude(m => m.Member)
            .FirstOrDefaultAsync(t => t.HabitTeamId == teamId);

        if (team == null)
            return NotFound("not-found");

        if (team.CreatorId != userId.Value)
            return Forbid();

        if (team.CreatorId == memberId)
            return Conflict("cannot-kick-self");

        var membership = team.Memberships.FirstOrDefault(m =>
            m.MemberId == memberId &&
            m.Status == MembershipStatus.Active);

        if (membership == null)
            return NotFound("not-found");

        membership.Status = MembershipStatus.Kicked;
        await _context.SaveChangesAsync();

        return Ok(MapTeamResponse(team));
    }

    [HttpPost("{teamId:guid}/leave")]
    public async Task<ActionResult> LeaveTeam([FromRoute] Guid teamId)
    {
        var userId = GetCurrentUserId.GetUserId(User);
        if (userId == null)
            return Unauthorized();

        var team = await _context.HabitTeams
            .Include(t => t.Memberships)
            .FirstOrDefaultAsync(t => t.HabitTeamId == teamId);

        if (team == null)
            return NotFound("not-found");

        if (team.CreatorId == userId.Value)
            return Conflict("creator-cannot-leave");

        var membership = team.Memberships.FirstOrDefault(m =>
            m.MemberId == userId.Value &&
            m.Status == MembershipStatus.Active);

        if (membership == null)
            return NotFound("not-found");

        membership.Status = MembershipStatus.Left;
        await _context.SaveChangesAsync();

        return Ok(new { message = "left team" });
    }

    [HttpDelete("{teamId:guid}")]
    public async Task<IActionResult> DeleteTeam([FromRoute] Guid teamId)
    {
        var userId = GetCurrentUserId.GetUserId(User);
        if (userId == null)
            return Unauthorized();

        var team = await _context.HabitTeams
            .Include(t => t.Memberships)
            .Include(t => t.InviteCodes)
            .Include(t => t.Habits)
            .Include(t => t.Chat)
            .FirstOrDefaultAsync(t => t.HabitTeamId == teamId);

        if (team == null)
            return NotFound("not-found");

        if (team.CreatorId != userId.Value)
            return Forbid();

        _context.HabitTeams.Remove(team);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private static bool CanAccessTeam(HabitTeam team, Guid userId)
    {
        return team.CreatorId == userId ||
               team.Memberships.Any(m =>
                   m.MemberId == userId &&
                   m.Status == MembershipStatus.Active);
    }

    private static TeamResponse MapTeamResponse(HabitTeam team)
    {
        return new TeamResponse
        {
            HabitTeamId = team.HabitTeamId,
            Name = team.Name,
            CreatorId = team.CreatorId,
            Members = MapActiveMembers(team)
        };
    }

    private static List<TeamMemberResponse> MapActiveMembers(HabitTeam team)
    {
        return team.Memberships
            .Where(m => m.Status == MembershipStatus.Active)
            .Select(m => new TeamMemberResponse
            {
                MemberId = m.MemberId,
                Name = m.Member.Name,
                Email = m.Member.Email,
                Role = m.Role,
                Status = m.Status
            })
            .ToList();
    }
}