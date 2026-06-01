using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Vertigo.Data;
using Vertigo.Models;

namespace Verdigo.Controllers
{
    public class BoutiquesController : Controller
    {
        private readonly VertigoContext _context;

        public BoutiquesController(VertigoContext context)
        {
            _context = context;
        }

        // GET: Boutiques  PAS ENCORE FAIT
        public async Task<IActionResult> Index()
        {
            bool isAdmin = User.IsInRole("Admin");

            if (isAdmin)
            {
                return RedirectToAction("DashBorad");
            }
            else
            {
                var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userIdStr)) return RedirectToAction("Create", "Utilisateurs");
                else
                {
                    int currentUserId = int.Parse(userIdStr);

                    var monProfil = await _context.Utilisateur
                        .Where(u => u.ID == currentUserId)
                        .Select(u => new Utilisateur
                        {
                            ID = u.ID,
                            Nom = u.Nom,
                            Email = u.Email,
                            NBReport = u.NBReport,
                            Etudiant = u.Etudiant
                        })
                        .FirstOrDefaultAsync();
                    return View("MonEspacePerso", monProfil);
                }
            }
        }




        // GET: Boutiques/info     
        public async Task<IActionResult> Info(int? id)
        {
            if (id == null) return NotFound();

            var currentUserIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (currentUserIdStr == null) return RedirectToAction("Login", "Account");

            int currentUserId = int.Parse(currentUserIdStr);
            bool isAdmin = User.IsInRole("Admin");
            if (isAdmin) { 
                var Profil = await _context.Boutique.FindAsync(id);
                return PartialView("Dashboard",Profil);
            }
            var monProfil = await _context.Boutique
                .Where(u => u.IDBoutique == id)
                .Select(u => new Boutique
                {
                    IDBoutique = u.IDBoutique,
                    IdGerant = u.IdGerant,    
                    NomBoutique = u.NomBoutique,
                    Ville = u.Ville,
                    NBReport = u.NBReport,
                    Localisation = u.Localisation,
                    Valide = u.Valide,
                    Note = u.Note,
                    NBvente = u.NBvente,
                    BAN = u.BAN
                })
                .FirstOrDefaultAsync();

            if (monProfil == null) return NotFound();

            if (currentUserId == monProfil.IdGerant && !monProfil.BAN) return View(monProfil);
            else return Forbid();
        }


        // GET: Boutiques/Create---------------------------------------------------------------------------------------------------------
        public async Task<IActionResult> Create()
        {
            var userIdS = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdS != null)
            {

                int userId = int.Parse(userIdS);
                var userDetail = await _context.Utilisateur.FindAsync(userId);
                if (userDetail == null || userDetail.BAN || userDetail.Role == "Gerant") return Forbid();
                if (userDetail.Etudiant)
                {
                    TempData["ErrorMessage"] = "Désolé, les comptes étudiants ne peuvent pas créer de boutique.";
                    return RedirectToAction("Index", "Boutiques");
                }
                else
                {
                    return View();

                }
            }
            else return RedirectToAction("Login", "Account");
        }

        // POST: Boutiques/Create
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create([Bind("NomBoutique,Ville,Description,IdGerant,Localisation,Registre,BoutiqueImagePath")] Boutique boutique)
        {
            var userIdS = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdS != null)
            {
                int userId = int.Parse(userIdS);
                boutique.IdGerant = userId;
                var userDetail = await _context.Utilisateur.FindAsync(userId);

                var existingBoutique = await _context.Boutique
                            .Where(u => (u.NomBoutique == boutique.NomBoutique || u.Localisation == boutique.Localisation || u.Registre == boutique.Registre))
                            .Select(u => new { u.NomBoutique, u.Localisation, u.Registre })
                            .FirstOrDefaultAsync();

                if (existingBoutique != null)
                {
                    if (existingBoutique.NomBoutique == boutique.NomBoutique)
                        ModelState.AddModelError("Nom", "Ce nom est déjà pris.");

                    if (existingBoutique.Localisation == boutique.Localisation)
                        ModelState.AddModelError("Localisation", "Cet Localisation est déjà utilisé.");

                    if (existingBoutique.Registre == boutique.Registre)
                        ModelState.AddModelError("Registre", "Ce Registre est déjà lié à une.");

                    return View(boutique);
                }

                boutique.IdGerant = userId;
                boutique.DateCreation = DateTime.UtcNow;

                userDetail.Role = "Gerant";
                _context.Add(boutique);
                await _context.SaveChangesAsync();

                var claims = User.Claims.ToList();
                var nameClaim = claims.FirstOrDefault(c => c.Type == ClaimTypes.Role);
                if (nameClaim != null) claims.Remove(nameClaim);
                claims.Add(new Claim(ClaimTypes.Role, userDetail.Role));

                var claimsIdentity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);

                await HttpContext.SignInAsync(
                    CookieAuthenticationDefaults.AuthenticationScheme,
                    new ClaimsPrincipal(claimsIdentity)
                );

                return RedirectToAction(nameof(Index));
            }
            return View(boutique);
        }



        // adress change seul

        // GET: Boutiques/Edit--------------------------------------------------------------------------------------------------------
        public async Task<IActionResult> Edit(int? id)
        {
            if (id != null)
            {
                var currentUserIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
                int currentUserId = int.Parse(currentUserIdStr);
                var Boutique = await _context.Boutique.FindAsync(id);
                if (Boutique == null) return NotFound();
                bool isAdmin = User.IsInRole("Admin");

                if (isAdmin || (currentUserId == Boutique.IdGerant && !Boutique.BAN))
                {
                    return View(Boutique);
                }
                else
                {
                    return Forbid();
                }
            }
            else
            {
                return NotFound();
            }
        }


        // POST: Boutiques/Edit
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(int id, [Bind("NomBoutique,Description,Localisation,BoutiqueImagePath")] Boutique boutique)
        {
            var currentUserIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            int currentUserId = int.Parse(currentUserIdStr);
            var BoutiqueNEW = await _context.Boutique.FindAsync(id);
            if (BoutiqueNEW == null) return NotFound();
            bool isAdmin = User.IsInRole("Admin");
            if (isAdmin || (currentUserId == BoutiqueNEW.IdGerant && !BoutiqueNEW.BAN))
            {
                if (ModelState.IsValid)
                {
                    var existingBoutique = await _context.Boutique
                            .Where(u => u.IDBoutique != id && (u.NomBoutique == boutique.NomBoutique || u.Localisation == boutique.Localisation))
                            .Select(u => new { u.NomBoutique, u.Localisation, u.Registre })
                            .FirstOrDefaultAsync();

                    if (existingBoutique != null)
                    {
                        if (existingBoutique.NomBoutique == boutique.NomBoutique)
                            ModelState.AddModelError("NomBoutique", "Ce nom est déjà pris.");

                        if (existingBoutique.Localisation == boutique.Localisation)
                            ModelState.AddModelError("Localisation", "Cet Localisation est déjà utilisé.");

                        return View(boutique);
                    }

                    if (boutique.NomBoutique != null) BoutiqueNEW.NomBoutique = boutique.NomBoutique;
                    if (boutique.Description != null) BoutiqueNEW.Description = boutique.Description;
                    if (boutique.Localisation != null) BoutiqueNEW.Localisation = boutique.Localisation;
                    if (boutique.BoutiqueImagePath != null) BoutiqueNEW.BoutiqueImagePath = boutique.BoutiqueImagePath;

                    await _context.SaveChangesAsync();

                    return RedirectToAction(nameof(Index));
                }
            }
            else
            {
                return Forbid();
            }
            return View(boutique);
        }



        // GET: Boutiques/Delete---------------------------------------------------------------------------------------------------------
        public async Task<IActionResult> Delete(int? id)
        {
            if (id != null)
            {
                var currentUserIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
                int currentUserId = int.Parse(currentUserIdStr);
                var Boutique = await _context.Boutique.FindAsync(id);
                if (Boutique == null) return NotFound();
                bool isAdmin = User.IsInRole("Admin");

                if (isAdmin || (currentUserId == Boutique.IdGerant && !Boutique.BAN))
                {
                    return View(Boutique);
                }
                else
                {
                    return Forbid();
                }
            }
            else
            {
                return NotFound();
            }
        }

        // POST: Boutiques/Delete/5
        [HttpPost, ActionName("Delete")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteConfirmed(int id)
        {
            if (id != null)
            {
                var currentUserIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
                int currentUserId = int.Parse(currentUserIdStr);
                var Boutique = await _context.Boutique.FindAsync(id);
                var userDetail = await _context.Utilisateur.FindAsync(Boutique.IdGerant);
                if (Boutique == null) return NotFound();
                bool isAdmin = User.IsInRole("Admin");

                if (isAdmin || (currentUserId == Boutique.IdGerant && !Boutique.BAN))
                {
                    _context.Boutique.Remove(Boutique);
                    if (!isAdmin) userDetail.Role = "Client";

                    await _context.SaveChangesAsync();

                    var claims = User.Claims.ToList();
                    var nameClaim = claims.FirstOrDefault(c => c.Type == ClaimTypes.Role);
                    if (nameClaim != null) claims.Remove(nameClaim);
                    claims.Add(new Claim(ClaimTypes.Role, userDetail.Role));

                    var claimsIdentity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);

                    await HttpContext.SignInAsync(
                        CookieAuthenticationDefaults.AuthenticationScheme,
                        new ClaimsPrincipal(claimsIdentity));
                }
                else
                {
                    return Forbid();
                }
            }
            return RedirectToAction(nameof(Index));
        }



        //POST: Boutiques/Valide---------------------------------------------------------------------------------------------------------
        [HttpPost]
        [ValidateAntiForgeryToken]
        [Authorize(Roles = Roles.Admin)]
        public async Task<IActionResult> Valider(int id)
        {
            var Boutique = await _context.Boutique.FindAsync(id);
            if (Boutique == null)
            {
                return NotFound();
            }
            Boutique.Valide = true;
            await _context.SaveChangesAsync();
            return PartialView("_Confirmation");
        }




        //POST: Boutiques/BAN---------------------------------------------------------------------------------------------------------
        [HttpPost]
        [ValidateAntiForgeryToken]
        [Authorize(Roles = Roles.Admin)]
        public async Task<IActionResult> BAN(int id)
        {
            var Boutique = await _context.Boutique.FindAsync(id);
            if (Boutique == null) return NotFound();
            
            Boutique.BAN = true;

            var gerant = await _context.Utilisateur.FindAsync(Boutique.IdGerant);
            if (gerant != null)
            {
                gerant.BAN = true;
            }
            await _context.SaveChangesAsync();
            return PartialView("_ConfirmationBan");
        }

    }
}
