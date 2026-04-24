using Microsoft.AspNetCore.Mvc;
using Vertigo.Data;
using Microsoft.EntityFrameworkCore;

namespace Vertigo.Controllers
{
    public class AdminController : Controller
    {
        private readonly VertigoContext _context;

        public AdminController(VertigoContext context)
        {
            _context = context;
        }
        
        public async Task<IActionResult>  Index()
        {
            int TotalVentes = await _context.Commande.CountAsync();
            int TauxDeRecup = await _context.Commande
                                    .Where(c => c.Statut == true)
                                    .CountAsync();
            decimal chifreAffaire = await _context.Commande
                                            .Where(c => c.Statut == true)
                                            .SumAsync(c => c.Prix);
            var ListCommande = await _context.Commande
                                            .Include(c => c.Client)
                                            .Include(c => c.Panier)
                                                .ThenInclude(p => p.Boutique)
                                            .ToListAsync();


            ViewBag.TotalVentes = TotalVentes;
            ViewBag.TauxDeRecup = (TauxDeRecup / TotalVentes) * 100 ;
            ViewBag.ChifreAff = chifreAffaire;
            ViewBag.comission = (chifreAffaire / 4) ;
            ViewBag.reverse = (chifreAffaire / 4) * 3;

            return View("Dashboard",ListCommande);
        }
   
    
    
    
    
    
    
    
    
    
    
    
    
    
    }
}
