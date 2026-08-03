using Rentalin.Core.Entities;
using Rentalin.Core.ValueObjects;
using Rentalin.Fleet.Domain.Documents;
using Rentalin.Fleet.Domain.Enums;

namespace Rentalin.Fleet.Domain.Entities;

public sealed class Vehicle : AggregateRoot
{
    public string LicensePlate { get; private set; }
    public string Make { get; private set; }
    public string Model { get; private set; }
    public int Year { get; private set; }
    public string Color { get; private set; }
    public int SeatingCapacity { get; private set; }
    public Money DailyRate { get; private set; }
    public VehicleStatus Status { get; private set; }
    public Guid BusinessId { get; private set; }

    private Vehicle()
    {
        LicensePlate = string.Empty;
        Make = string.Empty;
        Model = string.Empty;
        Color = string.Empty;
        DailyRate = Money.Zero("USD");
    }

    public static Vehicle Create(
        string licensePlate,
        string make,
        string model,
        int year,
        string color,
        int seatingCapacity,
        Money dailyRate,
        Guid businessId)
    {
        var vehicle = new Vehicle
        {
            Id = Guid.NewGuid(),
            LicensePlate = licensePlate,
            Make = make,
            Model = model,
            Year = year,
            Color = color,
            SeatingCapacity = seatingCapacity,
            DailyRate = dailyRate,
            Status = VehicleStatus.Available,
            BusinessId = businessId
        };

        vehicle.AddDomainEvent(new VehicleCreated(vehicle.Id, licensePlate, DateTimeOffset.UtcNow));
        return vehicle;
    }

    public void UpdateStatus(VehicleStatus status)
    {
        Status = status;
    }

    public void Update(string licensePlate, string make, string model, int year,
        string color, int seatingCapacity, Money dailyRate, Guid businessId)
    {
        LicensePlate = licensePlate;
        Make = make;
        Model = model;
        Year = year;
        Color = color;
        SeatingCapacity = seatingCapacity;
        DailyRate = dailyRate;
        BusinessId = businessId;
    }
}
