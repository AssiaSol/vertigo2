using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Vertigo.Migrations
{
    /// <inheritdoc />
    public partial class AddFavorites : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DealFavorite",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    PanierId = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DealFavorite", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DealFavorite_Panier_PanierId",
                        column: x => x.PanierId,
                        principalTable: "Panier",
                        principalColumn: "ID");
                    table.ForeignKey(
                        name: "FK_DealFavorite_Utilisateur_UserId",
                        column: x => x.UserId,
                        principalTable: "Utilisateur",
                        principalColumn: "ID");
                });

            migrationBuilder.CreateTable(
                name: "Favorite",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    BoutiqueId = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Favorite", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Favorite_Boutique_BoutiqueId",
                        column: x => x.BoutiqueId,
                        principalTable: "Boutique",
                        principalColumn: "IDBoutique");
                    table.ForeignKey(
                        name: "FK_Favorite_Utilisateur_UserId",
                        column: x => x.UserId,
                        principalTable: "Utilisateur",
                        principalColumn: "ID");
                });

            migrationBuilder.CreateIndex(
                name: "IX_DealFavorite_PanierId",
                table: "DealFavorite",
                column: "PanierId");

            migrationBuilder.CreateIndex(
                name: "IX_DealFavorite_UserId_PanierId",
                table: "DealFavorite",
                columns: new[] { "UserId", "PanierId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Favorite_BoutiqueId",
                table: "Favorite",
                column: "BoutiqueId");

            migrationBuilder.CreateIndex(
                name: "IX_Favorite_UserId_BoutiqueId",
                table: "Favorite",
                columns: new[] { "UserId", "BoutiqueId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DealFavorite");

            migrationBuilder.DropTable(
                name: "Favorite");
        }
    }
}
