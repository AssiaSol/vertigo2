using System.ComponentModel.DataAnnotations;

namespace Vertigo.Dtos
{
    public class CreateOrderRequest
    {
        [Required]
        public int PanierId { get; set; }
    }

    // Book the same basket for a chosen period (max 7 days).
    public class ScheduleOrderRequest
    {
        [Required]
        public int PanierId { get; set; }
        [Required]
        public DateTime StartDate { get; set; }
        [Required]
        public DateTime EndDate { get; set; }
    }

    public class UpdateStatusRequest
    {
        [Required]
        public string? Status { get; set; }
    }

    // Merchant rates a customer after an order is delivered.
    public class RateClientRequest
    {
        public int Note { get; set; }
        public string? Commentaire { get; set; }
    }

    public class OrderDto
    {
        public int Id { get; set; }
        public int PanierId { get; set; }
        public string PanierName { get; set; } = string.Empty;
        public string? PanierImageUrl { get; set; }
        public int BoutiqueId { get; set; }
        public string BoutiqueName { get; set; } = string.Empty;
        public int ClientId { get; set; }
        public string ClientName { get; set; } = string.Empty;
        public decimal Prix { get; set; }
        public DateTime DateDeCommande { get; set; }
        public bool Statut { get; set; }
        public string Status { get; set; } = "Pending";
    }

    public class ReportRequest
    {
        [MaxLength(300)]
        public string? Reason { get; set; }
    }
}
