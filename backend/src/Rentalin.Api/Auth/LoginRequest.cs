namespace Rentalin.Api.Auth;

public sealed record LoginRequest(string Email, string Password);
public sealed record LoginResponse(string Token, string Name, string Email, string Role, Guid BusinessId);
