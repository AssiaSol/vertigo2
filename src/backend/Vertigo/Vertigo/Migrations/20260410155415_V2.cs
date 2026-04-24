using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Vertigo.Migrations
{
    /// <inheritdoc />
    public partial class V2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BoutiqueImagePath",
                table: "Commande");

            migrationBuilder.AddColumn<string>(
                name: "BoutiqueImagePath",
                table: "Boutique",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BoutiqueImagePath",
                table: "Boutique");

            migrationBuilder.AddColumn<string>(
                name: "BoutiqueImagePath",
                table: "Commande",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }
    }
}
