using System.ComponentModel.DataAnnotations;

namespace Vertigo.Dtos
{
    public class MerchantApplicationRequest
    {
        [Required]
        [MinLength(3), MaxLength(20)]
        public string NomBoutique { get; set; } = string.Empty;

        [Required]
        [MinLength(3), MaxLength(20)]
        public string Ville { get; set; } = string.Empty;

        [Required]
        [MinLength(3), MaxLength(20)]
        public string Description { get; set; } = string.Empty;

        [Required]
        [MinLength(25)]
        public string Localisation { get; set; } = string.Empty;

        /// <summary>Registre de commerce — required proof of real business.</summary>
        [Required]
        [MinLength(4)]
        public string Registre { get; set; } = string.Empty;

        public double? Latitude { get; set; }
        public double? Longitude { get; set; }

        [MaxLength(100)]
        public string? CuisineType { get; set; }

        [Phone]
        [MaxLength(30)]
        public string? PhoneNumber { get; set; }

        [MaxLength(500)]
        public string? BoutiqueImagePath { get; set; }
    }

    public class MerchantApplicationDto
    {
        public int Id { get; set; }
        public string NomBoutique { get; set; } = string.Empty;
        public string Ville { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Localisation { get; set; } = string.Empty;
        public string Registre { get; set; } = string.Empty;
        public string? CuisineType { get; set; }
        public string? PhoneNumber { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public string? BoutiqueImagePath { get; set; }
        public bool Valide { get; set; }
        public DateTime DateCreation { get; set; }
        public int IdGerant { get; set; }
        public string GerantNom { get; set; } = string.Empty;
        public string GerantEmail { get; set; } = string.Empty;
        public double Rating { get; set; }
        public int RatingCount { get; set; }
    }
}
