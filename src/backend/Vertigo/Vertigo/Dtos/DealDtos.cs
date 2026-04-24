using System.ComponentModel.DataAnnotations;

namespace Vertigo.Dtos
{
    public class CreateDealRequest
    {
        [Required]
        [MinLength(3), MaxLength(20)]
        public string Name { get; set; } = string.Empty;

        [Required]
        public string Description { get; set; } = string.Empty;

        [Required]
        [RegularExpression("Bakery Basket|Food Basket|Grocery Basket|Surprise Basket",
            ErrorMessage = "Type must be one of: Bakery Basket, Food Basket, Grocery Basket, Surprise Basket.")]
        public string Types { get; set; } = string.Empty;

        [Required]
        [Range(0.01, 100000.0)]
        public decimal OriginalPrice { get; set; }

        [Required]
        [Range(0.0, 100.0)]
        public decimal DiscountPercentage { get; set; }

        [Range(0, 10000)]
        public int NBdispo { get; set; } = 0;

        public DateTime? ValidFrom { get; set; }
        public DateTime? ValidUntil { get; set; }

        [MaxLength(500)]
        public string? PanierImagePath { get; set; }
    }

    public class UpdateDealRequest : CreateDealRequest
    {
        public bool IsActive { get; set; } = true;
    }

    public class DealDto
    {
        public int Id { get; set; }
        public int BoutiqueId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Types { get; set; } = string.Empty;
        public decimal OriginalPrice { get; set; }
        public decimal DiscountPercentage { get; set; }
        public decimal DiscountedPrice { get; set; }
        public int NBdispo { get; set; }
        public DateTime? ValidFrom { get; set; }
        public DateTime? ValidUntil { get; set; }
        public bool IsActive { get; set; }
        public string? PanierImagePath { get; set; }
        public double Rating { get; set; }
    }
}
