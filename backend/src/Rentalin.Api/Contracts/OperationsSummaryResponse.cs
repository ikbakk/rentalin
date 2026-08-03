namespace Rentalin.Api.Contracts;

public sealed record OperationsSummaryResponse(
    int TotalVehicles,
    int AvailableVehicles,
    int RentedVehicles,
    int ActiveInquiries,
    int ActiveReservations,
    int ActiveRentals,
    int PendingInspections,
    decimal TodayRevenue,
    string RevenueCurrency
);
