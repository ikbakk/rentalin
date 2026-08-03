using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Rentalin.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class EnsureFullSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DamageRecords",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    RentalId = table.Column<Guid>(type: "TEXT", nullable: false),
                    VehicleId = table.Column<Guid>(type: "TEXT", nullable: false),
                    InspectionId = table.Column<Guid>(type: "TEXT", nullable: true),
                    Description = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: false),
                    Severity = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    Status = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    PhotoUrls = table.Column<string>(type: "TEXT", nullable: false),
                    ResponsibleParty = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    ResolutionNotes = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: true),
                    ResolvedAt = table.Column<DateTimeOffset>(type: "TEXT", nullable: true),
                    WaivedAt = table.Column<DateTimeOffset>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DamageRecords", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MaintenanceRecords",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    VehicleId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Type = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: false),
                    Status = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    ScheduledStart = table.Column<DateTimeOffset>(type: "TEXT", nullable: false),
                    ActualStart = table.Column<DateTimeOffset>(type: "TEXT", nullable: true),
                    ActualEnd = table.Column<DateTimeOffset>(type: "TEXT", nullable: true),
                    Cost_Amount = table.Column<decimal>(type: "TEXT", nullable: false),
                    Cost_Currency = table.Column<string>(type: "TEXT", maxLength: 3, nullable: false),
                    Workshop = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    Notes = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: true),
                    PhotoUrls = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MaintenanceRecords", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "NotificationRecords",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Type = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    Recipient = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    Template = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Message = table.Column<string>(type: "TEXT", nullable: false),
                    Status = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "TEXT", nullable: false),
                    SentAt = table.Column<DateTimeOffset>(type: "TEXT", nullable: true),
                    DeliveredAt = table.Column<DateTimeOffset>(type: "TEXT", nullable: true),
                    FailureReason = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NotificationRecords", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "RentalExtension",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    NewEnd = table.Column<DateTimeOffset>(type: "TEXT", nullable: false),
                    AdditionalCost_Amount = table.Column<decimal>(type: "TEXT", nullable: false),
                    AdditionalCost_Currency = table.Column<string>(type: "TEXT", maxLength: 3, nullable: false),
                    RentalId = table.Column<Guid>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RentalExtension", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RentalExtension_Rentals_RentalId",
                        column: x => x.RentalId,
                        principalTable: "Rentals",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_RentalExtension_RentalId",
                table: "RentalExtension",
                column: "RentalId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DamageRecords");

            migrationBuilder.DropTable(
                name: "MaintenanceRecords");

            migrationBuilder.DropTable(
                name: "NotificationRecords");

            migrationBuilder.DropTable(
                name: "RentalExtension");
        }
    }
}
