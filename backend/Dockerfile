FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
RUN useradd -m -u 1000 rentalin
USER rentalin
WORKDIR /app
EXPOSE 5000

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["src/Rentalin.Api/Rentalin.Api.csproj", "src/Rentalin.Api/"]
COPY ["src/Rentalin.Core/Rentalin.Core.csproj", "src/Rentalin.Core/"]
COPY ["src/Rentalin.Fleet/Rentalin.Fleet.csproj", "src/Rentalin.Fleet/"]
COPY ["src/Rentalin.Infrastructure/Rentalin.Infrastructure.csproj", "src/Rentalin.Infrastructure/"]
COPY ["src/Rentalin.Inspections/Rentalin.Inspections.csproj", "src/Rentalin.Inspections/"]
COPY ["src/Rentalin.Reservations/Rentalin.Reservations.csproj", "src/Rentalin.Reservations/"]
COPY ["src/Rentalin.Timeline/Rentalin.Timeline.csproj", "src/Rentalin.Timeline/"]
COPY ["src/Rentalin.Damage/Rentalin.Damage.csproj", "src/Rentalin.Damage/"]
COPY ["src/Rentalin.Maintenance/Rentalin.Maintenance.csproj", "src/Rentalin.Maintenance/"]
COPY ["src/Rentalin.Notifications/Rentalin.Notifications.csproj", "src/Rentalin.Notifications/"]
RUN dotnet restore "src/Rentalin.Api/Rentalin.Api.csproj"

COPY . .
WORKDIR /src/src/Rentalin.Api
RUN dotnet publish "Rentalin.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --chown=rentalin:rentalin --from=build /app/publish .
ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://+:5000
ENTRYPOINT ["dotnet", "Rentalin.Api.dll"]
