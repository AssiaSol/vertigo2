using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Vertigo.Models
{
    // A merchant's rating of a customer: 1–5 stars + an optional comment.
    // Allowed only after one of the merchant's orders to that customer is Delivered.
    public class ClientRating
    {
        [Key]
        public int Id { get; set; }

        // The rater — the boutique owner (gérant).
        [Required]
        public int GerantId { get; set; }

        // The rated customer.
        [Required]
        public int ClientId { get; set; }

        [Required]
        [Range(1, 5)]
        public int Note { get; set; }

        [MaxLength(1000)]
        public string? Commentaire { get; set; }

        [Required]
        public DateTime DateCreation { get; set; } = DateTime.UtcNow;

        [ForeignKey(nameof(GerantId))]
        public virtual Utilisateur? Gerant { get; set; }

        [ForeignKey(nameof(ClientId))]
        public virtual Utilisateur? Client { get; set; }
    }
}
