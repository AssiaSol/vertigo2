using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Vertigo.Migrations
{
    /// <inheritdoc />
    public partial class FixModelDrift : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // ── Panier: rename Produit → Types, drop Reduction, add Description + NBdispo ──
            migrationBuilder.DropColumn(
                name: "Reduction",
                table: "Panier");

            migrationBuilder.RenameColumn(
                name: "Produit",
                table: "Panier",
                newName: "Types");

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "Panier",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "NBdispo",
                table: "Panier",
                type: "int",
                nullable: false,
                defaultValue: 0);

            // ── Boutique: drop AdresseBoutique, add Description/Localisation/Report/DateCreation ──
            migrationBuilder.DropColumn(
                name: "AdresseBoutique",
                table: "Boutique");

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "Boutique",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Localisation",
                table: "Boutique",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Report",
                table: "Boutique",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "[]");

            migrationBuilder.AddColumn<DateTime>(
                name: "DateCreation",
                table: "Boutique",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            // ── Utilisateur: add Report ──
            migrationBuilder.AddColumn<string>(
                name: "Report",
                table: "Utilisateur",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "[]");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "Description", table: "Panier");
            migrationBuilder.DropColumn(name: "NBdispo", table: "Panier");
            migrationBuilder.RenameColumn(name: "Types", table: "Panier", newName: "Produit");
            migrationBuilder.AddColumn<double>(
                name: "Reduction",
                table: "Panier",
                type: "float",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.DropColumn(name: "Description", table: "Boutique");
            migrationBuilder.DropColumn(name: "Localisation", table: "Boutique");
            migrationBuilder.DropColumn(name: "Report", table: "Boutique");
            migrationBuilder.DropColumn(name: "DateCreation", table: "Boutique");
            migrationBuilder.AddColumn<string>(
                name: "AdresseBoutique",
                table: "Boutique",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.DropColumn(name: "Report", table: "Utilisateur");
        }
    }
}
