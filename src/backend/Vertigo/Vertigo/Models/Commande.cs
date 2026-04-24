using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Vertigo.Models
{
    public class Commande
    {
        [Key]
        [Required]
        public int ID { get; set; }

        [Required]
        public bool Reduction { get; set; }

        [Required]
        public int ClientID { get; set; }

        [ForeignKey("ClientID")]
        public virtual Utilisateur Client { get; set; }

        [Required]
        public int PanierID { get; set; }

        [ForeignKey("PanierID")]
        public virtual Panier Panier { get; set; }

        [Required]
        public DateTime DateDeCommande { get; set; }
        
        [Required]
        [Range(0.01, 1000.00)]
        public decimal Prix { get; set; }

        [Required]
        public bool Statut { get; set; } = false;

        // Multi-stage order status: Pending / Preparing / OnTheWay / Delivered / Cancelled
        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = OrderStatus.Pending;
    }

    public static class OrderStatus
    {
        public const string Pending = "Pending";
        public const string Preparing = "Preparing";
        public const string OnTheWay = "OnTheWay";
        public const string Delivered = "Delivered";
        public const string Cancelled = "Cancelled";
    }
}
