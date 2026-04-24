using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Vertigo.Data;
using Vertigo.Models;

namespace Vertigo.Controllers
{
    public class PaniersController : Controller
    {
        private readonly VertigoContext _context;

        public PaniersController(VertigoContext context)
        {
            _context = context;
        }

        // GET: Paniers
        public async Task<IActionResult> Index()
        {
            var vertigoContext = _context.Panier.Include(p => p.Boutique);
            return View(await vertigoContext.ToListAsync());
        }

        // GET: Paniers/Details/5
        public async Task<IActionResult> Details(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var panier = await _context.Panier
                .Include(p => p.Boutique)
                .FirstOrDefaultAsync(m => m.ID == id);
            if (panier == null)
            {
                return NotFound();
            }

            return View(panier);
        }














        // GET: Paniers/Create-----------------------------------------------------------------
        [Authorize(Roles = Roles.Gerant)]
        public async Task<IActionResult> Create()
        {
            var userIdS = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdS != null)
            {
                int userId = int.Parse(userIdS);
                var userDetail = await _context.Utilisateur.FindAsync(userId);
                if (userDetail == null) return View("Error");
                if ((userDetail.Role != "Gerant")||(userDetail.BAN)) return Forbid();
               return View();
                
            }
            else return RedirectToAction("Login", "Account");
        }

        // POST: Paniers/Create
        [HttpPost]
        [ValidateAntiForgeryToken]
        [Authorize(Roles = Roles.Gerant)]
        public async Task<IActionResult> Create([Bind("Name,Description,IdBoutique,PanierPrix,NBdispo,Statut,PanierImagePath")] Panier panier)
        {
            var userIdS = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdS == null) return Forbid();
            int userId = int.Parse(userIdS);
            
            var userDetail = await _context.Utilisateur.FindAsync(userId);
            if (userDetail == null) return View("Error");
            if ((userDetail.Role != "Gerant") || (userDetail.BAN)) return Forbid();

            var maBoutique = await _context.Boutique.FirstOrDefaultAsync(b => b.IdGerant == userId);
            if (maBoutique == null) return Forbid();

            if (ModelState.IsValid)
            {
                var existingPanier = await _context.Panier
                            .Where(u => u.IdBoutique == maBoutique.IDBoutique && (u.Name == panier.Name))
                            .Select(u => new { u.Name })
                            .FirstOrDefaultAsync();
                if (existingPanier != null)
                {
                    if (existingPanier.Name == panier.Name)
                        ModelState.AddModelError("Nom", "Ce nom est déjà pris.");

                    return View(panier);
                }

                    panier.IdBoutique = maBoutique.IDBoutique;
                if (panier.NBdispo == 0) { panier.Statut = false; } else { panier.Statut = true; }
                _context.Add(panier);
                await _context.SaveChangesAsync();
                return RedirectToAction(nameof(Index));
            }

            return View(panier);
        }




        // GET: Paniers/Edit
        public async Task<IActionResult> Edit(int? id)
        {
            if (id == null) return NotFound();
            var panier = await _context.Panier.FindAsync(id);
            if (panier == null) return NotFound();
            var userIdS = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdS == null) return RedirectToAction("Login", "Account");

            int userId = int.Parse(userIdS);
                var userDetail = await _context.Utilisateur.FindAsync(userId);
            if (userDetail.Role == "Admin") return View(panier);
            
            if ((userDetail.Role != "Gerant")||(userDetail.BAN)) return Forbid();
            var bout = await _context.Boutique
                     .FirstOrDefaultAsync(m => m.IdGerant == userDetail.ID);
            if (bout.IDBoutique != panier.IdBoutique) return Forbid();
      
            return View(panier);
        }

        // POST: Paniers/Edit
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(int id, [Bind("Name,Description,PanierPrix,PanierImagePath")] Panier panier)
        {
            var currentUserIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            int userId = int.Parse(currentUserIdStr);
            var userDetail = await _context.Utilisateur.FindAsync(userId);
            var panEdit = await _context.Panier.FindAsync(id);
            if (panEdit == null) return NotFound();
            if (userDetail == null) return View("Error");
            if (userDetail.Role != "Admin")
            {
                var bout = await _context.Boutique
                         .FirstOrDefaultAsync(m => m.IdGerant == userDetail.ID);
                if ((userDetail.Role != "Gerant") || (userDetail.BAN) || (bout != null && bout.IDBoutique != panEdit.IdBoutique)) return Forbid();
            } 
            
            if (ModelState.IsValid)
            {
                var existingPanier = await _context.Panier
                            .Where(u => u.ID != id && u.IdBoutique == panEdit.IdBoutique && (u.Name == panier.Name))
                            .Select(u => new { u.Name })
                            .FirstOrDefaultAsync();
                if (existingPanier != null)
                {
                    if (existingPanier.Name == panier.Name)
                        ModelState.AddModelError("Nom", "Ce nom est déjà pris.");

                    return View(panier);
                }

                if (panier.Name != null) panEdit.Name = panier.Name;
                if (panier.Description != null) panEdit.Description = panier.Description;
                if (panier.PanierPrix != null) panEdit.PanierPrix = panier.PanierPrix;
                if (panier.PanierImagePath != null) panEdit.PanierImagePath = panier.PanierImagePath;
                
                await _context.SaveChangesAsync();

                return RedirectToAction(nameof(Index));
            }
            ViewData["IdBoutique"] = new SelectList(_context.Boutique, "IDBoutique", "AdresseBoutique", panier.IdBoutique);
            return View(panier);
        }



        // GET: Paniers/Delete/5
        public async Task<IActionResult> Delete(int? id)
        {
            if (id == null) return NotFound();
            var panier = await _context.Panier.FindAsync(id);
            if (panier == null) return NotFound();
            var userIdS = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdS == null) return RedirectToAction("Login", "Account");

            int userId = int.Parse(userIdS);
            var userDetail = await _context.Utilisateur.FindAsync(userId);
            if (userDetail.Role == "Admin") return View(panier);

            if ((userDetail.Role != "Gerant") || (userDetail.BAN)) return Forbid();
            var bout = await _context.Boutique
                     .FirstOrDefaultAsync(m => m.IdGerant == userDetail.ID);
            if (bout.IDBoutique != panier.IdBoutique) return Forbid();

            return View(panier);
        }

        // POST: Paniers/Delete/5
        [HttpPost, ActionName("Delete")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteConfirmed(int id)
        {
            var currentUserIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            int userId = int.Parse(currentUserIdStr);
            var userDetail = await _context.Utilisateur.FindAsync(userId);
            var pan = await _context.Panier.FindAsync(id);
            if (pan == null) return NotFound();
            if (userDetail == null) return View("Error");
            if (userDetail.Role != "Admin")
            {
                var bout = await _context.Boutique
                         .FirstOrDefaultAsync(m => m.IdGerant == userDetail.ID);
                if ((userDetail.Role != "Gerant") || (userDetail.BAN) || (bout != null && bout.IDBoutique != pan.IdBoutique)) return Forbid();
            }

            if (pan != null)
            {
                _context.Panier.Remove(pan);
            }

            await _context.SaveChangesAsync();
            return RedirectToAction(nameof(Index));
        }


        //Ajouter
        public async Task<IActionResult> ModifNB(int id, [Bind("NBdispo,Statut")] Panier panier)
        {
            var currentUserIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            int userId = int.Parse(currentUserIdStr);
            var userDetail = await _context.Utilisateur.FindAsync(userId);
            var pan = await _context.Panier.FindAsync(id);
            if (pan == null) return NotFound();
            if (userDetail == null) return View("Error");
            if (userDetail.Role != "Admin")
            {
                var bout = await _context.Boutique
                         .FirstOrDefaultAsync(m => m.IdGerant == userDetail.ID);
                if ((userDetail.Role != "Gerant") || (userDetail.BAN) || (bout != null && bout.IDBoutique != pan.IdBoutique)) return Forbid();
            }

            if (panier.NBdispo == 0)
            {
                pan.Statut = !pan.Statut;
            }
            else
            {
                pan.NBdispo += panier.NBdispo;
                if (pan.NBdispo <= 0) 
                {
                    pan.NBdispo = 0;
                    pan.Statut = false;
                } 
                else
                {
                    pan.Statut = true;
                }
            }
            await _context.SaveChangesAsync();
            return RedirectToAction(nameof(Index));
        }

    }
}
