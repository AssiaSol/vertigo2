using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Vertigo.Data;

namespace Vertigo.Controllers
{
    public class HomeController : Controller
    {
        private readonly VertigoContext _context;

        public HomeController(VertigoContext context)
        {
            _context = context;
        }

        [HttpGet("init")]
        public async Task<ActionResult<object>> GetHomeInit()
        { 
            var nbBoutiques = await _context.Boutique.CountAsync();
            var nbCommandes = await _context.Commande.CountAsync();
            var nbVilles = await _context.Boutique.Select(b => b.Ville).Distinct().CountAsync();

            return Ok(new
            {
                stats = new
                {
                    foodRescued = $"{nbCommandes * 0.5} kg", // Calculé !
                    partnerCount = nbBoutiques,
                    villesCount = nbVilles
                },

                recentPartners = await _context.Boutique
                    .OrderByDescending(b => b.IDBoutique)
                    .Take(3)
                    .Select(b => new { b.NomBoutique , b.Ville })
                    .ToListAsync()
            });
        }
    }
    }

