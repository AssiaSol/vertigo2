using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NuGet.Protocol;
using System.Security.Claims;
using Vertigo.Data;
using Vertigo.Models;
using Vertigo.Utils;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace Vertigo.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class AccountController : Controller
    {
        private readonly VertigoContext _context;

        public AccountController(VertigoContext context)
        {
            _context = context;
        }
        
        [HttpGet("me")]
        public async Task<ActionResult<object>> Index()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr)) return Unauthorized(new { message = "Vous n'êtes pas connecté." });
            else
            {
                int currentUserId = int.Parse(userIdStr);

                var monProfil = await _context.Utilisateur
                    .Where(u => u.ID == currentUserId)
                    .Select(u => new Utilisateur
                    {
                        ID = u.ID,
                        Nom = u.Nom,
                        Role = u.Role,
                        Email = u.Email,
                        NBReport = u.NBReport,
                        Etudiant = u.Etudiant
                    })
                    .FirstOrDefaultAsync();
                if (monProfil == null) return NotFound(new { message = "Utilisateur introuvable." });

                return Ok(monProfil);
            }
        }

        // POST: Account/Login----------------------------------------------------
        public class LoginRequest
        {
            public string Email { get; set; }
            public string Password { get; set; }
        }

        [HttpPost("login")]
        public async Task<ActionResult<object>> Login([FromBody] LoginRequest request)
        {
            if (request == null) return BadRequest(new { message = "Données invalides." });

            var user = await _context.Utilisateur
                .FirstOrDefaultAsync(u => u.Email == request.Email);

            if (user != null && SecurityHelper.VerifyPassword(request.Password , user.MotDePasse))
            {
                if (user.BAN)
                {
                    return StatusCode(403, new { message = "Votre compte a été suspendu." });
                }

                var claims = new List<Claim> {
                     new Claim(ClaimTypes.NameIdentifier, user.ID.ToString()),
                     new Claim(ClaimTypes.Name, user.Nom),
                     new Claim(ClaimTypes.Role, user.Role),
                };

                var claimsIdentity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);

                await HttpContext.SignInAsync(
                    CookieAuthenticationDefaults.AuthenticationScheme,
                    new ClaimsPrincipal(claimsIdentity));

                return Ok(new
                {
                    message = "Connexion réussie",
                    user = new { user.ID, user.Nom, user.Role }
                });
            
        }

            return Unauthorized(new { message = "Email ou mot de passe incorrect." });
        }

        // POST: Account/Create FINI
        [HttpPost("create")]
        public async Task<ActionResult<object>> Create([FromBody] Utilisateur utilisateur)
        {
            if (utilisateur == null) return BadRequest(new { message = "Données invalides." });

            ModelState.Remove("ID");

            if (!utilisateur.Etudiant)
            {
                utilisateur.NumCarteEtu = null;
            }
            else if (string.IsNullOrEmpty(utilisateur.NumCarteEtu))
            {
                return BadRequest(new { field = "NumCarteEtu", message = "Le numéro de carte est requis pour les étudiants." });
            }
            utilisateur.DateInscription = DateTime.Now;
            if (ModelState.IsValid)
            {
                var existingUser = await _context.Utilisateur
                            .Where(u => u.ID != utilisateur.ID && (u.Nom == utilisateur.Nom || u.Email == utilisateur.Email || u.Telephone == utilisateur.Telephone))
                            .Select(u => new { u.Nom, u.Email, u.Telephone }) // On prend juste ce qu'on compare
                            .FirstOrDefaultAsync();

                if (existingUser != null)
                {
                    var errors = new List<object>();

                    if (existingUser.Nom == utilisateur.Nom)
                        errors.Add(new { field = "Nom", message = "Ce nom est déjà pris." });

                    if (existingUser.Email == utilisateur.Email)
                        errors.Add(new { field = "Email", message = "Cet email est déjà utilisé." });

                    if (existingUser.Telephone == utilisateur.Telephone)
                        errors.Add(new { field = "Telephone", message = "Ce numéro est déjà lié à un compte." });

                    return BadRequest(new { errors });
                }

                utilisateur.DateInscription = DateTime.Now;
                utilisateur.MotDePasse = SecurityHelper.HashPassword(utilisateur.MotDePasse);
                utilisateur.Role = "Client";

                _context.Add(utilisateur);
                await _context.SaveChangesAsync();

                
                var claims = new List<Claim> {
                    new Claim(ClaimTypes.NameIdentifier, utilisateur.ID.ToString()),
                    new Claim(ClaimTypes.Name, utilisateur.Nom),
                    new Claim(ClaimTypes.Role, utilisateur.Role)
                };

                var claimsIdentity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);

                await HttpContext.SignInAsync(
                    CookieAuthenticationDefaults.AuthenticationScheme,
                    new ClaimsPrincipal(claimsIdentity));

                return Ok(new { message = "Compte créé avec succès", userId = utilisateur.ID });
        }

            return BadRequest(ModelState);
        }


        // POST: Account/Logout
        [HttpPost("logout")]
        public async Task<IActionResult> LogoutConfirmation()
        {
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return Ok(new { message = "Déconnexion réussie." });
        }

        // POST: Account/Edit FINI
        [HttpPost("edit/{id}")]
        public async Task<ActionResult<object>> Edit(int id, [FromBody] Utilisateur utilisateur)
        {
            // 1. Recup ID 
            var currentUserIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(currentUserIdStr)) return Unauthorized();

            int currentUserId = int.Parse(currentUserIdStr);
            bool isAdmin = User.IsInRole("Admin");

            if (isAdmin || (currentUserId == id && !utilisateur.BAN))
            {
                ModelState.Remove("ID");

                if (ModelState.IsValid)
                {

                    var userInDb = await _context.Utilisateur.FindAsync(id);
                    if (userInDb == null) return NotFound(new { message = "Utilisateur non trouvé." });

                    if (userInDb == null) return NotFound();

                    var existingUser = await _context.Utilisateur
                            .Where(u => u.ID != id && (u.Nom == utilisateur.Nom || u.Email == utilisateur.Email || u.Telephone == utilisateur.Telephone))
                            .Select(u => new { u.Nom, u.Email, u.Telephone }) // On prend juste ce qu'on compare
                            .FirstOrDefaultAsync();

                    if (existingUser != null)
                    {
                        var errors = new List<object>();
                        if (existingUser.Nom == utilisateur.Nom)
                            errors.Add(new { field = "Nom", message = "Ce nom est déjà pris." });

                        if (existingUser.Email == utilisateur.Email)
                            errors.Add(new { field = "Email", message = "Cet email est déjà utilisé." });

                        if (existingUser.Telephone == utilisateur.Telephone)
                            errors.Add(new { field = "Telephone", message = "Ce numéro est déjà lié à un compte." });

                        return BadRequest(new { errors });
                    }

                    if (utilisateur.Nom != null) userInDb.Nom = utilisateur.Nom;
                    if (utilisateur.Email != null) userInDb.Email = utilisateur.Email;
                    if (!string.IsNullOrEmpty(utilisateur.MotDePasse)) userInDb.MotDePasse = SecurityHelper.HashPassword(utilisateur.MotDePasse);
                    if (utilisateur.Telephone != null) userInDb.Telephone = utilisateur.Telephone;

                    if (userInDb.Etudiant!=utilisateur.Etudiant) userInDb.Etudiant = utilisateur.Etudiant;
                    if ((userInDb.Etudiant == utilisateur.Etudiant)&&(userInDb.NumCarteEtu!=utilisateur.NumCarteEtu)) userInDb.NumCarteEtu = utilisateur.Etudiant ? utilisateur.NumCarteEtu : null;

                    if (utilisateur.ProfilImagePath != null) userInDb.ProfilImagePath = utilisateur.ProfilImagePath;
                

                await _context.SaveChangesAsync();
                    
                    var claims = User.Claims.ToList();

                    var nameClaim = claims.FirstOrDefault(c => c.Type == ClaimTypes.Name);
                    if (nameClaim != null) claims.Remove(nameClaim);
                    claims.Add(new Claim(ClaimTypes.Name, userInDb.Nom));

                    var claimsIdentity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);

                    await HttpContext.SignInAsync(
                        CookieAuthenticationDefaults.AuthenticationScheme,
                        new ClaimsPrincipal(claimsIdentity)
                    );

                    return Ok(new { message = "Profil mis à jour !", user = new { userInDb.Nom, userInDb.Email } });

                }

            }
            else
            {
                return Forbid();
            }

            return BadRequest(ModelState);
        }

        // POST: Account/Delete FINI
        [HttpPost("{id}")]
        public async Task<ActionResult<object>> Delete(int id)
        {
            var utilisateur = await _context.Utilisateur.FindAsync(id);
            if (utilisateur == null) return NotFound(new { message = "Utilisateur non trouvé." });

            var currentUserIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(currentUserIdStr)) return Unauthorized();

            int currentUserId = int.Parse(currentUserIdStr);
            bool isAdmin = User.IsInRole("Admin");

            if (isAdmin || (currentUserId == id && !utilisateur.BAN))
            {
                _context.Utilisateur.Remove(utilisateur);
                await _context.SaveChangesAsync();

                if (currentUserId == id)
                {
                    await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
                    return Ok(new { message = "Votre compte a été supprimé et vous avez été déconnecté." });
                }
                return Ok(new { message = "Suppression réussie." });
            }
            else
            {
                return Forbid();
            }
        }

    }
}
