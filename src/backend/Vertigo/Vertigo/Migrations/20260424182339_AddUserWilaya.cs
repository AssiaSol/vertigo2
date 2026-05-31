using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Vertigo.Migrations
{
    /// <inheritdoc />
    public partial class AddUserWilaya : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Wilaya",
                table: "Utilisateur",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Wilaya",
                table: "Utilisateur");
        }
    }
}
