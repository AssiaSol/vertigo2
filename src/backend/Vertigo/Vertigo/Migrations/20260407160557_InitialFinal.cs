using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Vertigo.Migrations
{
    /// <inheritdoc />
    public partial class InitialFinal : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Utilisateur",
                columns: table => new
                {
                    ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nom = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Email = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    MotDePasse = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Telephone = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Role = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DateInscription = table.Column<DateTime>(type: "datetime2", nullable: false),
                    NBReport = table.Column<int>(type: "int", nullable: false),
                    Etudiant = table.Column<bool>(type: "bit", nullable: false),
                    NumCarteEtu = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    BAN = table.Column<bool>(type: "bit", nullable: false),
                    ProfilImagePath = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Utilisateur", x => x.ID);
                });

            migrationBuilder.CreateTable(
                name: "Boutique",
                columns: table => new
                {
                    IDBoutique = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NomBoutique = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Ville = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    IdGerant = table.Column<int>(type: "int", nullable: false),
                    AdresseBoutique = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Registre = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Valide = table.Column<bool>(type: "bit", nullable: false),
                    Note_NbNote = table.Column<int>(type: "int", nullable: false),
                    Note_Note = table.Column<double>(type: "float", nullable: false),
                    NBvente = table.Column<int>(type: "int", nullable: false),
                    NBReport = table.Column<int>(type: "int", nullable: false),
                    BAN = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Boutique", x => x.IDBoutique);
                    table.ForeignKey(
                        name: "FK_Boutique_Utilisateur_IdGerant",
                        column: x => x.IdGerant,
                        principalTable: "Utilisateur",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Panier",
                columns: table => new
                {
                    ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Produit = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IdBoutique = table.Column<int>(type: "int", nullable: false),
                    Reduction = table.Column<double>(type: "float", nullable: false),
                    PanierPrix = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Note_NbNote = table.Column<int>(type: "int", nullable: false),
                    Note_Note = table.Column<double>(type: "float", nullable: false),
                    Statut = table.Column<bool>(type: "bit", nullable: false),
                    PanierImagePath = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Panier", x => x.ID);
                    table.ForeignKey(
                        name: "FK_Panier_Boutique_IdBoutique",
                        column: x => x.IdBoutique,
                        principalTable: "Boutique",
                        principalColumn: "IDBoutique",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Commande",
                columns: table => new
                {
                    ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Reduction = table.Column<bool>(type: "bit", nullable: false),
                    ClientID = table.Column<int>(type: "int", nullable: false),
                    PanierID = table.Column<int>(type: "int", nullable: false),
                    DateDeCommande = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Prix = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Statut = table.Column<bool>(type: "bit", nullable: false),
                    BoutiqueImagePath = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Commande", x => x.ID);
                    table.ForeignKey(
                        name: "FK_Commande_Panier_PanierID",
                        column: x => x.PanierID,
                        principalTable: "Panier",
                        principalColumn: "ID");
                    table.ForeignKey(
                        name: "FK_Commande_Utilisateur_ClientID",
                        column: x => x.ClientID,
                        principalTable: "Utilisateur",
                        principalColumn: "ID");
                });

            migrationBuilder.CreateIndex(
                name: "IX_Boutique_IdGerant",
                table: "Boutique",
                column: "IdGerant");

            migrationBuilder.CreateIndex(
                name: "IX_Commande_ClientID",
                table: "Commande",
                column: "ClientID");

            migrationBuilder.CreateIndex(
                name: "IX_Commande_PanierID",
                table: "Commande",
                column: "PanierID");

            migrationBuilder.CreateIndex(
                name: "IX_Panier_IdBoutique",
                table: "Panier",
                column: "IdBoutique");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Commande");

            migrationBuilder.DropTable(
                name: "Panier");

            migrationBuilder.DropTable(
                name: "Boutique");

            migrationBuilder.DropTable(
                name: "Utilisateur");
        }
    }
}
