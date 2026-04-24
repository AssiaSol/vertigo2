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
