using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using Vertigo.Data;
using Vertigo.Models;

namespace Vertigo.Controllers
{
    public class CommandesController : Controller
    {
        private readonly VertigoContext _context;

        public CommandesController(VertigoContext context)
        {
            _context = context;
        }

        // GET: Commandes
        public async Task<IActionResult> Index()
        {
            var vertigoContext = _context.Commande.Include(c => c.Client).Include(c => c.Panier);
            return View(await vertigoContext.ToListAsync());
        }

        // GET: Commandes/Details/5
        public async Task<IActionResult> Details(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var commande = await _context.Commande
                .Include(c => c.Client)
                .Include(c => c.Panier)
                .FirstOrDefaultAsync(m => m.ID == id);
            if (commande == null)
            {
                return NotFound();
            }

            return View(commande);
        }

        // GET: Commandes/Create
        public IActionResult Create()
        {
            ViewData["ClientID"] = new SelectList(_context.Utilisateur, "ID", "Email");
            ViewData["PanierID"] = new SelectList(_context.Panier, "ID", "Name");
            return View();
        }

        // POST: Commandes/Create
        // To protect from overposting attacks, enable the specific properties you want to bind to.
        // For more details, see http://go.microsoft.com/fwlink/?LinkId=317598.
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create([Bind("ID,Reduction,ClientID,PanierID,DateDeCommande,Prix,Statut")] Commande commande)
        {
            if (ModelState.IsValid)
            {
                _context.Add(commande);
                await _context.SaveChangesAsync();
                return RedirectToAction(nameof(Index));
            }
            ViewData["ClientID"] = new SelectList(_context.Utilisateur, "ID", "Email", commande.ClientID);
            ViewData["PanierID"] = new SelectList(_context.Panier, "ID", "Name", commande.PanierID);
            return View(commande);
        }

        // GET: Commandes/Edit/5
        public async Task<IActionResult> Edit(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var commande = await _context.Commande.FindAsync(id);
            if (commande == null)
            {
                return NotFound();
            }
            ViewData["ClientID"] = new SelectList(_context.Utilisateur, "ID", "Email", commande.ClientID);
            ViewData["PanierID"] = new SelectList(_context.Panier, "ID", "Name", commande.PanierID);
            return View(commande);
        }

        // POST: Commandes/Edit/5
        // To protect from overposting attacks, enable the specific properties you want to bind to.
        // For more details, see http://go.microsoft.com/fwlink/?LinkId=317598.
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(int id, [Bind("ID,Reduction,ClientID,PanierID,DateDeCommande,Prix,Statut")] Commande commande)
        {
            if (id != commande.ID)
            {
                return NotFound();
            }

            if (ModelState.IsValid)
            {
                try
                {
                    _context.Update(commande);
                    await _context.SaveChangesAsync();
                }
                catch (DbUpdateConcurrencyException)
                {
                    if (!CommandeExists(commande.ID))
                    {
                        return NotFound();
                    }
                    else
                    {
                        throw;
                    }
                }
                return RedirectToAction(nameof(Index));
            }
            ViewData["ClientID"] = new SelectList(_context.Utilisateur, "ID", "Email", commande.ClientID);
            ViewData["PanierID"] = new SelectList(_context.Panier, "ID", "Name", commande.PanierID);
            return View(commande);
        }

        // GET: Commandes/Delete/5
        public async Task<IActionResult> Delete(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var commande = await _context.Commande
                .Include(c => c.Client)
                .Include(c => c.Panier)
                .FirstOrDefaultAsync(m => m.ID == id);
            if (commande == null)
            {
                return NotFound();
            }

            return View(commande);
        }

        // POST: Commandes/Delete/5
        [HttpPost, ActionName("Delete")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteConfirmed(int id)
        {
            var commande = await _context.Commande.FindAsync(id);
            if (commande != null)
            {
                _context.Commande.Remove(commande);
            }

            await _context.SaveChangesAsync();
            return RedirectToAction(nameof(Index));
        }

        private bool CommandeExists(int id)
        {
            return _context.Commande.Any(e => e.ID == id);
        }
    }
}
