using System.ComponentModel.DataAnnotations;

namespace Rentalin.Api.Middleware;

public sealed class ValidationEndpointFilter<T> : IEndpointFilter where T : class
{
    public async ValueTask<object?> InvokeAsync(
        EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        var argument = context.Arguments.OfType<T>().FirstOrDefault();
        if (argument is null)
        {
            return Results.BadRequest(new { error = "Request body is required." });
        }

        var results = new List<ValidationResult>();
        var validationContext = new ValidationContext(argument);

        if (!Validator.TryValidateObject(argument, validationContext, results, validateAllProperties: true))
        {
            var errors = results.ToDictionary(
                r => r.MemberNames.FirstOrDefault() ?? "body",
                r => new[] { r.ErrorMessage ?? "Invalid value." }
            );
            return Results.ValidationProblem(errors);
        }

        return await next(context);
    }
}
