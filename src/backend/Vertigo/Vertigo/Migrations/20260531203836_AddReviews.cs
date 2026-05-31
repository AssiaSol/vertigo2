using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Vertigo.Migrations
{
    /// <inheritdoc />
    public partial class AddReviews : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Avis",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UtilisateurId = table.Column<int>(type: "int", nullable: false),
                    BoutiqueId = table.Column<int>(type: "int", nullable: false),
                    Note = table.Column<int>(type: "int", nullable: false),
                    Commentaire = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    DateCreation = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Avis", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Avis_Boutique_BoutiqueId",
                        column: x => x.BoutiqueId,
                        principalTable: "Boutique",
                        principalColumn: "IDBoutique");
                    table.ForeignKey(
                        name: "FK_Avis_Utilisateur_UtilisateurId",
                        column: x => x.UtilisateurId,
                        principalTable: "Utilisateur",
                        principalColumn: "ID");
                });

            migrationBuilder.CreateIndex(
                name: "IX_Avis_BoutiqueId",
                table: "Avis",
                column: "BoutiqueId");

            migrationBuilder.CreateIndex(
                name: "IX_Avis_UtilisateurId_BoutiqueId",
                table: "Avis",
                columns: new[] { "UtilisateurId", "BoutiqueId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Avis");
        }
    }
}
