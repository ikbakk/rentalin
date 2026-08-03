using Rentalin.Core.ValueObjects;
using Rentalin.Fleet.Domain.Entities;
using Rentalin.Fleet.Domain.Enums;
using Rentalin.Reservations.Domain.Entities;
using Rentalin.Reservations.Domain.Enums;

namespace Rentalin.Reservations.Domain.Services;

public sealed class VehicleAvailabilityService
{
    public bool IsAvailable(Vehicle vehicle, DateRange requestedPeriod, IReadOnlyList<Reservation> existingReservations)
    {
        if (vehicle.Status is VehicleStatus.Maintenance or VehicleStatus.Retired)
            return false;

        var hasConflict = existingReservations.Any(r =>
            r.Status != ReservationStatus.Cancelled &&
            r.VehicleId == vehicle.Id &&
            r.RentalPeriod.Overlaps(requestedPeriod));

        return !hasConflict;
    }
}
