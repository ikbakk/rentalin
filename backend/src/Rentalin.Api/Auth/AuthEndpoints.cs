using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using Rentalin.Infrastructure.Data;

namespace Rentalin.Api.Auth;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this WebApplication app)
    {
        app.MapPost("/api/auth/login", async (LoginRequest request, RentalinDbContext db, JwtService jwt, CancellationToken ct) =>
        {
            var staff = await db.Staff.FirstOrDefaultAsync(s => s.Email == request.Email && s.IsActive, ct);
            if (staff is null)
                return Results.Unauthorized();

            if (staff.PasswordHash is not null && !BCrypt.Net.BCrypt.Verify(request.Password, staff.PasswordHash))
                return Results.Unauthorized();

            var token = jwt.GenerateToken(staff.Id, staff.Name, staff.Email, staff.Role, staff.BusinessId);
            return Results.Ok(new LoginResponse(token, staff.Name, staff.Email, staff.Role, staff.BusinessId));
        });

        app.MapGet("/api/auth/me", (ClaimsPrincipal user) =>
        {
            var staffId = user.FindFirstValue(JwtRegisteredClaimNames.Sub);
            var name = user.FindFirstValue("name");
            var role = user.FindFirstValue("role");
            var businessId = user.FindFirstValue("business_id");

            if (staffId is null) return Results.Unauthorized();
            return Results.Ok(new
            {
                Id = Guid.Parse(staffId),
                Name = name,
                Email = user.FindFirstValue("email"),
                Role = role,
                BusinessId = Guid.Parse(businessId!)
            });
        }).RequireAuthorization();
    }
}
