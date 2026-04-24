using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Vertigo.Data;
using Vertigo.Dtos;
using Vertigo.Models;

namespace Vertigo.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class DealsController : ControllerBase
    {
        private readonly VertigoContext _context;

        public DealsController(VertigoContext context)
        {
            _context = context;
        }

        // GET /api/deals/mine — all baskets for the current merchant's boutique
        [HttpGet("mine")]
        public async Task<ActionResult<IEnumerable<DealDto>>> Mine()
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var boutique = await GetMyBoutiqueAsync(userId.Value);
            if (boutique == null) return NotFound(new { message = "You don't have a boutique yet." });

            var paniers = await _context.Panier
                .Where(p => p.IdBoutique == boutique.IDBoutique)
                .OrderByDescending(p => p.ID)
                .ToListAsync();

            return Ok(paniers.Select(ToDto));
        }

        // POST /api/deals — create a new basket
        [HttpPost]
        public async Task<ActionResult<DealDto>> Create([FromBody] CreateDealRequest req)
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var boutique = await GetMyBoutiqueAsync(userId.Value);
            if (boutique == null) return BadRequest(new { message = "Apply as a merchant first." });
            if (!boutique.Valide) return BadRequest(new { message = "Your merchant application isn't approved yet." });

            var discounted = Math.Round(req.OriginalPrice * (1m - req.DiscountPercentage / 100m), 2);
            if (discounted < 0) discounted = 0;

            var panier = new Panier
            {
                Name = req.Name,
                Description = req.Description,
                Types = req.Types,
                IdBoutique = boutique.IDBoutique,
                PanierPrix = discounted,
                OriginalPrice = req.OriginalPrice,
                DiscountPercentage = req.DiscountPercentage,
                NBdispo = req.NBdispo,
                Statut = req.NBdispo > 0,
                PanierImagePath = string.IsNullOrWhiteSpace(req.PanierImagePath) ? boutique.BoutiqueImagePath : req.PanierImagePath!,
                ValidFrom = req.ValidFrom ?? DateTime.UtcNow,
                ValidUntil = req.ValidUntil,
                IsActive = true,
                Note = new Evaluation { NbNote = 0, Note = 0 }
            };

            _context.Panier.Add(panier);
            await _context.SaveChangesAsync();

            return Ok(ToDto(panier));
        }

        // PUT /api/deals/{id} — update a basket
        [HttpPut("{id:int}")]
        public async Task<ActionResult<DealDto>> Update(int id, [FromBody] UpdateDealRequest req)
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var panier = await _context.Panier
                .Include(p => p.Boutique)
                .FirstOrDefaultAsync(p => p.ID == id);
            if (panier == null) return NotFound();
            if (panier.Boutique.IdGerant != userId.Value) return Forbid();

            var discounted = Math.Round(req.OriginalPrice * (1m - req.DiscountPercentage / 100m), 2);
            if (discounted < 0) discounted = 0;

            panier.Name = req.Name;
            panier.Description = req.Description;
            panier.Types = req.Types;
            panier.OriginalPrice = req.OriginalPrice;
            panier.DiscountPercentage = req.DiscountPercentage;
            panier.PanierPrix = discounted;
            panier.NBdispo = req.NBdispo;
            panier.Statut = req.NBdispo > 0 && req.IsActive;
            panier.ValidFrom = req.ValidFrom ?? panier.ValidFrom;
            panier.ValidUntil = req.ValidUntil;
            panier.IsActive = req.IsActive;
            if (!string.IsNullOrWhiteSpace(req.PanierImagePath))
                panier.PanierImagePath = req.PanierImagePath!;

            await _context.SaveChangesAsync();
            return Ok(ToDto(panier));
        }

        // DELETE /api/deals/{id}
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var panier = await _context.Panier
                .Include(p => p.Boutique)
                .FirstOrDefaultAsync(p => p.ID == id);
            if (panier == null) return NotFound();
            if (panier.Boutique.IdGerant != userId.Value) return Forbid();

            var hasOrders = await _context.Commande.AnyAsync(c => c.PanierID == id);
            if (hasOrders)
            {
                // Soft-deactivate instead of removing — preserves order history
                panier.IsActive = false;
                panier.Statut = false;
                panier.NBdispo = 0;
                await _context.SaveChangesAsync();
                return Ok(new { message = "Basket deactivated (had existing orders)." });
            }

            _context.Panier.Remove(panier);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Basket deleted." });
        }

        private int? GetUserId()
        {
            var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(idStr, out var id) ? id : (int?)null;
        }

        private Task<Boutique?> GetMyBoutiqueAsync(int userId) =>
            _context.Boutique.FirstOrDefaultAsync(b => b.IdGerant == userId);

        private static DealDto ToDto(Panier p) => new DealDto
        {
            Id = p.ID,
            BoutiqueId = p.IdBoutique,
            Name = p.Name,
            Description = p.Description,
            Types = p.Types,
            OriginalPrice = p.OriginalPrice,
            DiscountPercentage = p.DiscountPercentage,
            DiscountedPrice = p.PanierPrix,
            NBdispo = p.NBdispo,
            ValidFrom = p.ValidFrom,
            ValidUntil = p.ValidUntil,
            IsActive = p.IsActive,
            PanierImagePath = p.PanierImagePath,
            Rating = p.Note?.Note ?? 0.0,
        };
    }
}
