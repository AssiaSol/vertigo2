using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Vertigo.Models
{
    // A customer's review of a boutique: 1–5 stars + an optional comment.
    // Allowed only after the customer has a completed (Delivered) order from it.
    public class Avis
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int UtilisateurId { get; set; }

        [Required]
        public int BoutiqueId { get; set; }

        [Required]
        [Range(1, 5)]
        public int Note { get; set; }

        [MaxLength(1000)]
        public string? Commentaire { get; set; }

        [Required]
        public DateTime DateCreation { get; set; } = DateTime.UtcNow;

        [ForeignKey(nameof(UtilisateurId))]
        public virtual Utilisateur? Utilisateur { get; set; }

        [ForeignKey(nameof(BoutiqueId))]
        public virtual Boutique? Boutique { get; set; }
    }
}
