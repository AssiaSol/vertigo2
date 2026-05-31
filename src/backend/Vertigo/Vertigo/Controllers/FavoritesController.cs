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
    public class FavoritesController : ControllerBase
    {
        private readonly VertigoContext _context;

        public FavoritesController(VertigoContext context)
        {
            _context = context;
        }

        // GET /api/favorites?latitude=&longitude= — list the user's favorite restaurants
        [HttpGet]
        public async Task<ActionResult<IEnumerable<NearbyRestaurantDto>>> Mine(
            [FromQuery] double? latitude,
            [FromQuery] double? longitude)
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var favs = await _context.Favorite
                .Where(f => f.UserId == userId.Value)
                .Include(f => f.Boutique)
                .OrderByDescending(f => f.CreatedAt)
                .ToListAsync();

            var now = DateTime.UtcNow;
            var result = new List<NearbyRestaurantDto>();

            foreach (var f in favs)
            {
                var b = f.Boutique;
                if (b == null || b.BAN) continue;

                var offers = await _context.Panier
                    .Where(p => p.IdBoutique == b.IDBoutique
                        && p.IsActive
                        && (p.ValidUntil == null || p.ValidUntil > now))
                    .OrderByDescending(p => p.DiscountPercentage)
                    .ToListAsync();

                double distanceKm = 0;
                if (latitude.HasValue && longitude.HasValue && b.Latitude.HasValue && b.Longitude.HasValue)
                    distanceKm = Math.Round(HaversineKm(latitude.Value, longitude.Value, b.Latitude.Value, b.Longitude.Value), 2);

                result.Add(new NearbyRestaurantDto
                {
                    Id = b.IDBoutique,
                    Name = b.NomBoutique,
                    Address = b.Localisation,
                    Ville = b.Ville,
                    Latitude = b.Latitude ?? 0,
                    Longitude = b.Longitude ?? 0,
                    CuisineType = b.CuisineType,
                    Rating = b.Note?.Note ?? 0.0,
                    ImageUrl = b.BoutiqueImagePath,
                    PhoneNumber = b.PhoneNumber,
                    DistanceKm = distanceKm,
                    Offers = offers.Select(o => new OfferDto
                    {
                        Id = o.ID,
                        Title = o.Name,
                        Description = o.Description,
                        DiscountPercentage = o.DiscountPercentage,
                        OriginalPrice = o.OriginalPrice,
                        DiscountedPrice = o.PanierPrix,
                        ValidFrom = o.ValidFrom,
                        ValidUntil = o.ValidUntil,
                        ImageUrl = o.PanierImagePath
                    }).ToList()
                });
            }

            return Ok(result);
        }

        // GET /api/favorites/ids — quick endpoint: just the list of favorited boutique IDs
        [HttpGet("ids")]
        public async Task<ActionResult<IEnumerable<int>>> Ids()
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var ids = await _context.Favorite
                .Where(f => f.UserId == userId.Value)
                .Select(f => f.BoutiqueId)
                .ToListAsync();
            return Ok(ids);
        }

        // POST /api/favorites/{boutiqueId} — add a favorite (idempotent)
        [HttpPost("{boutiqueId:int}")]
        public async Task<IActionResult> Add(int boutiqueId)
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var boutiqueExists = await _context.Boutique.AnyAsync(b => b.IDBoutique == boutiqueId);
            if (!boutiqueExists) return NotFound();

            var existing = await _context.Favorite
                .FirstOrDefaultAsync(f => f.UserId == userId.Value && f.BoutiqueId == boutiqueId);
            if (existing != null) return Ok(new { message = "Already favorited." });

            _context.Favorite.Add(new Favorite
            {
                UserId = userId.Value,
                BoutiqueId = boutiqueId,
                CreatedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();
            return Ok(new { message = "Added to favorites." });
        }

        // DELETE /api/favorites/{boutiqueId}
        [HttpDelete("{boutiqueId:int}")]
        public async Task<IActionResult> Remove(int boutiqueId)
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var fav = await _context.Favorite
                .FirstOrDefaultAsync(f => f.UserId == userId.Value && f.BoutiqueId == boutiqueId);
            if (fav == null) return NotFound();

            _context.Favorite.Remove(fav);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Removed from favorites." });
        }

        // ── Deal-level favorites (Panier) ────────────────────────────────────────

        // GET /api/favorites/deals — list the user's favorited deals
        [HttpGet("deals")]
        public async Task<ActionResult<IEnumerable<OfferDto>>> MyDeals()
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var now = DateTime.UtcNow;
            var favs = await _context.DealFavorite
                .Where(f => f.UserId == userId.Value)
                .Include(f => f.Panier)
                .OrderByDescending(f => f.CreatedAt)
                .ToListAsync();

            var offers = favs
                .Where(f => f.Panier != null && f.Panier.IsActive
                    && (f.Panier.ValidUntil == null || f.Panier.ValidUntil > now))
                .Select(f => new FavoriteDealDto
                {
                    Id = f.Panier!.ID,
                    BoutiqueId = f.Panier.IdBoutique,
                    BoutiqueName = f.Panier.Boutique != null ? f.Panier.Boutique.NomBoutique : null,
                    Title = f.Panier.Name,
                    Description = f.Panier.Description,
                    DiscountPercentage = f.Panier.DiscountPercentage,
                    OriginalPrice = f.Panier.OriginalPrice,
                    DiscountedPrice = f.Panier.PanierPrix,
                    ValidFrom = f.Panier.ValidFrom,
                    ValidUntil = f.Panier.ValidUntil,
                    ImageUrl = f.Panier.PanierImagePath
                })
                .ToList();

            // Hydrate boutique names if Include didn't (the Panier.Boutique nav may not have been eager-loaded above)
            var missingIds = offers.Where(o => string.IsNullOrEmpty(o.BoutiqueName)).Select(o => o.BoutiqueId).Distinct().ToList();
            if (missingIds.Any())
            {
                var names = await _context.Boutique
                    .Where(b => missingIds.Contains(b.IDBoutique))
                    .ToDictionaryAsync(b => b.IDBoutique, b => b.NomBoutique);
                foreach (var o in offers)
                    if (string.IsNullOrEmpty(o.BoutiqueName) && names.TryGetValue(o.BoutiqueId, out var n))
                        o.BoutiqueName = n;
            }

            return Ok(offers);
        }

        // GET /api/favorites/deals/ids — quick endpoint: just the list of favorited Panier IDs
        [HttpGet("deals/ids")]
        public async Task<ActionResult<IEnumerable<int>>> DealIds()
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var ids = await _context.DealFavorite
                .Where(f => f.UserId == userId.Value)
                .Select(f => f.PanierId)
                .ToListAsync();
            return Ok(ids);
        }

        // POST /api/favorites/deals/{panierId} — add a deal favorite (idempotent)
        [HttpPost("deals/{panierId:int}")]
        public async Task<IActionResult> AddDeal(int panierId)
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var dealExists = await _context.Panier.AnyAsync(p => p.ID == panierId);
            if (!dealExists) return NotFound();

            var existing = await _context.DealFavorite
                .FirstOrDefaultAsync(f => f.UserId == userId.Value && f.PanierId == panierId);
            if (existing != null) return Ok(new { message = "Already favorited." });

            _context.DealFavorite.Add(new DealFavorite
            {
                UserId = userId.Value,
                PanierId = panierId,
                CreatedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();
            return Ok(new { message = "Deal added to favorites." });
        }

        // DELETE /api/favorites/deals/{panierId}
        [HttpDelete("deals/{panierId:int}")]
        public async Task<IActionResult> RemoveDeal(int panierId)
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var fav = await _context.DealFavorite
                .FirstOrDefaultAsync(f => f.UserId == userId.Value && f.PanierId == panierId);
            if (fav == null) return NotFound();

            _context.DealFavorite.Remove(fav);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Deal removed from favorites." });
        }

        private int? GetUserId()
        {
            var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(idStr, out var id) ? id : (int?)null;
        }

        private static double HaversineKm(double lat1, double lng1, double lat2, double lng2)
        {
            const double R = 6371.0;
            double dLat = (lat2 - lat1) * Math.PI / 180.0;
            double dLng = (lng2 - lng1) * Math.PI / 180.0;
            double a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2)
                     + Math.Cos(lat1 * Math.PI / 180.0) * Math.Cos(lat2 * Math.PI / 180.0)
                     * Math.Sin(dLng / 2) * Math.Sin(dLng / 2);
            double c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
            return R * c;
        }
    }
}
