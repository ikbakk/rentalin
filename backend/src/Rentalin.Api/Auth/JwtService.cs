using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace Rentalin.Api.Auth;

public sealed class JwtService
{
    private readonly string _secret;
    private readonly string _issuer;

    public JwtService(string secret, string issuer)
    {
        _secret = secret;
        _issuer = issuer;
    }

    public string GenerateToken(Guid staffId, string name, string email, string role, Guid businessId)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, staffId.ToString()),
            new Claim("name", name),
            new Claim("email", email),
            new Claim("role", role),
            new Claim("business_id", businessId.ToString()),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        };

        var token = new JwtSecurityToken(
            _issuer, _issuer, claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
