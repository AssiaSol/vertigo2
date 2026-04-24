using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Vertigo.Data;
using Vertigo.Models;

namespace Vertigo.Controllers
{
    public class UtilisateursController : Controller
    {
        private readonly VertigoContext _context;

        public UtilisateursController(VertigoContext context)
        {
            _context = context;
        }

        // GET: Utilisateurs /Lists

        [Authorize(Roles = Roles.Admin)]
        public async Task<IActionResult> Index(string? sortOrder)
        {
            var utili = _context.Utilisateur.AsNoTracking().AsQueryable();

            utili = sortOrder switch
            {
                "report_desc" => utili.OrderByDescending(u => u.NBReport),
                "date_asc" => utili.OrderBy(u => u.DateInscription),
                "date_desc" => utili.OrderByDescending(u => u.DateInscription),
                "nom" => utili.OrderBy(u => u.Nom),
                _ => utili.OrderBy(u => u.ID)
            };

            var result = await utili.Select(u => new Utilisateur
            {
                ID = u.ID,
                Nom = u.Nom,
                Email = u.Email,
                Role = u.Role,
                NBReport = u.NBReport,
                BAN = u.BAN,
                DateInscription = u.DateInscription
            }).ToListAsync();

            return PartialView("_ListeUtilisateurs", result);
        }

        // GET: Utilisateurs/Details ---------------------------------------------

        [Authorize(Roles = Roles.Admin)]
        public async Task<IActionResult> Details(int id)
        {
            var utilisateur = await _context.Utilisateur
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.ID == id);

            if (utilisateur == null) return NotFound();

            return PartialView("_ProfilUtilisateur", utilisateur);
        }


        //post: Utilisateurs/BAN---------------------------------------------------------------------------------------------------------
        [HttpPost]
        [ValidateAntiForgeryToken]
        [Authorize(Roles = Roles.Admin)]
        public async Task<IActionResult> BAN(int id)
        {
            var currentUserIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            int currentUserId = int.Parse(currentUserIdStr);
            var utilisateur = await _context.Utilisateur.FindAsync(id);
            
            if (id == currentUserId) return BadRequest("Vous ne pouvez pas vous bannir vous-même.");
            
            if (utilisateur == null) return NotFound();

            utilisateur.BAN = true;
            await _context.SaveChangesAsync();
            return PartialView("_ConfirmationBan" , utilisateur);
        }




        //POST: Utilisateurs/Report---------------------------------------------------------------------------------------------------------
        [HttpPost]
        [ValidateAntiForgeryToken]
        [Authorize(Roles = Roles.Admin + "," + Roles.Gerant)]
        public async Task<IActionResult> Report(int id)
        {
            var utilisateur = await _context.Utilisateur.FindAsync(id);
            if (utilisateur == null) return NotFound();

            var reporterName = User.Identity?.Name ?? "Anonyme";

            utilisateur.NBReport += 1;
            
            utilisateur.Report.Add($"Signalé par {reporterName} le {DateTime.Now:dd/MM/yyyy}");

            await _context.SaveChangesAsync();
            return PartialView("_ConfirmationReport",utilisateur);
        }
    }
}
