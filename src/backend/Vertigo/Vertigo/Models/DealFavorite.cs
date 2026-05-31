using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Vertigo.Models
{
    public class DealFavorite
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }

        [ForeignKey("UserId")]
        public virtual Utilisateur? User { get; set; }

        [Required]
        public int PanierId { get; set; }

        [ForeignKey("PanierId")]
        public virtual Panier? Panier { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
