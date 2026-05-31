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
    public class RestaurantsController : ControllerBase
    {
        private readonly VertigoContext _context;

        public RestaurantsController(VertigoContext context)
        {
            _context = context;
        }

        // GET /api/restaurants/nearby?latitude=35.69&longitude=-0.63&radiusKm=5&sortBy=bestDiscount
        [HttpGet("nearby")]
        public async Task<ActionResult<IEnumerable<NearbyRestaurantDto>>> Nearby(
            [FromQuery] double latitude,
            [FromQuery] double longitude,
            [FromQuery] double radiusKm = 5,
            [FromQuery] string sortBy = "bestDiscount")
        {
            var now = DateTime.UtcNow;

            var candidates = await _context.Boutique
                .Where(b => b.Latitude != null && b.Longitude != null && !b.BAN)
                .Select(b => new
                {
                    Boutique = b,
                    ActiveOffers = _context.Panier
                        .Where(p => p.IdBoutique == b.IDBoutique
                            && p.IsActive
                            && p.DiscountPercentage > 0
                            && (p.ValidUntil == null || p.ValidUntil > now)
                            && (p.ValidFrom == null || p.ValidFrom <= now))
                        .ToList()
                })
                .Where(x => x.ActiveOffers.Any())
                .ToListAsync();

            var results = new List<NearbyRestaurantDto>();
            foreach (var x in candidates)
            {
                var b = x.Boutique;
                var distance = HaversineKm(latitude, longitude, b.Latitude!.Value, b.Longitude!.Value);
                if (distance > radiusKm) continue;

                results.Add(new NearbyRestaurantDto
                {
                    Id = b.IDBoutique,
                    Name = b.NomBoutique,
                    Address = b.Localisation,
                    Ville = b.Ville,
                    Latitude = b.Latitude.Value,
                    Longitude = b.Longitude.Value,
                    CuisineType = b.CuisineType,
                    Rating = b.Note?.Note ?? 0.0,
                    ImageUrl = b.BoutiqueImagePath,
                    PhoneNumber = b.PhoneNumber,
                    DistanceKm = Math.Round(distance, 2),
                    Offers = x.ActiveOffers
                        .OrderByDescending(o => o.DiscountPercentage)
                        .Select(o => new OfferDto
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
                        })
                        .ToList()
                });
            }

            results = (sortBy?.ToLowerInvariant()) switch
            {
                "distance" => results.OrderBy(r => r.DistanceKm).ToList(),
                "rating" => results.OrderByDescending(r => r.Rating).ToList(),
                _ => results.OrderByDescending(r => r.Offers.Max(o => o.DiscountPercentage)).ToList(),
            };

            return Ok(results);
        }

        // GET /api/restaurants/{id}?latitude=&longitude= — single restaurant + all its active deals
        [HttpGet("{id:int}")]
        public async Task<ActionResult<NearbyRestaurantDto>> Detail(
            int id,
            [FromQuery] double? latitude,
            [FromQuery] double? longitude)
        {
            var b = await _context.Boutique.FirstOrDefaultAsync(x => x.IDBoutique == id && !x.BAN);
            if (b == null) return NotFound();

            var now = DateTime.UtcNow;
            var offers = await _context.Panier
                .Where(p => p.IdBoutique == b.IDBoutique
                    && p.IsActive
                    && (p.ValidUntil == null || p.ValidUntil > now)
                    && (p.ValidFrom == null || p.ValidFrom <= now))
                .OrderByDescending(p => p.DiscountPercentage)
                .ToListAsync();

            double distanceKm = 0;
            if (latitude.HasValue && longitude.HasValue && b.Latitude.HasValue && b.Longitude.HasValue)
                distanceKm = Math.Round(HaversineKm(latitude.Value, longitude.Value, b.Latitude.Value, b.Longitude.Value), 2);

            return Ok(new NearbyRestaurantDto
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

        private static double HaversineKm(double lat1, double lng1, double lat2, double lng2)
        {
            const double R = 6371.0;
            var dLat = ToRadians(lat2 - lat1);
            var dLng = ToRadians(lng2 - lng1);
            var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2)
                  + Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2))
                  * Math.Sin(dLng / 2) * Math.Sin(dLng / 2);
            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
            return R * c;
        }

        private static double ToRadians(double degrees) => degrees * Math.PI / 180.0;
    }
}
