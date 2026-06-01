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

            // Keep the demo seed accounts usable: never leave the seeded admin or
            // gérant banned (they're shared fixtures used for demos/tests).
            var seedAccounts = await ctx.Utilisateur
                .Where(u => (u.Email == "admin@vertigo.local" || u.Email == "seed@vertigo.local") && (u.BAN || u.NBReport > 0))
                .ToListAsync();
            if (seedAccounts.Count > 0)
            {
                foreach (var u in seedAccounts) { u.BAN = false; u.NBReport = 0; }
                await ctx.SaveChangesAsync();
            }
            var seedShops = await ctx.Boutique
                .Where(b => b.NomBoutique == "Oran Bakery" && (b.BAN || b.NBReport > 0))
                .ToListAsync();
            if (seedShops.Count > 0)
            {
                foreach (var b in seedShops) { b.BAN = false; b.NBReport = 0; }
                await ctx.SaveChangesAsync();
            }

            // Backfill: any boutique missing coordinates would be invisible in the
            // nearby/deals feed. Give them their wilaya's coordinates so their
            // baskets show up for clients.
            var missingCoords = await ctx.Boutique
                .Where(b => b.Latitude == null || b.Longitude == null)
                .ToListAsync();
            if (missingCoords.Count > 0)
            {
                foreach (var b in missingCoords)
                {
                    var (lat, lng) = WilayaToCoords(b.Ville);
                    b.Latitude = lat;
                    b.Longitude = lng;
                }
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

        // Idempotent test data: a single "Vertigo Test Kitchen" boutique with a few
        // high-stock fake baskets, handy for trying ordering / weekly booking.
        public static async Task EnsureTestBasketsAsync(VertigoContext ctx)
        {
            const string testShopName = "Vertigo Test Kitchen";
            var now = DateTime.UtcNow;

            var boutique = await ctx.Boutique.FirstOrDefaultAsync(b => b.NomBoutique == testShopName);
            if (boutique == null)
            {
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

                boutique = new Boutique
                {
                    NomBoutique = testShopName,
                    Ville = "Oran",
                    Description = "Test fixtures",
                    IdGerant = gerant.ID,
                    Localisation = "Centre-ville d'Oran — Test Kitchen",
                    Registre = "RC-TEST01",
                    Valide = true,
                    Note = new Evaluation { NbNote = 42, Note = 4.9 },
                    NBvente = 0,
                    NBReport = 0,
                    Report = new List<string>(),
                    BAN = false,
                    BoutiqueImagePath = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800",
                    DateCreation = now,
                    Latitude = 35.6969,
                    Longitude = -0.6331,
                    CuisineType = "Test",
                    PhoneNumber = "+213555123456"
                };
                ctx.Boutique.Add(boutique);
                await ctx.SaveChangesAsync();
            }

            // If the shop already has baskets, we're done (idempotent).
            if (await ctx.Panier.AnyAsync(p => p.IdBoutique == boutique.IDBoutique)) return;

            var testBaskets = new (string Name, string Desc, decimal Original, decimal Pct, string Img)[]
            {
                ("TEST Mega Bag", "Huge surprise bag — high stock for weekly-booking tests.", 2000m, 60m, "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800"),
                ("TEST Bakery Box", "Assorted bread & pastries left over from the day.", 800m, 50m, "https://images.unsplash.com/photo-1568254183919-78a4f43a2877?w=800"),
                ("TEST Veggie Crate", "Fresh seasonal vegetables nearing their date.", 1200m, 45m, "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800"),
                ("TEST Sushi Set", "Chef's surplus sushi platter.", 2500m, 55m, "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800"),
                ("TEST Sweet Box", "Cakes and desserts of the day.", 1500m, 40m, "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800"),
            };

            foreach (var b in testBaskets)
            {
                var discounted = Math.Round(b.Original * (1 - b.Pct / 100m), 2);
                ctx.Panier.Add(new Panier
                {
                    Name = TrimName(b.Name),
                    Description = b.Desc,
                    Types = "Surprise Basket",
                    IdBoutique = boutique.IDBoutique,
                    PanierPrix = discounted,
                    OriginalPrice = b.Original,
                    DiscountPercentage = b.Pct,
                    Note = new Evaluation { NbNote = 10, Note = 4.8 },
                    NBdispo = 25,                       // plenty of stock for 7-day booking
                    Statut = true,
                    PanierImagePath = b.Img,
                    ValidFrom = now.AddDays(-1),
                    ValidUntil = now.AddDays(30),
                    IsActive = true
                });
            }
            await ctx.SaveChangesAsync();
        }

        // A few more idempotent test shops scattered around Oran (within ~2 km of
        // the centre), each with a couple of high-stock baskets.
        public static async Task EnsureNearOranBasketsAsync(VertigoContext ctx)
        {
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

            await SeedTestShopAsync(ctx, gerant.ID, "Oran Test Deli", "Test deli", "Deli", 35.7015, -0.6285,
                "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800",
                new (string, string, string, decimal, decimal)[]
                {
                    ("Deli Lunch Box", "Sandwiches & sides from today's counter.", "Food Basket", 900m, 50m),
                    ("Cheese Box", "Assorted cheeses near their date.", "Food Basket", 1400m, 45m),
                });

            await SeedTestShopAsync(ctx, gerant.ID, "Oran Test Grill", "Test grill", "Grill", 35.6920, -0.6395,
                "https://images.unsplash.com/photo-1544025162-d76694265947?w=800",
                new (string, string, string, decimal, decimal)[]
                {
                    ("Grill Platter", "Mixed grilled meats surplus.", "Food Basket", 1800m, 55m),
                    ("Mixed Meat Box", "Chef's leftover grill selection.", "Food Basket", 2200m, 60m),
                });

            await SeedTestShopAsync(ctx, gerant.ID, "Oran Test Sweets", "Test sweets", "Pastry", 35.7005, -0.6360,
                "https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=800",
                new (string, string, string, decimal, decimal)[]
                {
                    ("Pastry Surprise", "End-of-day pastries & viennoiseries.", "Bakery Basket", 700m, 50m),
                    ("Cake Box", "Slices and whole cakes of the day.", "Bakery Basket", 1600m, 40m),
                });

            await SeedTestShopAsync(ctx, gerant.ID, "Oran Test Market", "Test market", "Grocery", 35.6885, -0.6300,
                "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800",
                new (string, string, string, decimal, decimal)[]
                {
                    ("Grocery Bag", "Pantry staples close to expiry.", "Grocery Basket", 1000m, 45m),
                    ("Fruit Crate", "Ripe seasonal fruit to rescue.", "Grocery Basket", 1200m, 50m),
                });
        }

        // Creates a test boutique (if missing) and its baskets (if it has none).
        private static async Task SeedTestShopAsync(
            VertigoContext ctx, int gerantId, string name, string description, string cuisine,
            double lat, double lng, string img,
            (string Name, string Desc, string Type, decimal Original, decimal Pct)[] baskets)
        {
            var now = DateTime.UtcNow;
            var boutique = await ctx.Boutique.FirstOrDefaultAsync(b => b.NomBoutique == name);
            if (boutique == null)
            {
                boutique = new Boutique
                {
                    NomBoutique = name,
                    Ville = "Oran",
                    Description = description,
                    IdGerant = gerantId,
                    Localisation = $"Oran — {name}",
                    Registre = "RC-" + Math.Abs(name.GetHashCode()) % 100000,
                    Valide = true,
                    Note = new Evaluation { NbNote = 30, Note = 4.6 },
                    NBvente = 0,
                    NBReport = 0,
                    Report = new List<string>(),
                    BAN = false,
                    BoutiqueImagePath = img,
                    DateCreation = now,
                    Latitude = lat,
                    Longitude = lng,
                    CuisineType = cuisine,
                    PhoneNumber = "+213555123456"
                };
                ctx.Boutique.Add(boutique);
                await ctx.SaveChangesAsync();
            }

            if (await ctx.Panier.AnyAsync(p => p.IdBoutique == boutique.IDBoutique)) return;

            foreach (var b in baskets)
            {
                var discounted = Math.Round(b.Original * (1 - b.Pct / 100m), 2);
                ctx.Panier.Add(new Panier
                {
                    Name = TrimName(b.Name),
                    Description = b.Desc,
                    Types = b.Type,
                    IdBoutique = boutique.IDBoutique,
                    PanierPrix = discounted,
                    OriginalPrice = b.Original,
                    DiscountPercentage = b.Pct,
                    Note = new Evaluation { NbNote = 8, Note = 4.6 },
                    NBdispo = 20,
                    Statut = true,
                    PanierImagePath = img,
                    ValidFrom = now.AddDays(-1),
                    ValidUntil = now.AddDays(30),
                    IsActive = true
                });
            }
            await ctx.SaveChangesAsync();
        }

        private static string TrimName(string s) => s.Length <= 20 ? s : s.Substring(0, 20);

        // Approximate coordinates per Algerian wilaya (fallback for boutiques with
        // no precise map location). Defaults to Oran.
        private static (double Lat, double Lng) WilayaToCoords(string? ville)
        {
            var key = (ville ?? "").Trim().ToLowerInvariant();
            return key switch
            {
                "alger" or "algiers" => (36.7538, 3.0588),
                "oran" => (35.6969, -0.6331),
                "constantine" => (36.3650, 6.6147),
                "annaba" => (36.9000, 7.7667),
                "blida" => (36.4703, 2.8277),
                "batna" => (35.5550, 6.1741),
                "setif" or "sétif" => (36.1898, 5.4108),
                "sidi bel abbès" or "sidi bel abbes" => (35.1878, -0.6306),
                "biskra" => (34.8500, 5.7333),
                "tlemcen" => (34.8783, -1.3150),
                "béjaïa" or "bejaia" => (36.7500, 5.0667),
                "tizi ouzou" => (36.7118, 4.0458),
                "mostaganem" => (35.9311, 0.0892),
                "ghardaïa" or "ghardaia" => (32.4900, 3.6700),
                "ouargla" => (31.9500, 5.3167),
                _ => (35.6969, -0.6331),
            };
        }
    }
}
