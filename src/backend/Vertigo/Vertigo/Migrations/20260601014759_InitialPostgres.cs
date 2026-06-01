using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Vertigo.Migrations
{
    /// <inheritdoc />
    public partial class InitialPostgres : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Utilisateur",
                columns: table => new
                {
                    ID = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Nom = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Email = table.Column<string>(type: "text", nullable: false),
                    MotDePasse = table.Column<string>(type: "text", nullable: false),
                    Telephone = table.Column<string>(type: "text", nullable: false),
                    Role = table.Column<string>(type: "text", nullable: false),
                    DateInscription = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    NBReport = table.Column<int>(type: "integer", nullable: false),
                    Report = table.Column<List<string>>(type: "text[]", nullable: false),
                    Etudiant = table.Column<bool>(type: "boolean", nullable: false),
                    NumCarteEtu = table.Column<string>(type: "text", nullable: true),
                    BAN = table.Column<bool>(type: "boolean", nullable: false),
                    ProfilImagePath = table.Column<string>(type: "text", nullable: false),
                    Wilaya = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Utilisateur", x => x.ID);
                });

            migrationBuilder.CreateTable(
                name: "Boutique",
                columns: table => new
                {
                    IDBoutique = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    NomBoutique = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Ville = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Description = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    IdGerant = table.Column<int>(type: "integer", nullable: false),
                    Localisation = table.Column<string>(type: "text", nullable: false),
                    Registre = table.Column<string>(type: "text", nullable: false),
                    Valide = table.Column<bool>(type: "boolean", nullable: false),
                    Note_NbNote = table.Column<int>(type: "integer", nullable: false),
                    Note_Note = table.Column<double>(type: "double precision", nullable: false),
                    NBvente = table.Column<int>(type: "integer", nullable: false),
                    NBReport = table.Column<int>(type: "integer", nullable: false),
                    Report = table.Column<List<string>>(type: "text[]", nullable: false),
                    BAN = table.Column<bool>(type: "boolean", nullable: false),
                    BoutiqueImagePath = table.Column<string>(type: "text", nullable: false),
                    DateCreation = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Latitude = table.Column<double>(type: "double precision", nullable: true),
                    Longitude = table.Column<double>(type: "double precision", nullable: true),
                    CuisineType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    PhoneNumber = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true)
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
                name: "ClientRating",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    GerantId = table.Column<int>(type: "integer", nullable: false),
                    ClientId = table.Column<int>(type: "integer", nullable: false),
                    Note = table.Column<int>(type: "integer", nullable: false),
                    Commentaire = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    DateCreation = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
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

            migrationBuilder.CreateTable(
                name: "Avis",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UtilisateurId = table.Column<int>(type: "integer", nullable: false),
                    BoutiqueId = table.Column<int>(type: "integer", nullable: false),
                    Note = table.Column<int>(type: "integer", nullable: false),
                    Commentaire = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    DateCreation = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
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

            migrationBuilder.CreateTable(
                name: "Favorite",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    BoutiqueId = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
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

            migrationBuilder.CreateTable(
                name: "Panier",
                columns: table => new
                {
                    ID = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    Types = table.Column<string>(type: "text", nullable: false),
                    IdBoutique = table.Column<int>(type: "integer", nullable: false),
                    PanierPrix = table.Column<decimal>(type: "numeric", nullable: false),
                    Note_NbNote = table.Column<int>(type: "integer", nullable: false),
                    Note_Note = table.Column<double>(type: "double precision", nullable: false),
                    NBdispo = table.Column<int>(type: "integer", nullable: false),
                    Statut = table.Column<bool>(type: "boolean", nullable: false),
                    PanierImagePath = table.Column<string>(type: "text", nullable: false),
                    OriginalPrice = table.Column<decimal>(type: "numeric", nullable: false),
                    DiscountPercentage = table.Column<decimal>(type: "numeric", nullable: false),
                    ValidFrom = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ValidUntil = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
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
                    ID = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Reduction = table.Column<bool>(type: "boolean", nullable: false),
                    ClientID = table.Column<int>(type: "integer", nullable: false),
                    PanierID = table.Column<int>(type: "integer", nullable: false),
                    DateDeCommande = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Prix = table.Column<decimal>(type: "numeric", nullable: false),
                    Statut = table.Column<bool>(type: "boolean", nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false)
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

            migrationBuilder.CreateTable(
                name: "DealFavorite",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    PanierId = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
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

            migrationBuilder.CreateIndex(
                name: "IX_Avis_BoutiqueId",
                table: "Avis",
                column: "BoutiqueId");

            migrationBuilder.CreateIndex(
                name: "IX_Avis_UtilisateurId_BoutiqueId",
                table: "Avis",
                columns: new[] { "UtilisateurId", "BoutiqueId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Boutique_IdGerant",
                table: "Boutique",
                column: "IdGerant");

            migrationBuilder.CreateIndex(
                name: "IX_ClientRating_ClientId",
                table: "ClientRating",
                column: "ClientId");

            migrationBuilder.CreateIndex(
                name: "IX_ClientRating_GerantId_ClientId",
                table: "ClientRating",
                columns: new[] { "GerantId", "ClientId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Commande_ClientID",
                table: "Commande",
                column: "ClientID");

            migrationBuilder.CreateIndex(
                name: "IX_Commande_PanierID",
                table: "Commande",
                column: "PanierID");

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

            migrationBuilder.CreateIndex(
                name: "IX_Panier_IdBoutique",
                table: "Panier",
                column: "IdBoutique");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Avis");

            migrationBuilder.DropTable(
                name: "ClientRating");

            migrationBuilder.DropTable(
                name: "Commande");

            migrationBuilder.DropTable(
                name: "DealFavorite");

            migrationBuilder.DropTable(
                name: "Favorite");

            migrationBuilder.DropTable(
                name: "Panier");

            migrationBuilder.DropTable(
                name: "Boutique");

            migrationBuilder.DropTable(
                name: "Utilisateur");
        }
    }
}
