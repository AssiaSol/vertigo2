using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Vertigo.Migrations
{
    /// <inheritdoc />
    public partial class AddRestaurantOfferFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // ── Boutique: geolocation + restaurant metadata ──────────────────
            migrationBuilder.AddColumn<double>(
                name: "Latitude",
                table: "Boutique",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "Longitude",
                table: "Boutique",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CuisineType",
                table: "Boutique",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PhoneNumber",
                table: "Boutique",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: true);

            // ── Panier: offer/deal fields ───────────────────────────────────
            migrationBuilder.AddColumn<decimal>(
                name: "OriginalPrice",
                table: "Panier",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "DiscountPercentage",
                table: "Panier",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<DateTime>(
                name: "ValidFrom",
                table: "Panier",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ValidUntil",
                table: "Panier",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "Panier",
                type: "bit",
                nullable: false,
                defaultValue: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "Latitude", table: "Boutique");
            migrationBuilder.DropColumn(name: "Longitude", table: "Boutique");
            migrationBuilder.DropColumn(name: "CuisineType", table: "Boutique");
            migrationBuilder.DropColumn(name: "PhoneNumber", table: "Boutique");
            migrationBuilder.DropColumn(name: "OriginalPrice", table: "Panier");
            migrationBuilder.DropColumn(name: "DiscountPercentage", table: "Panier");
            migrationBuilder.DropColumn(name: "ValidFrom", table: "Panier");
            migrationBuilder.DropColumn(name: "ValidUntil", table: "Panier");
            migrationBuilder.DropColumn(name: "IsActive", table: "Panier");
        }
    }
}
