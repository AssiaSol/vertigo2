using System.ComponentModel.DataAnnotations;
using System.Security.Cryptography;

namespace Vertigo.Models
{
    public static class Roles
    {
        public const string Admin = "Admin";
        public const string Gerant = "Gerant";
        public const string Client = "Client";
    }
    public class Utilisateur
    {
        [Required]
        public int ID { get; set; }

        [Required]
        [MinLength(3),MaxLength(20)]
        public string Nom { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MinLength(8)]
        public string MotDePasse { get; set; } = string.Empty;

        [Required]
        [Phone]
        public string Telephone { get; set; } = string.Empty;

        [Required]
        [RegularExpression("Client|Commercant|Admin", ErrorMessage = "Rôle invalide")]
        public string Role { get; set; } = Roles.Client ;

        [Required]
        public DateTime DateInscription { get; set; } = DateTime.UtcNow;

        [Required]
        public int NBReport { get; set; } = 0;

        public List<string> Report { get; set; } = new List<string>();

        public bool Etudiant { get; set; }
        public String? NumCarteEtu { get; set; }

        [Required]
        public bool BAN { get; set; } = false;


        [Required(AllowEmptyStrings = true)]
        public string ProfilImagePath { get; set; } = string.Empty;

        [MaxLength(50)]
        public string? Wilaya { get; set; }
    }
}
