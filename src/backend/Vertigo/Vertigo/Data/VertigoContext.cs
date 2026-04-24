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
        }
    }

}
