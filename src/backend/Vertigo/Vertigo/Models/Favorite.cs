using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Vertigo.Models
{
    public class Favorite
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }

        [ForeignKey("UserId")]
        public virtual Utilisateur? User { get; set; }

        [Required]
        public int BoutiqueId { get; set; }

        [ForeignKey("BoutiqueId")]
        public virtual Boutique? Boutique { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
