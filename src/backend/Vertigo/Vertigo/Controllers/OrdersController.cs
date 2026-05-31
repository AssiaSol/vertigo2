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
    public class OrdersController : ControllerBase
    {
        private readonly VertigoContext _context;

        public OrdersController(VertigoContext context)
        {
            _context = context;
        }

        // POST /api/orders — customer places an order for a basket
        [HttpPost]
        public async Task<ActionResult<OrderDto>> Create([FromBody] CreateOrderRequest req)
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var panier = await _context.Panier
                .Include(p => p.Boutique)
                .FirstOrDefaultAsync(p => p.ID == req.PanierId);

            if (panier == null) return NotFound(new { message = "Basket not found." });
            if (!panier.IsActive || panier.NBdispo <= 0)
                return BadRequest(new { message = "This basket is no longer available." });
            if (panier.ValidUntil != null && panier.ValidUntil < DateTime.UtcNow)
                return BadRequest(new { message = "This offer has expired." });

            var order = new Commande
            {
                ClientID = userId.Value,
                PanierID = panier.ID,
                DateDeCommande = DateTime.UtcNow,
                Prix = panier.PanierPrix,
                Reduction = panier.DiscountPercentage > 0,
                Statut = false
            };

            panier.NBdispo -= 1;
            if (panier.NBdispo <= 0) panier.Statut = false;

            _context.Commande.Add(order);
            await _context.SaveChangesAsync();

            return Ok(await BuildOrderDto(order.ID));
        }

        // POST /api/orders/schedule — book the same basket for a chosen period.
        // One order per day from StartDate to EndDate inclusive (max 7 days),
        // as far as stock allows.
        [HttpPost("schedule")]
        public async Task<IActionResult> Schedule([FromBody] ScheduleOrderRequest req)
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var start = req.StartDate.Date;
            var end = req.EndDate.Date;
            var today = DateTime.UtcNow.Date;

            if (end < start) return BadRequest(new { message = "End date is before start date." });
            if (start < today) return BadRequest(new { message = "You can't book a date in the past." });

            var days = (end - start).Days + 1;
            if (days > 7) return BadRequest(new { message = "You can book at most 7 days." });

            var panier = await _context.Panier
                .Include(p => p.Boutique)
                .FirstOrDefaultAsync(p => p.ID == req.PanierId);

            if (panier == null) return NotFound(new { message = "Basket not found." });
            if (!panier.IsActive || panier.NBdispo <= 0)
                return BadRequest(new { message = "This basket is no longer available." });
            if (panier.ValidUntil != null && panier.ValidUntil < DateTime.UtcNow)
                return BadRequest(new { message = "This offer has expired." });

            var placed = 0;
            for (var i = 0; i < days && panier.NBdispo > 0; i++)
            {
                _context.Commande.Add(new Commande
                {
                    ClientID = userId.Value,
                    PanierID = panier.ID,
                    DateDeCommande = start.AddDays(i),
                    Prix = panier.PanierPrix,
                    Reduction = panier.DiscountPercentage > 0,
                    Statut = false
                });
                panier.NBdispo -= 1;
                placed++;
            }
            if (panier.NBdispo <= 0) panier.Statut = false;

            await _context.SaveChangesAsync();
            return Ok(new { placed, message = $"Booked for {placed} day(s)." });
        }

        // GET /api/orders/mine — customer's orders
        [HttpGet("mine")]
        public async Task<ActionResult<IEnumerable<OrderDto>>> Mine()
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var orders = await _context.Commande
                .Where(c => c.ClientID == userId.Value)
                .Include(c => c.Panier).ThenInclude(p => p.Boutique)
                .Include(c => c.Client)
                .OrderByDescending(c => c.DateDeCommande)
                .ToListAsync();

            return Ok(orders.Select(ToDto));
        }

        // GET /api/orders/boutique — gérant's incoming orders (for boutiques they manage)
        [HttpGet("boutique")]
        public async Task<ActionResult<IEnumerable<OrderDto>>> ForMyBoutique()
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var orders = await _context.Commande
                .Include(c => c.Panier).ThenInclude(p => p.Boutique)
                .Include(c => c.Client)
                .Where(c => c.Panier.Boutique.IdGerant == userId.Value)
                .OrderByDescending(c => c.DateDeCommande)
                .ToListAsync();

            return Ok(orders.Select(ToDto));
        }

        // GET /api/orders/{id}/client — customer details for one order (gérant only).
        // Includes the customer's contact info, their review of this restaurant,
        // and their order history with this restaurant.
        [HttpGet("{id:int}/client")]
        public async Task<IActionResult> ClientDetails(int id)
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var order = await _context.Commande
                .Include(c => c.Panier).ThenInclude(p => p.Boutique)
                .Include(c => c.Client)
                .FirstOrDefaultAsync(c => c.ID == id);

            if (order == null) return NotFound();
            if (order.Panier?.Boutique == null || order.Panier.Boutique.IdGerant != userId.Value)
                return Forbid();

            var client = order.Client;
            var boutiqueId = order.Panier.Boutique.IDBoutique;

            var review = await _context.Avis
                .FirstOrDefaultAsync(a => a.UtilisateurId == order.ClientID && a.BoutiqueId == boutiqueId);

            var totalOrders = await _context.Commande
                .CountAsync(c => c.ClientID == order.ClientID && c.Panier.IdBoutique == boutiqueId);
            var completed = await _context.Commande
                .CountAsync(c => c.ClientID == order.ClientID && c.Panier.IdBoutique == boutiqueId
                    && (c.Status == OrderStatus.Delivered || c.Statut));

            // Customer's aggregate rating (given by all merchants) + this merchant's own rating.
            var clientRatings = await _context.ClientRating
                .Where(r => r.ClientId == order.ClientID)
                .ToListAsync();
            var myRating = clientRatings.FirstOrDefault(r => r.GerantId == userId.Value);
            var isDelivered = order.Status == OrderStatus.Delivered || order.Statut;

            return Ok(new
            {
                clientName = client?.Nom ?? string.Empty,
                phone = client?.Telephone ?? string.Empty,
                email = client?.Email ?? string.Empty,
                nbReport = client?.NBReport ?? 0,
                etudiant = client?.Etudiant ?? false,
                memberSince = client?.DateInscription,
                order = new
                {
                    id = order.ID,
                    panierName = order.Panier?.Name ?? string.Empty,
                    prix = order.Prix,
                    status = string.IsNullOrEmpty(order.Status) ? OrderStatus.Pending : order.Status,
                    date = order.DateDeCommande,
                },
                review = review == null ? null : new
                {
                    note = review.Note,
                    commentaire = review.Commentaire,
                    date = review.DateCreation,
                },
                stats = new { totalOrders, completed },
                canRateClient = isDelivered,
                customerRating = new
                {
                    average = clientRatings.Count > 0 ? Math.Round(clientRatings.Average(r => r.Note), 1) : 0.0,
                    count = clientRatings.Count,
                },
                myClientRating = myRating == null ? null : new
                {
                    note = myRating.Note,
                    commentaire = myRating.Commentaire,
                },
            });
        }

        // POST /api/orders/{id}/rate-client — merchant rates the customer (1–5 + comment).
        // Allowed only once the order is Delivered. Upserts one rating per merchant+customer.
        [HttpPost("{id:int}/rate-client")]
        public async Task<IActionResult> RateClient(int id, [FromBody] RateClientRequest req)
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            if (req.Note < 1 || req.Note > 5)
                return BadRequest(new { message = "Rating must be between 1 and 5 stars." });

            var order = await _context.Commande
                .Include(c => c.Panier).ThenInclude(p => p.Boutique)
                .FirstOrDefaultAsync(c => c.ID == id);

            if (order == null) return NotFound();
            if (order.Panier?.Boutique == null || order.Panier.Boutique.IdGerant != userId.Value)
                return Forbid();
            if (!(order.Status == OrderStatus.Delivered || order.Statut))
                return BadRequest(new { message = "You can only rate a customer after the order is delivered." });

            var rating = await _context.ClientRating
                .FirstOrDefaultAsync(r => r.GerantId == userId.Value && r.ClientId == order.ClientID);

            if (rating == null)
            {
                rating = new ClientRating
                {
                    GerantId = userId.Value,
                    ClientId = order.ClientID,
                    Note = req.Note,
                    Commentaire = string.IsNullOrWhiteSpace(req.Commentaire) ? null : req.Commentaire.Trim(),
                    DateCreation = DateTime.UtcNow,
                };
                _context.ClientRating.Add(rating);
            }
            else
            {
                rating.Note = req.Note;
                rating.Commentaire = string.IsNullOrWhiteSpace(req.Commentaire) ? null : req.Commentaire.Trim();
                rating.DateCreation = DateTime.UtcNow;
            }
            await _context.SaveChangesAsync();

            var all = await _context.ClientRating.Where(r => r.ClientId == order.ClientID).ToListAsync();
            return Ok(new
            {
                message = "Customer rated.",
                average = all.Count > 0 ? Math.Round(all.Average(r => r.Note), 1) : 0.0,
                count = all.Count,
            });
        }

        // POST /api/orders/{id}/complete — mark order as paid / fulfilled (legacy)
        [HttpPost("{id:int}/complete")]
        public async Task<IActionResult> Complete(int id)
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var order = await _context.Commande
                .Include(c => c.Panier).ThenInclude(p => p.Boutique)
                .FirstOrDefaultAsync(c => c.ID == id);

            if (order == null) return NotFound();
            var isClient = order.ClientID == userId.Value;
            var isGerant = order.Panier.Boutique.IdGerant == userId.Value;
            if (!isClient && !isGerant) return Forbid();

            order.Statut = true;
            order.Status = OrderStatus.Delivered;
            await _context.SaveChangesAsync();
            return Ok(await BuildOrderDto(order.ID));
        }

        // POST /api/orders/{id}/status — advance order to a new stage
        // Body: { "status": "Preparing" | "OnTheWay" | "Delivered" | "Cancelled" }
        [HttpPost("{id:int}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateStatusRequest req)
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var order = await _context.Commande
                .Include(c => c.Panier).ThenInclude(p => p.Boutique)
                .FirstOrDefaultAsync(c => c.ID == id);
            if (order == null) return NotFound();

            var isClient = order.ClientID == userId.Value;
            var isGerant = order.Panier.Boutique.IdGerant == userId.Value;
            if (!isClient && !isGerant) return Forbid();

            var next = req.Status?.Trim();
            switch (next)
            {
                case OrderStatus.Preparing:
                    if (!isGerant) return Forbid();
                    if (order.Status != OrderStatus.Pending) return BadRequest(new { message = "Order must be Pending to start preparing." });
                    order.Status = OrderStatus.Preparing;
                    break;
                case OrderStatus.OnTheWay:
                    if (!isGerant) return Forbid();
                    if (order.Status != OrderStatus.Preparing) return BadRequest(new { message = "Order must be Preparing first." });
                    order.Status = OrderStatus.OnTheWay;
                    break;
                case OrderStatus.Delivered:
                    if (order.Status == OrderStatus.Delivered) return BadRequest(new { message = "Already delivered." });
                    if (order.Status == OrderStatus.Cancelled) return BadRequest(new { message = "Order was cancelled." });
                    order.Status = OrderStatus.Delivered;
                    order.Statut = true;
                    break;
                case OrderStatus.Cancelled:
                    if (order.Status == OrderStatus.Delivered) return BadRequest(new { message = "Can't cancel delivered orders." });
                    order.Status = OrderStatus.Cancelled;
                    if (order.Panier != null) order.Panier.NBdispo += 1;
                    break;
                default:
                    return BadRequest(new { message = "Unknown status." });
            }

            await _context.SaveChangesAsync();
            return Ok(await BuildOrderDto(order.ID));
        }

        // POST /api/orders/{id}/cancel — cancel an unfulfilled order
        [HttpPost("{id:int}/cancel")]
        public async Task<IActionResult> Cancel(int id)
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var order = await _context.Commande
                .Include(c => c.Panier).ThenInclude(p => p.Boutique)
                .FirstOrDefaultAsync(c => c.ID == id);

            if (order == null) return NotFound();
            var isClient = order.ClientID == userId.Value;
            var isGerant = order.Panier.Boutique.IdGerant == userId.Value;
            if (!isClient && !isGerant) return Forbid();
            if (order.Statut) return BadRequest(new { message = "Cannot cancel a completed order." });

            if (order.Panier != null) order.Panier.NBdispo += 1;
            _context.Commande.Remove(order);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Order cancelled." });
        }

        // DELETE /api/orders/{id} — clean up a finished order from the client's list.
        // Removes the row only (no restock); allowed for the owner's cancelled orders.
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Clean(int id)
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var order = await _context.Commande.FirstOrDefaultAsync(c => c.ID == id);
            if (order == null) return NotFound();
            if (order.ClientID != userId.Value) return Forbid();
            if (order.Status != OrderStatus.Cancelled)
                return BadRequest(new { message = "Only cancelled orders can be cleared." });

            _context.Commande.Remove(order);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Order removed." });
        }

        private int? GetUserId()
        {
            var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(idStr, out var id) ? id : (int?)null;
        }

        private async Task<OrderDto> BuildOrderDto(int id)
        {
            var c = await _context.Commande
                .Include(x => x.Panier).ThenInclude(p => p.Boutique)
                .Include(x => x.Client)
                .FirstAsync(x => x.ID == id);
            return ToDto(c);
        }

        private static OrderDto ToDto(Commande c) => new OrderDto
        {
            Id = c.ID,
            PanierId = c.PanierID,
            PanierName = c.Panier?.Name ?? string.Empty,
            PanierImageUrl = c.Panier?.PanierImagePath,
            BoutiqueId = c.Panier?.Boutique?.IDBoutique ?? 0,
            BoutiqueName = c.Panier?.Boutique?.NomBoutique ?? string.Empty,
            ClientId = c.ClientID,
            ClientName = c.Client?.Nom ?? string.Empty,
            Prix = c.Prix,
            DateDeCommande = c.DateDeCommande,
            Statut = c.Statut,
            Status = string.IsNullOrEmpty(c.Status) ? OrderStatus.Pending : c.Status
        };
    }
}
