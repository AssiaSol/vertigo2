using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Vertigo.Models
{
    public class Boutique
    {
        [Key]
        [Required]
        public int IDBoutique { get; set; }

        [Required]
        [MinLength(3),MaxLength(20)]
        public string NomBoutique { get; set; } = string.Empty;

        [Required]
        [MinLength(3), MaxLength(20)]
        public string Ville { get; set; } = string.Empty;

        [Required]
        [MinLength(3), MaxLength(20)]
        public string Description { get; set; } = string.Empty;

        [Required]
        public int IdGerant { get; set; }

        [ForeignKey("IdGerant")]
        public virtual Utilisateur Gerant { get; set; }

        [Required]
        [MinLength(25)]
        public string Localisation { get; set; } = string.Empty;

        [Required] 
        public string Registre { get; set; } = string.Empty;

        [Required]
        public bool Valide { get; set; } = false;

        [Required]
        [Range(0, 5)]
        public Evaluation Note { get; set; } 

        [Required]
        public int NBvente { get; set; } = 0;

        [Required]
        public int NBReport { get; set; } = 0;

        public List<string> Report { get; set; } = new List<string>();

        [Required]
        public bool BAN { get; set; } = false;

        [Required]
        public string BoutiqueImagePath { get; set; }

        [Required]
        public DateTime DateCreation { get; set; } = DateTime.Now;

        // ── Geolocation + restaurant metadata (added for /api/restaurants/nearby) ──
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }

        [MaxLength(100)]
        public string? CuisineType { get; set; }

        [MaxLength(30)]
        [Phone]
        public string? PhoneNumber { get; set; }
    }
}
