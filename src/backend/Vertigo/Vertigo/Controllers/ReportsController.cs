using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Vertigo.Data;
using Vertigo.Dtos;

namespace Vertigo.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ReportsController : ControllerBase
    {
        private readonly VertigoContext _context;

        public ReportsController(VertigoContext context)
        {
            _context = context;
        }

        // POST /api/reports/user/{id} — report a customer
        [HttpPost("user/{id:int}")]
        public async Task<IActionResult> ReportUser(int id, [FromBody] ReportRequest? req)
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();
            if (userId.Value == id) return BadRequest(new { message = "You can't report yourself." });

            var target = await _context.Utilisateur.FindAsync(id);
            if (target == null) return NotFound();

            var reporterName = User.FindFirstValue(ClaimTypes.Name) ?? "Someone";
            var reason = string.IsNullOrWhiteSpace(req?.Reason) ? "(no reason)" : req!.Reason!.Trim();

            target.NBReport += 1;
            target.Report.Add($"Reported by {reporterName} on {DateTime.UtcNow:yyyy-MM-dd}: {reason}");

            // Auto-ban a customer once they reach 3 reports (e.g. not picking up orders).
            const int CustomerBanThreshold = 3;
            var banned = false;
            if (!target.BAN && target.NBReport >= CustomerBanThreshold)
            {
                target.BAN = true;
                banned = true;
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "User reported.", totalReports = target.NBReport, banned });
        }

        // POST /api/reports/boutique/{id} — report a restaurant
        [HttpPost("boutique/{id:int}")]
        public async Task<IActionResult> ReportBoutique(int id, [FromBody] ReportRequest? req)
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var target = await _context.Boutique.FindAsync(id);
            if (target == null) return NotFound();
            if (target.IdGerant == userId.Value) return BadRequest(new { message = "You can't report your own shop." });

            var reporterName = User.FindFirstValue(ClaimTypes.Name) ?? "Someone";
            var reason = string.IsNullOrWhiteSpace(req?.Reason) ? "(no reason)" : req!.Reason!.Trim();

            target.NBReport += 1;
            target.Report.Add($"Reported by {reporterName} on {DateTime.UtcNow:yyyy-MM-dd}: {reason}");

            // Auto-ban a restaurant once more than 5 people report it (e.g. food safety).
            const int BoutiqueBanThreshold = 6;
            var banned = false;
            if (!target.BAN && target.NBReport >= BoutiqueBanThreshold)
            {
                target.BAN = true;
                banned = true;
                // Lock out the owner too, so they hit the banned screen on login.
                var gerant = await _context.Utilisateur.FindAsync(target.IdGerant);
                if (gerant != null) gerant.BAN = true;
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Restaurant reported.", totalReports = target.NBReport, banned });
        }

        private int? GetUserId()
        {
            var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(idStr, out var id) ? id : (int?)null;
        }
    }
}
