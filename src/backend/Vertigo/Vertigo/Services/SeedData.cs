using Microsoft.EntityFrameworkCore;
using Vertigo.Data;
using Vertigo.Models;
using Vertigo.Utils;

namespace Vertigo.Services
{
    public static class SeedData
    {
        public static async Task EnsureSeededAsync(VertigoContext ctx)
        {
            // Always ensure admin user exists (independent of boutique seed check)
            var admin = await ctx.Utilisateur.FirstOrDefaultAsync(u => u.Email == "admin@vertigo.local");
            if (admin == null)
            {
                admin = new Utilisateur
                {
                    Nom = "SeedAdmin",
                    Email = "admin@vertigo.local",
                    MotDePasse = SecurityHelper.HashPassword("AdminPass123"),
                    Telephone = "+213555999999",
                    Role = "Admin",
                    DateInscription = DateTime.UtcNow,
                    NBReport = 0,
                    Report = new List<string>(),
                    Etudiant = false,
                    BAN = false,
                    ProfilImagePath = "/images/default-profile.png"
                };
                ctx.Utilisateur.Add(admin);
                await ctx.SaveChangesAsync();
            }

            if (await ctx.Boutique.AnyAsync(b => b.Latitude != null)) return;

            // 1) Seed gérant user
            var gerant = await ctx.Utilisateur.FirstOrDefaultAsync(u => u.Email == "seed@vertigo.local");
            if (gerant == null)
            {
                gerant = new Utilisateur
                {
                    Nom = "SeedGerant",
                    Email = "seed@vertigo.local",
                    MotDePasse = SecurityHelper.HashPassword("SeedPass123"),
                    Telephone = "+213555000000",
                    Role = "Gerant",
                    DateInscription = DateTime.UtcNow,
                    NBReport = 0,
                    Report = new List<string>(),
                    Etudiant = false,
                    BAN = false,
                    ProfilImagePath = "/images/default-profile.png"
                };
                ctx.Utilisateur.Add(gerant);
                await ctx.SaveChangesAsync();
            }

            // 2) Seed boutiques around Oran (35.6969, -0.6331)
            var now = DateTime.UtcNow;
            var rng = new Random(42);

            var seeds = new (string Name, string Cuisine, double Lat, double Lng, string Phone, double Rating, string Img)[]
            {
                ("Oran Bakery", "Bakery", 35.6975, -0.6310, "+213555100001", 4.7, "https://images.unsplash.com/photo-1568254183919-78a4f43a2877?w=800"),
                ("Café Riviera", "Café", 35.7002, -0.6400, "+213555100002", 4.4, "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800"),
                ("Pizza Roma", "Italian", 35.6920, -0.6250, "+213555100003", 4.5, "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800"),
                ("Le Petit Four", "Pastry", 35.6955, -0.6350, "+213555100004", 4.8, "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800"),
                ("Couscous Royal", "Algerian", 35.6880, -0.6400, "+213555100005", 4.6, "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800"),
                ("Sushi Oran", "Japanese", 35.7050, -0.6200, "+213555100006", 4.3, "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800"),
                ("Burger House", "Burgers", 35.6933, -0.6300, "+213555100007", 4.2, "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800"),
                ("Green Garden", "Vegetarian", 35.6900, -0.6450, "+213555100008", 4.5, "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800"),
                ("Paella Bar", "Spanish", 35.7020, -0.6250, "+213555100009", 4.4, "https://images.unsplash.com/photo-1534080564583-6be75777b70a?w=800"),
                ("Chez Karim", "Algerian", 35.6850, -0.6380, "+213555100010", 4.6, "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800"),
                ("Mama Kitchen", "Home", 35.6960, -0.6280, "+213555100011", 4.7, "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800"),
                ("Taco Loco", "Mexican", 35.7000, -0.6150, "+213555100012", 4.3, "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800"),
            };

            var basketTypes = new[] { "Bakery Basket", "Food Basket", "Grocery Basket", "Surprise Basket" };

            foreach (var s in seeds)
            {
                var boutique = new Boutique
                {
                    NomBoutique = s.Name,
                    Ville = "Oran",
                    Description = s.Cuisine,
                    IdGerant = gerant.ID,
                    Localisation = $"Rue principale, centre-ville d'Oran, {s.Name}",
                    Registre = "RC-" + rng.Next(10000, 99999),
                    Valide = true,
                    Note = new Evaluation { NbNote = rng.Next(10, 200), Note = s.Rating },
                    NBvente = rng.Next(5, 150),
                    NBReport = 0,
                    Report = new List<string>(),
                    BAN = false,
                    BoutiqueImagePath = s.Img,
                    DateCreation = now.AddDays(-rng.Next(30, 365)),
                    Latitude = s.Lat,
                    Longitude = s.Lng,
                    CuisineType = s.Cuisine,
                    PhoneNumber = s.Phone
                };
                ctx.Boutique.Add(boutique);
                await ctx.SaveChangesAsync();

                // 1–2 active offers per boutique
                var offerCount = rng.Next(1, 3);
                for (int i = 0; i < offerCount; i++)
                {
                    var discountPct = (decimal)(rng.Next(20, 65));
                    var original = (decimal)(rng.Next(400, 2000));
                    var discounted = Math.Round(original * (1 - discountPct / 100m), 2);

                    ctx.Panier.Add(new Panier
                    {
                        Name = TrimName($"{s.Cuisine} Deal {i + 1}"),
                        Description = $"Surplus {s.Cuisine.ToLower()} basket from {s.Name}",
                        Types = basketTypes[rng.Next(basketTypes.Length)],
                        IdBoutique = boutique.IDBoutique,
                        PanierPrix = discounted,
                        OriginalPrice = original,
                        DiscountPercentage = discountPct,
                        Note = new Evaluation { NbNote = rng.Next(5, 80), Note = Math.Round(3.5 + rng.NextDouble() * 1.5, 1) },
                        NBdispo = rng.Next(1, 8),
                        Statut = true,
                        PanierImagePath = s.Img,
                        ValidFrom = now.AddDays(-1),
                        ValidUntil = now.AddDays(rng.Next(1, 14)),
                        IsActive = true
                    });
                }

                await ctx.SaveChangesAsync();
            }
        }

        private static string TrimName(string s) => s.Length <= 20 ? s : s.Substring(0, 20);
    }
}
