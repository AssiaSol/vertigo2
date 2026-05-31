using Microsoft.EntityFrameworkCore;
using Vertigo.Models;

namespace Vertigo.Data
{
    public class VertigoContext : DbContext
    {
        public VertigoContext(DbContextOptions<VertigoContext> options)
            : base(options) { }
        public DbSet<Utilisateur> Utilisateur { get; set; }
        public DbSet<Boutique> Boutique { get; set; }
        public DbSet<Commande> Commande { get; set; }
        public DbSet<Panier> Panier { get; set; }
        public DbSet<Favorite> Favorite { get; set; }
        public DbSet<DealFavorite> DealFavorite { get; set; }
        public DbSet<Avis> Avis { get; set; }
        public DbSet<ClientRating> ClientRating { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Commande>()
                .HasOne(c => c.Client)
                .WithMany()
                .HasForeignKey(c => c.ClientID)
                .OnDelete(DeleteBehavior.NoAction); // <--- LA SOLUTION

            modelBuilder.Entity<Commande>()
                .HasOne(c => c.Panier)
                .WithMany()
                .HasForeignKey(c => c.PanierID)
                .OnDelete(DeleteBehavior.NoAction); // <--- LA SOLUTION

            modelBuilder.Entity<Favorite>()
                .HasOne(f => f.User)
                .WithMany()
                .HasForeignKey(f => f.UserId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<Favorite>()
                .HasOne(f => f.Boutique)
                .WithMany()
                .HasForeignKey(f => f.BoutiqueId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<Favorite>()
                .HasIndex(f => new { f.UserId, f.BoutiqueId })
                .IsUnique();

            modelBuilder.Entity<DealFavorite>()
                .HasOne(f => f.User)
                .WithMany()
                .HasForeignKey(f => f.UserId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<DealFavorite>()
                .HasOne(f => f.Panier)
                .WithMany()
                .HasForeignKey(f => f.PanierId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<DealFavorite>()
                .HasIndex(f => new { f.UserId, f.PanierId })
                .IsUnique();

            modelBuilder.Entity<Avis>()
                .HasOne(a => a.Boutique)
                .WithMany()
                .HasForeignKey(a => a.BoutiqueId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<Avis>()
                .HasOne(a => a.Utilisateur)
                .WithMany()
                .HasForeignKey(a => a.UtilisateurId)
                .OnDelete(DeleteBehavior.NoAction);

            // One review per customer per boutique (we upsert on re-submit).
            modelBuilder.Entity<Avis>()
                .HasIndex(a => new { a.UtilisateurId, a.BoutiqueId })
                .IsUnique();

            modelBuilder.Entity<ClientRating>()
                .HasOne(r => r.Gerant)
                .WithMany()
                .HasForeignKey(r => r.GerantId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<ClientRating>()
                .HasOne(r => r.Client)
                .WithMany()
                .HasForeignKey(r => r.ClientId)
                .OnDelete(DeleteBehavior.NoAction);

            // One rating per merchant per customer (we upsert on re-submit).
            modelBuilder.Entity<ClientRating>()
                .HasIndex(r => new { r.GerantId, r.ClientId })
                .IsUnique();
        }
    }

}
