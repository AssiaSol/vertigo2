using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Vertigo.Models
{

    public class Panier
    {
        [Key]
        [Required]
        public int ID { get; set; }

        [Required]
        [MinLength(3),MaxLength(20)]
        public string Name { get; set; } = string.Empty;

        [Required]
        public string Description { get; set; }

        [Required]
        [RegularExpression("|Bakery Basket|Food Basket|Grocery Basket|Surprise Basket", ErrorMessage = "Rôle invalide")]
        public string Types { get; set; } = BasketTypes.NS;

        [Required]
        public int IdBoutique { get; set; }

        [ForeignKey("IdBoutique")]
        public virtual Boutique Boutique { get; set; }

        [Required]
        [Range(0.01, 1000.00)]
        public decimal PanierPrix { get; set; }
        
        [Required]
        [Range(0, 5)]
        public Evaluation Note { get; set; }

        [Required]
        public int NBdispo { get; set; } = 0;

        [Required]
        public bool Statut { get; set; }

        [Required]
        public string PanierImagePath { get; set; }

        // ── Offer/deal metadata (added for /api/restaurants/nearby) ──────────────
        [Range(0.0, 100000.0)]
        public decimal OriginalPrice { get; set; } = 0m;

        [Range(0.0, 100.0)]
        public decimal DiscountPercentage { get; set; } = 0m;

        public DateTime? ValidFrom { get; set; }
        public DateTime? ValidUntil { get; set; }

        public bool IsActive { get; set; } = true;
    }
}
