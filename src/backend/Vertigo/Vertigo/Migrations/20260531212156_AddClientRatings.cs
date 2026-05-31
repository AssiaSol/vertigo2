using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Vertigo.Migrations
{
    /// <inheritdoc />
    public partial class AddClientRatings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ClientRating",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    GerantId = table.Column<int>(type: "int", nullable: false),
                    ClientId = table.Column<int>(type: "int", nullable: false),
                    Note = table.Column<int>(type: "int", nullable: false),
                    Commentaire = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    DateCreation = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClientRating", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ClientRating_Utilisateur_ClientId",
                        column: x => x.ClientId,
                        principalTable: "Utilisateur",
                        principalColumn: "ID");
                    table.ForeignKey(
                        name: "FK_ClientRating_Utilisateur_GerantId",
                        column: x => x.GerantId,
                        principalTable: "Utilisateur",
                        principalColumn: "ID");
                });

            migrationBuilder.CreateIndex(
                name: "IX_ClientRating_ClientId",
                table: "ClientRating",
                column: "ClientId");

            migrationBuilder.CreateIndex(
                name: "IX_ClientRating_GerantId_ClientId",
                table: "ClientRating",
                columns: new[] { "GerantId", "ClientId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ClientRating");
        }
    }
}
