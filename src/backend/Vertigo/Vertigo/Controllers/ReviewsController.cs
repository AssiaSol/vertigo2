using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Vertigo.Data;
using Vertigo.Models;

namespace Vertigo.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ReviewsController : ControllerBase
    {
        private readonly VertigoContext _context;

        public ReviewsController(VertigoContext context)
        {
            _context = context;
        }

        public class CreateReviewRequest
        {
            public int BoutiqueId { get; set; }
            public int Note { get; set; }
            public string? Commentaire { get; set; }
        }

        // GET /api/reviews/boutique/{boutiqueId}
        // Returns the boutique's reviews + whether the current user may review it.
        [HttpGet("boutique/{boutiqueId:int}")]
        public async Task<IActionResult> ForBoutique(int boutiqueId)
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var reviews = await _context.Avis
                .Where(a => a.BoutiqueId == boutiqueId)
                .Include(a => a.Utilisateur)
                .OrderByDescending(a => a.DateCreation)
                .ToListAsync();

            var count = reviews.Count;
            var average = count > 0 ? Math.Round(reviews.Average(a => a.Note), 1) : 0.0;

            var hasPurchase = await _context.Commande
                .AnyAsync(c => c.ClientID == userId.Value
                    && c.Panier.IdBoutique == boutiqueId
                    && (c.Status == OrderStatus.Delivered || c.Statut));

            var myReview = reviews.FirstOrDefault(a => a.UtilisateurId == userId.Value);

            return Ok(new
            {
                average,
                count,
                canReview = hasPurchase,
                myReview = myReview == null ? null : new
                {
                    note = myReview.Note,
                    commentaire = myReview.Commentaire,
                },
                items = reviews.Select(a => new
                {
                    id = a.Id,
                    note = a.Note,
                    commentaire = a.Commentaire,
                    dateCreation = a.DateCreation,
                    authorName = a.Utilisateur != null ? a.Utilisateur.Nom : "Client",
                    mine = a.UtilisateurId == userId.Value,
                }),
            });
        }

        // POST /api/reviews — create or update the current user's review for a boutique.
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateReviewRequest req)
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            if (req.Note < 1 || req.Note > 5)
                return BadRequest(new { message = "Rating must be between 1 and 5 stars." });

            var boutique = await _context.Boutique.FirstOrDefaultAsync(b => b.IDBoutique == req.BoutiqueId);
            if (boutique == null) return NotFound(new { message = "Restaurant not found." });

            var hasPurchase = await _context.Commande
                .AnyAsync(c => c.ClientID == userId.Value
                    && c.Panier.IdBoutique == req.BoutiqueId
                    && (c.Status == OrderStatus.Delivered || c.Statut));
            if (!hasPurchase)
                return BadRequest(new { message = "You can only review a restaurant after a completed order." });

            var review = await _context.Avis
                .FirstOrDefaultAsync(a => a.UtilisateurId == userId.Value && a.BoutiqueId == req.BoutiqueId);

            if (review == null)
            {
                review = new Avis
                {
                    UtilisateurId = userId.Value,
                    BoutiqueId = req.BoutiqueId,
                    Note = req.Note,
                    Commentaire = string.IsNullOrWhiteSpace(req.Commentaire) ? null : req.Commentaire.Trim(),
                    DateCreation = DateTime.UtcNow,
                };
                _context.Avis.Add(review);
            }
            else
            {
                review.Note = req.Note;
                review.Commentaire = string.IsNullOrWhiteSpace(req.Commentaire) ? null : req.Commentaire.Trim();
                review.DateCreation = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            // Refresh the boutique's aggregate rating from all its reviews.
            var all = await _context.Avis.Where(a => a.BoutiqueId == req.BoutiqueId).ToListAsync();
            boutique.Note = new Evaluation
            {
                NbNote = all.Count,
                Note = all.Count > 0 ? Math.Round(all.Average(a => a.Note), 1) : 0.0,
            };
            await _context.SaveChangesAsync();

            return Ok(new { message = "Thanks for your review!", average = boutique.Note.Note, count = boutique.Note.NbNote });
        }

        private int? GetUserId()
        {
            var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(idStr, out var id) ? id : (int?)null;
        }
    }
}
