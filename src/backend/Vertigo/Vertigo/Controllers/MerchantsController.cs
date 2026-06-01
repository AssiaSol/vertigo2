using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
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
    public class MerchantsController : ControllerBase
    {
        private readonly VertigoContext _context;

        public MerchantsController(VertigoContext context)
        {
            _context = context;
        }

        // POST /api/merchants/apply — submit application to become a merchant
        [HttpPost("apply")]
        public async Task<ActionResult<MerchantApplicationDto>> Apply([FromBody] MerchantApplicationRequest req)
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var existing = await _context.Boutique.FirstOrDefaultAsync(b => b.IdGerant == userId.Value);
            if (existing != null) return BadRequest(new { message = "You already have a pending or approved application." });

            // Clients browse by location, so a boutique MUST have coordinates or it
            // never appears in the nearby/deals feed. If the form didn't provide any
            // (no map picker), fall back to the wilaya's coordinates.
            var (wLat, wLng) = WilayaCoords(req.Ville);
            var lat = req.Latitude ?? wLat;
            var lng = req.Longitude ?? wLng;

            var boutique = new Boutique
            {
                NomBoutique = req.NomBoutique,
                Ville = req.Ville,
                Description = req.Description,
                Localisation = req.Localisation,
                Registre = req.Registre,
                IdGerant = userId.Value,
                Latitude = lat,
                Longitude = lng,
                CuisineType = req.CuisineType,
                PhoneNumber = req.PhoneNumber,
                BoutiqueImagePath = req.BoutiqueImagePath ?? string.Empty,
                Valide = false,
                BAN = false,
                NBvente = 0,
                NBReport = 0,
                Report = new List<string>(),
                DateCreation = DateTime.UtcNow,
                Note = new Evaluation { NbNote = 0, Note = 0 }
            };

            _context.Boutique.Add(boutique);
            await _context.SaveChangesAsync();

            return Ok(await BuildDto(boutique.IDBoutique));
        }

        // GET /api/merchants/mine — current user's boutique (any status)
        [HttpGet("mine")]
        public async Task<ActionResult<MerchantApplicationDto?>> Mine()
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var b = await _context.Boutique
                .Include(x => x.Gerant)
                .FirstOrDefaultAsync(x => x.IdGerant == userId.Value);

            if (b == null) return Ok(null);
            return Ok(ToDto(b));
        }

        // GET /api/merchants/pending — admin: list pending (unvalidated) applications
        [HttpGet("pending")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<IEnumerable<MerchantApplicationDto>>> Pending()
        {
            var list = await _context.Boutique
                .Include(b => b.Gerant)
                .Where(b => !b.Valide && !b.BAN)
                .OrderBy(b => b.DateCreation)
                .ToListAsync();
            return Ok(list.Select(ToDto));
        }

        // POST /api/merchants/{id}/approve — admin: approve application
        [HttpPost("{id:int}/approve")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Approve(int id)
        {
            var b = await _context.Boutique
                .Include(x => x.Gerant)
                .FirstOrDefaultAsync(x => x.IDBoutique == id);
            if (b == null) return NotFound();
            if (b.Valide) return BadRequest(new { message = "Already approved." });

            b.Valide = true;
            if (b.Gerant != null && b.Gerant.Role != Roles.Admin)
            {
                b.Gerant.Role = Roles.Gerant;
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Application approved." });
        }

        // POST /api/merchants/{id}/reject — admin: reject and delete the application
        [HttpPost("{id:int}/reject")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Reject(int id)
        {
            var b = await _context.Boutique.FirstOrDefaultAsync(x => x.IDBoutique == id);
            if (b == null) return NotFound();
            if (b.Valide) return BadRequest(new { message = "Can't reject an approved merchant." });

            _context.Boutique.Remove(b);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Application rejected." });
        }

        private int? GetUserId()
        {
            var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(idStr, out var id) ? id : (int?)null;
        }

        // Approximate coordinates for Algerian wilayas, used as a fallback when an
        // application doesn't include a precise map location. Defaults to Oran.
        private static (double Lat, double Lng) WilayaCoords(string? ville)
        {
            var key = (ville ?? "").Trim().ToLowerInvariant();
            return key switch
            {
                "alger" or "algiers" => (36.7538, 3.0588),
                "oran" => (35.6969, -0.6331),
                "constantine" => (36.3650, 6.6147),
                "annaba" => (36.9000, 7.7667),
                "blida" => (36.4703, 2.8277),
                "batna" => (35.5550, 6.1741),
                "setif" or "sétif" => (36.1898, 5.4108),
                "sidi bel abbès" or "sidi bel abbes" => (35.1878, -0.6306),
                "biskra" => (34.8500, 5.7333),
                "tlemcen" => (34.8783, -1.3150),
                "béjaïa" or "bejaia" => (36.7500, 5.0667),
                "tizi ouzou" => (36.7118, 4.0458),
                "mostaganem" => (35.9311, 0.0892),
                "ghardaïa" or "ghardaia" => (32.4900, 3.6700),
                "ouargla" => (31.9500, 5.3167),
                _ => (35.6969, -0.6331),
            };
        }

        private async Task<MerchantApplicationDto> BuildDto(int id)
        {
            var b = await _context.Boutique.Include(x => x.Gerant).FirstAsync(x => x.IDBoutique == id);
            return ToDto(b);
        }

        private static MerchantApplicationDto ToDto(Boutique b) => new MerchantApplicationDto
        {
            Id = b.IDBoutique,
            NomBoutique = b.NomBoutique,
            Ville = b.Ville,
            Description = b.Description,
            Localisation = b.Localisation,
            Registre = b.Registre,
            CuisineType = b.CuisineType,
            PhoneNumber = b.PhoneNumber,
            Latitude = b.Latitude,
            Longitude = b.Longitude,
            BoutiqueImagePath = b.BoutiqueImagePath,
            Valide = b.Valide,
            DateCreation = b.DateCreation,
            IdGerant = b.IdGerant,
            GerantNom = b.Gerant?.Nom ?? string.Empty,
            GerantEmail = b.Gerant?.Email ?? string.Empty,
            Rating = b.Note?.Note ?? 0.0,
            RatingCount = b.Note?.NbNote ?? 0
        };
    }
}
