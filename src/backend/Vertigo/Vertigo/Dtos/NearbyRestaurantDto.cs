namespace Vertigo.Dtos
{
    public class NearbyRestaurantDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string Ville { get; set; } = string.Empty;
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public string? CuisineType { get; set; }
        public double Rating { get; set; }
        public string? ImageUrl { get; set; }
        public string? PhoneNumber { get; set; }
        public double DistanceKm { get; set; }
        public List<OfferDto> Offers { get; set; } = new();
    }

    public class OfferDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal DiscountPercentage { get; set; }
        public decimal OriginalPrice { get; set; }
        public decimal DiscountedPrice { get; set; }
        public DateTime? ValidFrom { get; set; }
        public DateTime? ValidUntil { get; set; }
        public string? ImageUrl { get; set; }
    }
}
