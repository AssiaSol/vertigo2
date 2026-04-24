using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Vertigo.Data;

namespace Vertigo.Controllers
{
    [ApiController]
    [Route("api/admin")]
    [Authorize(Roles = "Admin")]
    public class AdminApiController : ControllerBase
    {
        private readonly VertigoContext _context;

        public AdminApiController(VertigoContext context)
        {
            _context = context;
        }

        // GET /api/admin/stats — platform-wide counts for the admin dashboard
        [HttpGet("stats")]
        public async Task<ActionResult<object>> Stats()
        {
            var totalUsers = await _context.Utilisateur.CountAsync();
            var totalMerchants = await _context.Boutique.CountAsync(b => b.Valide);
            var pendingApplications = await _context.Boutique.CountAsync(b => !b.Valide && !b.BAN);
            var bannedUsers = await _context.Utilisateur.CountAsync(u => u.BAN);
            var totalOrders = await _context.Commande.CountAsync();
            var completedOrders = await _context.Commande.CountAsync(c => c.Statut);
            var activeOffers = await _context.Panier.CountAsync(p => p.IsActive && p.DiscountPercentage > 0);

            return Ok(new
            {
                totalUsers,
                totalMerchants,
                pendingApplications,
                bannedUsers,
                totalOrders,
                completedOrders,
                activeOffers,
            });
        }
    }
}
