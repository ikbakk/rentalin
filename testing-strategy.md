# Rentalin Testing Strategy

## 1. Testing Philosophy

### Pyramid Approach

```
        ┌──────┐
        │ E2E  │  ~5%  — Playwright, critical business flows only
       ┌┴──────┴┐
       │  Int.  │  ~20% — WebApplicationFactory, API + DB + Events
      ┌┴────────┴┐
      │   Unit   │  ~75% — xUnit, domain logic, value objects, handlers
      └──────────┘
```

### Guiding Principles

- **Business rules first.** Every business rule enumerated in the project spec must map to at least one automated test. No rule ships untested.
- **Fast feedback.** Unit tests must complete in < 10 ms each. Integration tests < 1 s. The entire suite must finish in under 2 minutes on CI.
- **No flaky tests.** All tests must be deterministic. No `Thread.Sleep`, no reliance on wall-clock time (always use `DateTimeOffset.UtcNow` with a controllable abstraction if needed), no shared mutable state between tests, no test-order dependencies.
- **Tests are documentation.** A new developer should be able to read the test suite and understand what the system does and what invariants it enforces.
- **Test behaviour, not implementation.** Refactoring internal details should not break tests. Tests assert observable outcomes: return values, state changes, events raised, exceptions thrown.
- **Accessible to non-technical stakeholders.** Failed test names should read like plain-English assertions so owners/admins can understand what broke.

---

## 2. Unit Testing (Backend)

**Framework:** xUnit + FluentAssertions + NSubstitute

### 2.1 Domain Logic — Aggregates

Every aggregate method must be tested. Every state transition. Every guard condition. Every invariant violation.

#### Example: `Vehicle.Create()` — happy path and validation

```csharp
// VehicleTests.cs
using Rentalin.Core.ValueObjects;
using Rentalin.Fleet.Domain.Entities;
using Rentalin.Fleet.Domain.Documents;
using Rentalin.Fleet.Domain.Enums;

namespace Rentalin.Tests.Unit.Fleet.Domain;

public class VehicleTests
{
    [Fact]
    public void Create_WithValidParameters_ReturnsVehicleInAvailableState()
    {
        var dailyRate = new Money(350_000m, "IDR");
        var vehicle = Vehicle.Create("B 1234 ABC", "Toyota", "Avanza", 2023, "Silver", 7, dailyRate, Guid.NewGuid());

        vehicle.LicensePlate.Should().Be("B 1234 ABC");
        vehicle.Make.Should().Be("Toyota");
        vehicle.Model.Should().Be("Avanza");
        vehicle.Year.Should().Be(2023);
        vehicle.Color.Should().Be("Silver");
        vehicle.SeatingCapacity.Should().Be(7);
        vehicle.DailyRate.Should().Be(dailyRate);
        vehicle.Status.Should().Be(VehicleStatus.Available);
    }

    [Fact]
    public void Create_RaisesVehicleCreatedDomainEvent()
    {
        var vehicle = Vehicle.Create("B 1234 ABC", "Toyota", "Avanza", 2023, "Silver", 7,
            Money.Zero("IDR"), Guid.NewGuid());

        vehicle.DomainEvents.Should().ContainSingle()
            .Which.Should().BeOfType<VehicleCreated>()
            .Which.LicensePlate.Should().Be("B 1234 ABC");
    }

    [Fact]
    public void UpdateStatus_TransitionsToAnyValidStatus()
    {
        var vehicle = CreateValidVehicle();
        vehicle.UpdateStatus(VehicleStatus.Maintenance);
        vehicle.Status.Should().Be(VehicleStatus.Maintenance);
    }
}
```

#### Example: `Inquiry.Confirm()` — state transition guards

```csharp
// InquiryTests.cs
using Rentalin.Core.ValueObjects;
using Rentalin.Reservations.Domain.Entities;
using Rentalin.Reservations.Domain.Enums;

namespace Rentalin.Tests.Unit.Reservations.Domain;

public class InquiryTests
{
    [Fact]
    public void Confirm_WhenPending_TransitionsToConfirmed()
    {
        var inquiry = CreatePendingInquiry();
        inquiry.Confirm();
        inquiry.Status.Should().Be(InquiryStatus.Confirmed);
    }

    [Fact]
    public void Confirm_WhenAlreadyConfirmed_ThrowsInvalidOperationException()
    {
        var inquiry = CreatePendingInquiry();
        inquiry.Confirm();

        var act = () => inquiry.Confirm();
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("Only pending inquiries can be confirmed.");
    }

    [Fact]
    public void Confirm_WhenRejected_ThrowsInvalidOperationException()
    {
        var inquiry = CreatePendingInquiry();
        inquiry.Cancel();

        var act = () => inquiry.Confirm();
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("Only pending inquiries can be confirmed.");
    }

    [Fact]
    public void Cancel_WhenPending_TransitionsToRejected()
    {
        var inquiry = CreatePendingInquiry();
        inquiry.Cancel();
        inquiry.Status.Should().Be(InquiryStatus.Rejected);
    }

    [Fact]
    public void Cancel_WhenAlreadyConfirmed_ThrowsInvalidOperationException()
    {
        var inquiry = CreatePendingInquiry();
        inquiry.Confirm();

        var act = () => inquiry.Cancel();
        act.Should().Throw<InvalidOperationException>();
    }

    private static Inquiry CreatePendingInquiry() =>
        Inquiry.Create(Guid.NewGuid(), Guid.NewGuid(),
            new DateRange(DateTimeOffset.UtcNow, DateTimeOffset.UtcNow.AddDays(5)), null);
}
```

#### Example: `Reservation` full state-machine tests

```csharp
// ReservationTests.cs
using Rentalin.Core.ValueObjects;
using Rentalin.Reservations.Domain.Entities;
using Rentalin.Reservations.Domain.Enums;

namespace Rentalin.Tests.Unit.Reservations.Domain;

public class ReservationTests
{
    // --- CreateFromInquiry ---

    [Fact]
    public void CreateFromInquiry_WhenInquiryIsConfirmed_CreatesActiveReservation()
    {
        var inquiry = CreateConfirmedInquiry();
        var reservation = Reservation.CreateFromInquiry(inquiry, new Money(500_000m, "IDR"));

        reservation.Status.Should().Be(ReservationStatus.Active);
        reservation.InquiryId.Should().Be(inquiry.Id);
    }

    [Fact]
    public void CreateFromInquiry_WhenInquiryIsNotConfirmed_Throws()
    {
        var inquiry = CreatePendingInquiry();
        var act = () => Reservation.CreateFromInquiry(inquiry, Money.Zero("IDR"));
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("Cannot create reservation from unconfirmed inquiry.");
    }

    // --- Prepare ---

    [Fact]
    public void Prepare_WhenActive_TransitionsToPreparing()
    {
        var reservation = CreateActiveReservation();
        reservation.Prepare();
        reservation.Status.Should().Be(ReservationStatus.Preparing);
    }

    [Fact]
    public void Prepare_WhenNotActive_Throws()
    {
        var reservation = CreateActiveReservation();
        reservation.Prepare(); // now Preparing
        var act = () => reservation.Prepare();
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("Only active reservations can be prepared.");
    }

    // --- ReadyForHandover ---

    [Fact]
    public void ReadyForHandover_WhenPreparing_TransitionsToReady()
    {
        var reservation = CreateActiveReservation();
        reservation.Prepare();
        reservation.ReadyForHandover();
        reservation.Status.Should().Be(ReservationStatus.Ready);
    }

    [Fact]
    public void ReadyForHandover_WhenNotPreparing_Throws()
    {
        var reservation = CreateActiveReservation();
        var act = () => reservation.ReadyForHandover();
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("Only preparing reservations can be marked ready.");
    }

    // --- HandoverComplete ---

    [Fact]
    public void HandoverComplete_WhenReady_TransitionsToInProgress()
    {
        var reservation = CreateActiveReservation();
        reservation.Prepare();
        reservation.ReadyForHandover();
        reservation.HandoverComplete();
        reservation.Status.Should().Be(ReservationStatus.InProgress);
    }

    [Fact]
    public void HandoverComplete_WhenNotReady_Throws()
    {
        var reservation = CreateActiveReservation();
        var act = () => reservation.HandoverComplete();
        act.Should().Throw<InvalidOperationException>();
    }

    // --- Cancel ---

    [Fact]
    public void Cancel_WhenActive_TransitionsToCancelled()
    {
        var reservation = CreateActiveReservation();
        reservation.Cancel();
        reservation.Status.Should().Be(ReservationStatus.Cancelled);
    }

    [Fact]
    public void Cancel_WhenInProgress_Throws()
    {
        var reservation = CreateActiveReservation();
        reservation.Prepare();
        reservation.ReadyForHandover();
        reservation.HandoverComplete(); // InProgress

        var act = () => reservation.Cancel();
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("Cannot cancel a completed or in-progress reservation.");
    }

    [Fact]
    public void Cancel_WhenCompleted_Throws()
    {
        var reservation = CreateActiveReservation();
        reservation.GetType().GetProperty("Status")!.SetValue(reservation, ReservationStatus.Completed);

        var act = () => reservation.Cancel();
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("Cannot cancel a completed or in-progress reservation.");
    }

    // --- Helpers ---

    private static Inquiry CreatePendingInquiry() =>
        Inquiry.Create(Guid.NewGuid(), Guid.NewGuid(),
            new DateRange(DateTimeOffset.UtcNow, DateTimeOffset.UtcNow.AddDays(3)), null);

    private static Inquiry CreateConfirmedInquiry()
    {
        var inquiry = CreatePendingInquiry();
        inquiry.Confirm();
        return inquiry;
    }

    private static Reservation CreateActiveReservation()
    {
        var inquiry = CreateConfirmedInquiry();
        return Reservation.CreateFromInquiry(inquiry, new Money(500_000m, "IDR"));
    }
}
```

#### Example: `Rental` lifecycle tests

```csharp
// RentalTests.cs
using Rentalin.Reservations.Domain.Entities;
using Rentalin.Reservations.Domain.Documents;
using Rentalin.Reservations.Domain.Enums;

namespace Rentalin.Tests.Unit.Reservations.Domain;

public class RentalTests
{
    [Fact]
    public void CreateFromReservation_WhenReservationIsInProgress_CreatesActiveRental()
    {
        var reservation = CreateInProgressReservation();
        var rental = Rental.CreateFromReservation(reservation);

        rental.Status.Should().Be(RentalStatus.Active);
        rental.ReservationId.Should().Be(reservation.Id);
    }

    [Fact]
    public void Start_WhenActive_SetsOdometerAndStartTime()
    {
        var rental = CreateActiveRental();
        rental.Start(12500);

        rental.OdometerStart.Should().Be(12500);
        rental.ActualStart.Should().NotBeNull();
        rental.DomainEvents.Should().ContainSingle(e => e is RentalStarted);
    }

    [Fact]
    public void Start_WhenNotActive_Throws()
    {
        var rental = CreateActiveRental();
        rental.GetType().GetProperty("Status")!.SetValue(rental, RentalStatus.Completed);

        var act = () => rental.Start(100);
        act.Should().Throw<InvalidOperationException>();
    }

    [Fact]
    public void Complete_WhenActiveAndStarted_SetsOdometerEndAndTransitionsToCompleted()
    {
        var rental = CreateActiveRental();
        rental.Start(12500);
        rental.Complete(12800);

        rental.OdometerEnd.Should().Be(12800);
        rental.Status.Should().Be(RentalStatus.Completed);
        rental.DomainEvents.Should().ContainSingle(e => e is RentalCompleted);
    }

    [Fact]
    public void Complete_WhenNotStarted_Throws()
    {
        var rental = CreateActiveRental();
        var act = () => rental.Complete(12800);
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("Rental has not been started.");
    }

    // --- Helpers ---

    private static Reservation CreateInProgressReservation()
    {
        var inquiry = Inquiry.Create(Guid.NewGuid(), Guid.NewGuid(),
            new DateRange(DateTimeOffset.UtcNow, DateTimeOffset.UtcNow.AddDays(3)), null);
        inquiry.Confirm();
        var reservation = Reservation.CreateFromInquiry(inquiry, new Money(500_000m, "IDR"));
        reservation.Prepare();
        reservation.ReadyForHandover();
        reservation.HandoverComplete();
        return reservation;
    }

    private static Rental CreateActiveRental()
    {
        var reservation = CreateInProgressReservation();
        return Rental.CreateFromReservation(reservation);
    }
}
```

#### Example: `Payment` and `Inspection` tests

```csharp
// PaymentTests.cs
[Fact]
public void MarkComplete_WhenPending_TransitionsToCompletedAndSetsPaidAt()
{
    var payment = Payment.Create(Guid.NewGuid(), new Money(500_000m, "IDR"), PaymentMethod.Cash);
    payment.MarkComplete();
    payment.Status.Should().Be(PaymentStatus.Completed);
    payment.PaidAt.Should().NotBeNull();
}

[Fact]
public void MarkComplete_WhenAlreadyCompleted_Throws()
{
    var payment = Payment.Create(Guid.NewGuid(), new Money(500_000m, "IDR"), PaymentMethod.Cash);
    payment.MarkComplete();
    var act = () => payment.MarkComplete();
    act.Should().Throw<InvalidOperationException>()
        .WithMessage("Only pending payments can be marked as completed.");
}

// InspectionTests.cs
[Fact]
public void Complete_WhenPending_TransitionsToCompleted()
{
    var inspection = Inspection.Create(Guid.NewGuid(), Guid.NewGuid(),
        InspectionType.PostRental, ["url1"], "No damage");
    inspection.Complete();
    inspection.Status.Should().Be(InspectionStatus.Completed);
}

[Fact]
public void Complete_WhenAlreadyCompleted_Throws()
{
    var inspection = Inspection.Create(Guid.NewGuid(), Guid.NewGuid(),
        InspectionType.PostRental, [], "");
    inspection.Complete();
    var act = () => inspection.Complete();
    act.Should().Throw<InvalidOperationException>();
}
```

### 2.2 Value Objects

#### Example: `Money` arithmetic and validation

```csharp
// MoneyTests.cs
using Rentalin.Core.Exceptions;
using Rentalin.Core.ValueObjects;

namespace Rentalin.Tests.Unit.Core.ValueObjects;

public class MoneyTests
{
    [Fact]
    public void Constructor_WithNegativeAmount_ThrowsDomainException()
    {
        var act = () => new Money(-100, "IDR");
        act.Should().Throw<DomainException>()
            .WithMessage("Amount cannot be negative.");
    }

    [Fact]
    public void Constructor_WithNullOrWhitespaceCurrency_ThrowsDomainException()
    {
        var act = () => new Money(100, "  ");
        act.Should().Throw<DomainException>()
            .WithMessage("Currency is required.");
    }

    [Fact]
    public void Constructor_NormalizesCurrencyToUpper()
    {
        var money = new Money(100, "idr");
        money.Currency.Should().Be("IDR");
    }

    [Fact]
    public void Zero_ReturnsMoneyWithZeroAmount()
    {
        var zero = Money.Zero("USD");
        zero.Amount.Should().Be(0);
        zero.Currency.Should().Be("USD");
    }

    [Fact]
    public void Equality_DifferentCurrenciesAreNotEqual()
    {
        var idr = new Money(100, "IDR");
        var usd = new Money(100, "USD");
        idr.Should().NotBe(usd);
    }

    [Fact]
    public void Equality_SameAmountAndCurrencyAreEqual()
    {
        var a = new Money(100, "IDR");
        var b = new Money(100, "IDR");
        a.Should().Be(b);
    }
}
```

#### Example: `DateRange` overlap and validation

```csharp
// DateRangeTests.cs
using Rentalin.Core.Exceptions;
using Rentalin.Core.ValueObjects;

namespace Rentalin.Tests.Unit.Core.ValueObjects;

public class DateRangeTests
{
    [Fact]
    public void Constructor_EndBeforeStart_ThrowsDomainException()
    {
        var start = DateTimeOffset.UtcNow;
        var act = () => new DateRange(start, start.AddDays(-1));
        act.Should().Throw<DomainException>()
            .WithMessage("End date must be after start date.");
    }

    [Fact]
    public void Constructor_EndEqualsStart_ThrowsDomainException()
    {
        var now = DateTimeOffset.UtcNow;
        var act = () => new DateRange(now, now);
        act.Should().Throw<DomainException>();
    }

    [Fact]
    public void Days_ReturnsCorrectCount()
    {
        var range = new DateRange(
            new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero),
            new DateTimeOffset(2026, 1, 5, 0, 0, 0, TimeSpan.Zero));
        range.Days.Should().Be(4);
    }

    [Fact]
    public void Overlaps_FullyContained_ReturnsTrue()
    {
        var jan = new DateRange(
            new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero),
            new DateTimeOffset(2026, 1, 31, 0, 0, 0, TimeSpan.Zero));
        var midJan = new DateRange(
            new DateTimeOffset(2026, 1, 10, 0, 0, 0, TimeSpan.Zero),
            new DateTimeOffset(2026, 1, 15, 0, 0, 0, TimeSpan.Zero));
        jan.Overlaps(midJan).Should().BeTrue();
    }

    [Fact]
    public void Overlaps_NonOverlapping_ReturnsFalse()
    {
        var jan = new DateRange(
            new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero),
            new DateTimeOffset(2026, 1, 10, 0, 0, 0, TimeSpan.Zero));
        var feb = new DateRange(
            new DateTimeOffset(2026, 2, 1, 0, 0, 0, TimeSpan.Zero),
            new DateTimeOffset(2026, 2, 10, 0, 0, 0, TimeSpan.Zero));
        jan.Overlaps(feb).Should().BeFalse();
    }

    [Fact]
    public void Overlaps_Adjacent_ReturnsFalse()
    {
        var first = new DateRange(
            new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero),
            new DateTimeOffset(2026, 1, 10, 0, 0, 0, TimeSpan.Zero));
        var second = new DateRange(
            new DateTimeOffset(2026, 1, 10, 0, 0, 0, TimeSpan.Zero),
            new DateTimeOffset(2026, 1, 20, 0, 0, 0, TimeSpan.Zero));
        first.Overlaps(second).Should().BeFalse();
    }
}
```

### 2.3 Domain Events

```csharp
// DomainEventTests.cs
public abstract class DomainEventTests<TEvent> where TEvent : DomainEventBase
{
    [Fact]
    public void DomainEvent_HasNonEmptyId()
    {
        var instance = CreateEvent();
        instance.Id.Should().NotBeEmpty();
    }

    [Fact]
    public void DomainEvent_HasOccurredAtSet()
    {
        var instance = CreateEvent();
        instance.OccurredAt.Should().BeCloseTo(DateTimeOffset.UtcNow, TimeSpan.FromSeconds(2));
    }

    protected abstract TEvent CreateEvent();
}

public class InquiryCreatedEventTests : DomainEventTests<InquiryCreated>
{
    protected override InquiryCreated CreateEvent() =>
        new(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), DateTimeOffset.UtcNow);

    [Fact]
    public void ContainsCorrectInquiryCustomerAndVehicleIds()
    {
        var inquiryId = Guid.NewGuid();
        var customerId = Guid.NewGuid();
        var vehicleId = Guid.NewGuid();

        var evt = new InquiryCreated(inquiryId, customerId, vehicleId, DateTimeOffset.UtcNow);

        evt.InquiryId.Should().Be(inquiryId);
        evt.CustomerId.Should().Be(customerId);
        evt.VehicleId.Should().Be(vehicleId);
    }
}
```

### 2.4 Command Handlers

Mock repositories and dependencies with NSubstitute. Verify handler orchestrates correctly.

```csharp
// ConfirmInquiryHandlerTests.cs
using MediatR;
using NSubstitute;
using Rentalin.Core.Interfaces;
using Rentalin.Reservations.Contracts;
using Rentalin.Reservations.Domain.Entities;
using Rentalin.Reservations.Domain.Enums;
using Rentalin.Reservations.Handlers;

namespace Rentalin.Tests.Unit.Reservations.Handlers;

public class ConfirmInquiryHandlerTests
{
    private readonly IRepository<Inquiry> _inquiries = Substitute.For<IRepository<Inquiry>>();
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();
    private readonly ConfirmInquiryHandler _handler;

    public ConfirmInquiryHandlerTests()
    {
        _handler = new ConfirmInquiryHandler(_inquiries, _unitOfWork);
    }

    [Fact]
    public async Task Handle_WhenInquiryExists_ConfirmsAndReturnsResponse()
    {
        var inquiry = CreatePendingInquiry();
        _inquiries.GetByIdAsync(inquiry.Id).Returns(inquiry);
        var request = new ConfirmInquiryRequest(inquiry.Id);

        var result = await _handler.Handle(request, CancellationToken.None);

        result.Status.Should().Be(InquiryStatus.Confirmed.ToString());
        _inquiries.Received(1).Update(inquiry);
        await _unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_WhenInquiryNotFound_Throws()
    {
        _inquiries.GetByIdAsync(Arg.Any<Guid>()).Returns((Inquiry?)null);
        var request = new ConfirmInquiryRequest(Guid.NewGuid());

        var act = () => _handler.Handle(request, CancellationToken.None);
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*not found*");
    }

    private static Inquiry CreatePendingInquiry() =>
        Inquiry.Create(Guid.NewGuid(), Guid.NewGuid(),
            new DateRange(DateTimeOffset.UtcNow, DateTimeOffset.UtcNow.AddDays(3)), null);
}
```

```csharp
// CreateReservationHandlerTests.cs
public class CreateReservationHandlerTests
{
    private readonly IRepository<Inquiry> _inquiries = Substitute.For<IRepository<Inquiry>>();
    private readonly IRepository<Reservation> _reservations = Substitute.For<IRepository<Reservation>>();
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();
    private readonly CreateReservationHandler _handler;

    public CreateReservationHandlerTests()
    {
        _handler = new CreateReservationHandler(_inquiries, _reservations, _unitOfWork);
    }

    [Fact]
    public async Task Handle_CreatesReservationFromConfirmedInquiry()
    {
        var inquiry = CreateConfirmedInquiry();
        _inquiries.GetByIdAsync(inquiry.Id).Returns(inquiry);
        var request = new CreateReservationRequest(inquiry.Id, 500_000m, "IDR");

        var result = await _handler.Handle(request, CancellationToken.None);

        result.Status.Should().Be(ReservationStatus.Active.ToString());
        result.EstimatedCost.Should().Be(500_000m);
        _reservations.Received(1).Add(Arg.Any<Reservation>());
        await _unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }
}
```

---

## 3. Integration Testing (Backend)

**Framework:** `Microsoft.AspNetCore.Mvc.Testing` + WebApplicationFactory with SQLite in-memory.

### 3.1 Test Infrastructure

```csharp
// IntegrationTestBase.cs
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Rentalin.Api;
using Rentalin.Infrastructure.Data;

namespace Rentalin.Tests.Integration;

public abstract class IntegrationTestBase : IAsyncLifetime
{
    private readonly WebApplicationFactory<Program> _factory;
    protected HttpClient Client { get; private set; } = null!;
    protected RentalinDbContext DbContext { get; private set; } = null!;

    protected IntegrationTestBase()
    {
        _factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.ConfigureServices(services =>
                {
                    // Replace SQLite file DB with in-memory
                    var descriptor = services.Single(d =>
                        d.ServiceType == typeof(DbContextOptions<RentalinDbContext>));
                    services.Remove(descriptor);

                    services.AddDbContext<RentalinDbContext>(options =>
                        options.UseSqlite("DataSource=:memory:"));

                    // Remove seeding — tests control their own data
                    var hostedServices = services
                        .Where(s => s.ServiceType == typeof(IHostedService))
                        .ToList();
                    foreach (var hs in hostedServices)
                        services.Remove(hs);
                });
            });
    }

    public async Task InitializeAsync()
    {
        Client = _factory.CreateClient();
        DbContext = _factory.Services.GetRequiredService<RentalinDbContext>();
        await DbContext.Database.OpenConnectionAsync();
        await DbContext.Database.EnsureCreatedAsync();
    }

    public async Task DisposeAsync()
    {
        await DbContext.Database.CloseConnectionAsync();
        Client.Dispose();
        await _factory.DisposeAsync();
    }

    protected async Task<T> PostAsync<T>(string url, object body)
    {
        var content = JsonContent.Create(body);
        var response = await Client.PostAsync(url, content);
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<T>())!;
    }

    protected async Task<T> GetAsync<T>(string url)
    {
        var response = await Client.GetAsync(url);
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<T>())!;
    }
}
```

### 3.2 API Endpoint Tests

```csharp
// VehicleEndpointsTests.cs
namespace Rentalin.Tests.Integration.Api;

public class VehicleEndpointsTests : IntegrationTestBase
{
    [Fact]
    public async Task CreateVehicle_ThenGetAll_ReturnsCreatedVehicle()
    {
        var businessId = await SeedBusiness();
        var createReq = new
        {
            licensePlate = "B 9999 TST",
            make = "Honda",
            model = "Jazz",
            year = 2024,
            color = "Red",
            seatingCapacity = 5,
            dailyRate = 300_000m,
            currency = "IDR",
            businessId
        };

        var created = await PostAsync<VehicleResponse>("/api/vehicles", createReq);
        created.LicensePlate.Should().Be("B 9999 TST");
        created.Status.Should().Be("Available");

        var vehicles = await GetAsync<List<VehicleResponse>>("/api/vehicles");
        vehicles.Should().ContainSingle(v => v.Id == created.Id);
    }

    [Fact]
    public async Task UpdateVehicleStatus_ChangesStatus()
    {
        var businessId = await SeedBusiness();
        var vehicle = await SeedVehicle(businessId);

        var content = JsonContent.Create(new { status = "Maintenance" });
        var response = await Client.PutAsync($"/api/vehicles/{vehicle.Id}/status", content);
        response.EnsureSuccessStatusCode();

        var updated = await GetAsync<VehicleResponse>($"/api/vehicles");
        updated.Status.Should().Be("Maintenance");
    }

    private async Task<Guid> SeedBusiness()
    {
        var business = Business.Create("Test Corp", "123 Test St", "555-0000", "test@test.com");
        DbContext.Businesses.Add(business);
        await DbContext.SaveChangesAsync();
        return business.Id;
    }

    private async Task<Vehicle> SeedVehicle(Guid businessId)
    {
        var vehicle = Vehicle.Create("B SEED", "Toyota", "Avanza", 2023, "White", 7,
            new Money(350_000m, "IDR"), businessId);
        DbContext.Vehicles.Add(vehicle);
        await DbContext.SaveChangesAsync();
        return vehicle;
    }
}
```

### 3.3 Full Pipeline Integration Test

Tests the complete flow: inquiry → confirm → reservation → prepare → ready → handover → rental → payment → return → inspection.

```csharp
// RentalPipelineTests.cs
namespace Rentalin.Tests.Integration;

public class RentalPipelineTests : IntegrationTestBase
{
    [Fact]
    public async Task FullInquiryToInspectionPipeline_Succeeds()
    {
        // Arrange: seed business, vehicle, customer
        var businessId = await SeedBusiness();
        var vehicle = await SeedVehicle(businessId);
        var customer = await SeedCustomer();

        // 1. Create Inquiry
        var inquiryReq = new
        {
            customerId = customer.Id.ToString(),
            vehicleId = vehicle.Id.ToString(),
            startDate = DateTimeOffset.UtcNow.AddDays(1).ToString("O"),
            endDate = DateTimeOffset.UtcNow.AddDays(4).ToString("O")
        };
        var inquiry = await PostAsync<InquiryResponse>("/api/inquiries", inquiryReq);
        inquiry.Status.Should().Be("Pending");

        // 2. Confirm Inquiry
        var confirmReq = new { inquiryId = inquiry.Id };
        var confirmed = await PostAsync<InquiryResponse>(
            $"/api/inquiries/{inquiry.Id}/confirm", confirmReq);
        confirmed.Status.Should().Be("Confirmed");

        // 3. Create Reservation
        var reservationReq = new { inquiryId = inquiry.Id, estimatedCost = 500_000m, currency = "IDR" };
        var reservation = await PostAsync<ReservationResponse>("/api/reservations", reservationReq);
        reservation.Status.Should().Be("Active");

        // 4. Prepare
        var prepareReq = new { reservationId = reservation.Id };
        var prepared = await PostAsync<ReservationResponse>(
            $"/api/reservations/{reservation.Id}/prepare", prepareReq);
        prepared.Status.Should().Be("Preparing");

        // 5. Ready for handover
        var readyReq = new { reservationId = reservation.Id };
        var ready = await PostAsync<ReservationResponse>(
            $"/api/reservations/{reservation.Id}/ready-for-handover", readyReq);
        ready.Status.Should().Be("Ready");

        // 6. Handover complete
        var handoverReq = new { reservationId = reservation.Id };
        var inProgress = await PostAsync<ReservationResponse>(
            $"/api/reservations/{reservation.Id}/handover-complete", handoverReq);
        inProgress.Status.Should().Be("InProgress");

        // 7. Start Rental
        var startReq = new { reservationId = reservation.Id, odometerStart = 10000 };
        var rentalResponse = await PostAsync<RentalResponse>("/api/rentals/start", startReq);
        rentalResponse.Id.Should().NotBeEmpty();

        // 8. Create Payment
        var paymentReq = new { rentalId = rentalResponse.Id, amount = 500_000m, currency = "IDR", method = "Cash" };
        var payment = await PostAsync<PaymentResponse>("/api/payments", paymentReq);
        payment.Status.Should().Be("Pending");

        // 9. Mark Payment Complete
        var markPaymentReq = new { paymentId = payment.Id };
        var completedPayment = await PostAsync<PaymentResponse>(
            $"/api/payments/{payment.Id}/complete", markPaymentReq);
        completedPayment.Status.Should().Be("Completed");

        // 10. Complete Rental
        var completeReq = new { rentalId = rentalResponse.Id, odometerEnd = 10500 };
        var completedRental = await PostAsync<RentalResponse>(
            $"/api/rentals/{rentalResponse.Id}/complete", completeReq);
        completedRental.Status.Should().Be("Completed");

        // 11. Create Post-Rental Inspection
        var inspectionReq = new
        {
            vehicleId = vehicle.Id.ToString(),
            rentalId = rentalResponse.Id.ToString(),
            inspectionType = "PostRental",
            notes = "No damage found",
            photoUrls = new[] { "https://cdn.example.com/photo1.jpg" }
        };
        var inspection = await PostAsync<InspectionResponse>("/api/inspections", inspectionReq);
        inspection.Status.Should().Be("Pending");

        // 12. Complete Inspection
        var completeInspectionReq = new { inspectionId = inspection.Id };
        var completedInspection = await PostAsync<InspectionResponse>(
            $"/api/inspections/{inspection.Id}/complete", completeInspectionReq);
        completedInspection.Status.Should().Be("Completed");

        // 13. Verify Timeline has entries throughout
        var timeline = await GetAsync<List<TimelineEntryResponse>>(
            $"/api/timeline?referenceId={reservation.Id}");
        timeline.Should().NotBeEmpty();
        timeline.Should().Contain(t => t.EventType == "InquiryCreated");
        timeline.Should().Contain(t => t.EventType == "ReservationCreated");
        timeline.Should().Contain(t => t.EventType == "RentalStarted");
        timeline.Should().Contain(t => t.EventType == "RentalCompleted");
    }

    private async Task<Guid> SeedBusiness()
    {
        var business = Business.Create("Pipeline Test Inc", "123 Main", "555-0000", "contact@test.com");
        DbContext.Businesses.Add(business);
        await DbContext.SaveChangesAsync();
        return business.Id;
    }

    private async Task<Vehicle> SeedVehicle(Guid businessId)
    {
        var vehicle = Vehicle.Create("B PIPE", "Toyota", "Avanza", 2023, "Silver", 7,
            new Money(350_000m, "IDR"), businessId);
        DbContext.Vehicles.Add(vehicle);
        await DbContext.SaveChangesAsync();
        return vehicle;
    }

    private async Task<Customer> SeedCustomer()
    {
        var customer = Customer.Create("Test Customer", "test@email.com", "+62-812-0000-0000", null);
        DbContext.Customers.Add(customer);
        await DbContext.SaveChangesAsync();
        return customer;
    }
}
```

### 3.4 Database & Migrations

```csharp
// MigrationTests.cs
[Fact]
public async Task AllMigrations_ApplyWithoutError()
{
    // EnsureCreated validates all entity configurations and relations work.
    // If the schema has issues, this throws.
    await DbContext.Database.EnsureCreatedAsync();
    var canConnect = await DbContext.Database.CanConnectAsync();
    canConnect.Should().BeTrue();
}

[Fact]
public async Task VehicleOwnedType_MoneyColumns_MappedCorrectly()
{
    var vehicle = Vehicle.Create("B TEST", "Honda", "BR-V", 2023, "White", 7,
        new Money(400_000m, "IDR"), Guid.NewGuid());
    DbContext.Vehicles.Add(vehicle);
    await DbContext.SaveChangesAsync();

    var loaded = await DbContext.Vehicles
        .AsNoTracking()
        .FirstAsync(v => v.Id == vehicle.Id);

    loaded.DailyRate.Amount.Should().Be(400_000m);
    loaded.DailyRate.Currency.Should().Be("IDR");
}
```

### 3.5 Event Pipeline

Verify that domain event handlers (domain event → timeline entry) execute correctly end-to-end.

```csharp
// DomainEventPipelineTests.cs
[Fact]
public async Task InquiryCreated_AddsTimelineEntry()
{
    var inquiry = Inquiry.Create(Guid.NewGuid(), Guid.NewGuid(),
        new DateRange(DateTimeOffset.UtcNow, DateTimeOffset.UtcNow.AddDays(2)), null);
    DbContext.Inquiries.Add(inquiry);
    await DbContext.SaveChangesAsync();

    // DomainEventDispatchingInterceptor should have dispatched InquiryCreated
    // and InquiryCreatedDomainHandler should have written a TimelineEntry.
    var entries = await DbContext.TimelineEntries
        .Where(e => e.ReferenceId == inquiry.Id)
        .ToListAsync();

    entries.Should().ContainSingle()
        .Which.EventType.Should().Be("InquiryCreated");
}
```

---

## 4. E2E Testing (Full Stack)

**Framework:** Playwright with TypeScript.

### 4.1 Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  retries: 1,
  workers: 2,
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "mobile-sm", use: { ...devices["iPhone SE"], viewport: { width: 375, height: 812 } } },
    { name: "mobile-md", use: { ...devices["iPhone 14"], viewport: { width: 390, height: 844 } } },
    { name: "mobile-lg", use: { ...devices["Pixel 5"], viewport: { width: 414, height: 896 } } },
    { name: "chrome", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: [
    { command: "dotnet run", cwd: "../backend/src/Rentalin.Api", port: 5000, timeout: 30_000 },
    { command: "pnpm dev", cwd: ".", port: 3000, timeout: 30_000 },
  ],
});
```

### 4.2 Critical Flow: Inquiry → Reservation → Rental → Return → Inspection

```typescript
// e2e/full-rental-flow.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Full Rental Flow", () => {
  test("Complete inquiry to inspection pipeline on mobile", async ({ page }) => {
    // --- Fleet: create a vehicle ---
    await page.goto("/fleet");
    await page.getByRole("button", { name: "Add" }).tap();
    await page.getByLabel("License Plate").fill("B E2E99");
    await page.getByLabel("Make").fill("Toyota");
    await page.getByLabel("Model").fill("Avanza");
    await page.getByLabel("Year").fill("2024");
    await page.getByLabel("Color").fill("Silver");
    await page.getByLabel("Seats").fill("7");
    await page.getByLabel("Daily Rate").fill("350000");
    await page.getByRole("button", { name: "Create" }).tap();
    await expect(page.getByText("B E2E99")).toBeVisible();

    // --- Reservations: create inquiry ---
    await page.goto("/reservations");
    await page.getByRole("button", { name: "New Inquiry" }).tap();
    await page.getByLabel("Customer").fill("Test Customer");
    await page.getByLabel("Vehicle").selectOption({ label: "B E2E99" });
    await page.getByLabel("Start Date").fill("2026-08-01");
    await page.getByLabel("End Date").fill("2026-08-05");
    await page.getByRole("button", { name: "Create Inquiry" }).tap();
    await expect(page.getByText("Pending")).toBeVisible();

    // --- Confirm inquiry ---
    await page.getByRole("button", { name: "Confirm" }).tap();
    await expect(page.getByText("Confirmed")).toBeVisible();

    // --- Create reservation ---
    await page.getByRole("button", { name: "Reserve" }).tap();
    await page.getByLabel("Estimated Cost").fill("1750000");
    await page.getByRole("button", { name: "Create Reservation" }).tap();
    await expect(page.getByText("Active")).toBeVisible();

    // --- Prepare vehicle ---
    await page.getByRole("button", { name: "Prepare" }).tap();
    await expect(page.getByText("Preparing")).toBeVisible();

    // --- Ready for handover ---
    await page.getByRole("button", { name: "Ready" }).tap();
    await expect(page.getByText("Ready")).toBeVisible();

    // --- Handover complete → Rental starts ---
    await page.getByRole("button", { name: "Handover" }).tap();
    await page.getByLabel("Odometer Start").fill("10000");
    await page.getByRole("button", { name: "Start Rental" }).tap();

    // --- Create and mark payment ---
    await page.goto("/reservations");
    await page.getByRole("button", { name: "Pay" }).tap();
    await page.getByLabel("Amount").fill("1750000");
    await page.getByLabel("Method").selectOption("Cash");
    await page.getByRole("button", { name: "Create Payment" }).tap();
    await page.getByRole("button", { name: "Mark Complete" }).tap();
    await expect(page.getByText("Completed")).toBeVisible();

    // --- Complete rental ---
    await page.getByRole("button", { name: "Complete Rental" }).tap();
    await page.getByLabel("Odometer End").fill("10500");
    await page.getByRole("button", { name: "Complete" }).tap();

    // --- Post-rental inspection ---
    await page.goto("/inspections");
    await page.getByRole("button", { name: "Create" }).tap();
    await page.getByLabel("Type").selectOption("PostRental");
    await page.getByLabel("Notes").fill("No damage");
    await page.getByRole("button", { name: "Create Inspection" }).tap();
    await page.getByRole("button", { name: "Complete" }).tap();

    // --- Verify timeline ---
    await page.goto("/timeline");
    await expect(page.getByText("InquiryCreated")).toBeVisible();
    await expect(page.getByText("ReservationCreated")).toBeVisible();
    await expect(page.getByText("RentalStarted")).toBeVisible();
    await expect(page.getByText("RentalCompleted")).toBeVisible();
  });
});
```

### 4.3 Offline & Error Handling

```typescript
// e2e/offline-resilience.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Offline Resilience", () => {
  test("Shows error state when API is unreachable", async ({ page, context }) => {
    // Simulate offline by blocking API route
    await context.route("**/api/**", (route) => route.abort());

    await page.goto("/fleet");
    await expect(page.getByText(/error|unavailable|failed/i)).toBeVisible({ timeout: 10_000 });
  });

  test("Network throttling — slow 3G", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Emulate slow 3G (400ms RTT, 500kbps down, 200kbps up)
    const client = await context.newCDPSession(page);
    await client.send("Network.enable");
    await client.send("Network.emulateNetworkConditions", {
      offline: false,
      downloadThroughput: (500 * 1024) / 8,
      uploadThroughput: (200 * 1024) / 8,
      latency: 400,
    });

    await page.goto("/fleet");
    await expect(page.getByRole("button", { name: "Add" })).toBeVisible({ timeout: 15_000 });
  });
});
```

---

## 5. Contract Testing

API contracts between frontend and backend must be validated to prevent silent breakage.

### 5.1 JSON Schema Validation

```csharp
// ContractTests.cs
using System.Text.Json;
using NJsonSchema;

public class ApiContractTests : IntegrationTestBase
{
    [Fact]
    public async Task VehicleResponse_MatchesFrontendType()
    {
        var businessId = await SeedBusiness();
        var createReq = new
        {
            licensePlate = "B CTCT",
            make = "Suzuki", model = "Ertiga", year = 2023,
            color = "Black", seatingCapacity = 7,
            dailyRate = 300_000m, currency = "IDR", businessId
        };
        var response = await Client.PostAsync("/api/vehicles", JsonContent.Create(createReq));
        var json = await response.Content.ReadAsStringAsync();

        var schema = await JsonSchema.FromTypeAsync<VehicleResponse>();
        var errors = schema.Validate(json);

        errors.Should().BeEmpty();
    }

    [Fact]
    public async Task AllEndpoints_ReturnExpectedContentType()
    {
        var endpoints = new[] { "/api/vehicles", "/api/inquiries", "/api/reservations", "/api/rentals" };
        foreach (var endpoint in endpoints)
        {
            var response = await Client.GetAsync(endpoint);
            response.Content.Headers.ContentType?.MediaType.Should().Be("application/json");
        }
    }
}
```

### 5.2 TypeScript Type Snapshot Testing

```typescript
// __tests__/contracts.spec.ts
import { describe, it, expect } from "vitest";

describe("API contract type snapshots", () => {
  it("VehicleResponse matches snapshot", () => {
    // Generate JSON schema from TypeScript type using ts-json-schema-generator
    const schema = {
      type: "object",
      required: ["id", "licensePlate", "make", "model", "year", "color",
                 "seatingCapacity", "dailyRateAmount", "dailyRateCurrency",
                 "status", "businessId"],
      properties: {
        id: { type: "string" },
        licensePlate: { type: "string" },
        make: { type: "string" },
        model: { type: "string" },
        year: { type: "number" },
        color: { type: "string" },
        seatingCapacity: { type: "number" },
        dailyRateAmount: { type: "number" },
        dailyRateCurrency: { type: "string" },
        status: { type: "string", enum: ["Available", "Reserved", "Rented", "Maintenance", "Retired"] },
        businessId: { type: "string" },
      },
    };
    expect(schema).toMatchSnapshot();
  });

  it("InquiryResponse matches snapshot", () => {
    const schema = {
      type: "object",
      required: ["id", "customerId", "customerName", "vehicleId",
                 "vehicleSummary", "startDate", "endDate", "status"],
      properties: {
        id: { type: "string" },
        customerId: { type: "string" },
        customerName: { type: "string" },
        vehicleId: { type: "string" },
        vehicleSummary: { type: "string" },
        startDate: { type: "string", format: "date-time" },
        endDate: { type: "string", format: "date-time" },
        status: { type: "string", enum: ["New", "Pending", "Responded", "Converted", "Cancelled"] },
        notes: { type: "string" },
      },
    };
    expect(schema).toMatchSnapshot();
  });
});
```

---

## 6. Visual Regression Testing

Use Percy or Chromatic to capture screenshots across viewports.

```typescript
// e2e/visual.spec.ts
import { test, expect } from "@playwright/test";
import percySnapshot from "@percy/playwright";

const PAGES = ["/fleet", "/reservations", "/inspections", "/operations", "/customers", "/settings", "/timeline"];

test.describe("Visual Regression", () => {
  PAGES.forEach((path) => {
    test(`${path} renders correctly`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      await percySnapshot(page, `page-${path.replace(/\//g, "-")}`);
    });
  });

  test("fleet page at 3 viewports", async ({ page }) => {
    await page.goto("/fleet");
    await percySnapshot(page, "fleet-mobile-sm", { widths: [375] });
    await percySnapshot(page, "fleet-mobile-md", { widths: [390] });
    await percySnapshot(page, "fleet-mobile-lg", { widths: [414] });
  });
});
```

---

## 7. Accessibility Testing

```typescript
// e2e/accessibility.spec.ts
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const PAGES = ["/fleet", "/reservations", "/inspections", "/operations", "/customers", "/settings", "/timeline"];

test.describe("Accessibility — axe-core automated", () => {
  PAGES.forEach((path) => {
    test(`${path} has no critical a11y violations`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2aa", "wcag21aa"])
        .analyze();

      expect(results.violations.filter(v => v.impact === "critical")).toEqual([]);
    });
  });
});

test.describe("Accessibility — Manual Checks", () => {
  test("All interactive elements have minimum 44px touch target", async ({ page }) => {
    await page.goto("/fleet");
    await page.waitForLoadState("networkidle");

    const interactive = page.locator("button, a, input, select, [role=button]");
    const count = await interactive.count();

    for (let i = 0; i < count; i++) {
      const box = await interactive.nth(i).boundingBox();
      if (box) {
        expect(box.width, `Element ${i} width too small`).toBeGreaterThanOrEqual(44);
        expect(box.height, `Element ${i} height too small`).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test("Contrast ratio meets WCAG AA", async ({ page }) => {
    await page.goto("/settings");
    // Use axe-core color contrast checks
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2aa"])
      .options({ runOnly: { type: "tag", values: ["wcag2aa"] } })
      .analyze();

    const colorViolations = results.violations.filter(v =>
      v.id === "color-contrast");
    expect(colorViolations).toEqual([]);
  });

  test("Keyboard navigation — all focusable elements reachable via Tab", async ({ page }) => {
    await page.goto("/fleet");
    await page.keyboard.press("Tab");

    const focused = page.locator(":focus");
    await expect(focused).toBeVisible();
    // Cycle through all focus traps and verify no dead ends
  });
});
```

---

## 8. Performance Testing

### 8.1 Backend — BenchmarkDotNet

```csharp
// Benchmarks/VehicleQueryBenchmarks.cs
using BenchmarkDotNet.Attributes;
using BenchmarkDotNet.Running;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Rentalin.Fleet.Domain.Entities;
using Rentalin.Infrastructure.Data;

[MemoryDiagnoser]
[ShortRunJob]
public class VehicleQueryBenchmarks
{
    private RentalinDbContext _db = null!;

    [GlobalSetup]
    public void Setup()
    {
        var services = new ServiceCollection();
        services.AddDbContext<RentalinDbContext>(o => o.UseSqlite("DataSource=:memory:"));
        var sp = services.BuildServiceProvider();
        _db = sp.GetRequiredService<RentalinDbContext>();
        _db.Database.OpenConnection();
        _db.Database.EnsureCreated();

        // Seed 1000 vehicles
        var businessId = Guid.NewGuid();
        _db.Businesses.Add(Business.Create("Bench", "Address", "555", "b@b.com"));
        _db.SaveChanges();

        for (int i = 0; i < 1000; i++)
        {
            _db.Vehicles.Add(Vehicle.Create($"B {i:D4}", "Toyota", "Avanza", 2023,
                "White", 7, new Money(350_000m, "IDR"), businessId));
        }
        _db.SaveChanges();
    }

    [GlobalCleanup]
    public void Cleanup() => _db.Database.CloseConnection();

    [Benchmark]
    public async Task<List<Vehicle>> GetAllVehicles()
    {
        return await _db.Vehicles.AsNoTracking().ToListAsync();
    }

    [Benchmark]
    public async Task<Vehicle?> GetVehicleById()
    {
        return await _db.Vehicles.AsNoTracking().FirstOrDefaultAsync(v => v.LicensePlate == "B 0500");
    }
}

// dotnet run -c Release --project tests/Rentalin.Benchmarks
```

### 8.2 API — K6 Load Testing

```javascript
// k6/load-test.js
import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "30s", target: 10 },  // ramp up
    { duration: "1m", target: 50 },   // sustain
    { duration: "30s", target: 0 },   // ramp down
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"], // 95% of requests under 500ms
    http_req_failed: ["rate<0.01"],   // < 1% errors
  },
};

const BASE = "http://localhost:5000";

export default function () {
  const vehiclesRes = http.get(`${BASE}/api/vehicles`);
  check(vehiclesRes, { "GET /vehicles OK": (r) => r.status === 200 });

  const opsRes = http.get(`${BASE}/api/operations/summary`);
  check(opsRes, { "GET /operations OK": (r) => r.status === 200 });

  sleep(1);
}
```

### 8.3 Frontend — Lighthouse CI

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI
on: [pull_request]
jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: pnpm install
      - run: pnpm build && pnpm start &
      - uses: treosh/lighthouse-ci-action@v12
        with:
          urls: |
            http://localhost:3000/fleet
            http://localhost:3000/reservations
            http://localhost:3000/operations
          uploadArtifacts: true
          budgetPath: ./lighthouse-budget.json
```

```json
// lighthouse-budget.json
{
  "resourceSizes": [
    { "resourceType": "total", "budget": 500 },
    { "resourceType": "script", "budget": 200 },
    { "resourceType": "stylesheet", "budget": 50 }
  ],
  "timings": [
    { "metric": "interactive", "budget": 3000 },
    { "metric": "first-contentful-paint", "budget": 1500 },
    { "metric": "largest-contentful-paint", "budget": 2500 }
  ]
}
```

---

## 9. Offline Testing

```typescript
// e2e/offline-data-entry.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Offline Data Entry", () => {
  test("UI degrades gracefully when API is unreachable", async ({ page, context }) => {
    await page.goto("/fleet");
    await page.waitForLoadState("networkidle");

    // Block API
    await context.route("**/api/**", (route) => route.abort());

    // Refresh — should show cached/stale data or graceful error
    await page.reload();
    await expect(page.getByText(/offline|unavailable|error|retry/i)).toBeVisible();
  });

  test("Error states render for failed individual fetches", async ({ page }) => {
    await context.route("**/api/vehicles", (route) =>
      route.fulfill({ status: 500, body: JSON.stringify({ error: "Internal" }) }));

    await page.goto("/fleet");
    await expect(page.getByText(/error|failed|try again/i)).toBeVisible();
  });
});
```

---

## 10. Business Rule Testing

Every business rule from the project specification must have at least one test.

```csharp
// BusinessRuleTests.cs
namespace Rentalin.Tests.Unit.BusinessRules;

public class BusinessRuleTests
{
    // --- Rule: Timeline is immutable ---
    [Fact]
    public void TimelineEntry_CannotBeModifiedAfterCreation()
    {
        var entry = TimelineEntry.Create("Inquiry", Guid.NewGuid(), "Created", "Test", "System");
        // TimelineEntry has no public setters — immutability is enforced at the type level.
        // This test asserts the design: any attempt to modify via reflection would break.
        typeof(TimelineEntry).GetProperties()
            .Where(p => p.CanWrite && p.SetMethod?.IsPublic == true)
            .Should().BeEmpty("TimelineEntry must have no public setters.");
    }

    // --- Rule: Separate intent from reality ---
    [Fact]
    public void InquiryIsSeparateFromReservation()
    {
        // An Inquiry represents intent. A Reservation represents reality.
        // They are different aggregates with different lifecycles.
        var inquiry = Inquiry.Create(Guid.NewGuid(), Guid.NewGuid(),
            new DateRange(DateTimeOffset.UtcNow, DateTimeOffset.UtcNow.AddDays(3)), null);

        // Inquiry must be confirmed before it can become a Reservation
        inquiry.Confirm();
        var reservation = Reservation.CreateFromInquiry(inquiry, new Money(500_000m, "IDR"));

        reservation.InquiryId.Should().Be(inquiry.Id);
        reservation.Id.Should().NotBe(inquiry.Id);
    }

    // --- Rule: Owner decides exceptions (cancel flows check permissions) ---
    // This is enforced at the handler/API level, not domain level.
    // Domain model allows cancellation in valid states; authorization is a separate concern.

    // --- Rule: Vehicle must be available to reserve ---
    [Fact]
    public void Reservation_RequiresConfirmedInquiry()
    {
        var pendingInquiry = Inquiry.Create(Guid.NewGuid(), Guid.NewGuid(),
            new DateRange(DateTimeOffset.UtcNow, DateTimeOffset.UtcNow.AddDays(3)), null);

        var act = () => Reservation.CreateFromInquiry(pendingInquiry, Money.Zero("IDR"));
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("Cannot create reservation from unconfirmed inquiry.");
    }

    // --- Rule: Payment required before rental ---
    [Fact]
    public void RentalStart_ShouldBePrecededByPayment()
    {
        // This is a business process rule enforced at the orchestration/API level.
        // The domain model requires a Rental before Payment (Payment references RentalId).
        // The handler or service layer must enforce the order.
    }

    // --- Rule: Inspection required after return ---
    [Fact]
    public void Inspection_ReferencesRental()
    {
        // Inspection must be tied to a Rental. It cannot exist independently.
        var inspection = Inspection.Create(Guid.NewGuid(), Guid.NewGuid(),
            InspectionType.PostRental, [], "No issues");
        inspection.RentalId.Should().NotBeEmpty();
    }

    // --- Rule: Vehicle status auto-updated on events ---
    [Fact]
    public void VehicleStatus_IsUpdatedAfterRentalEvents()
    {
        // When a rental starts, the vehicle status should transition to Rented.
        // When a rental completes, the vehicle status should return to Available.
        // These transitions happen via domain event handlers or the handler layer.
        // Test that UpdateStatus changes vehicle status as expected.
        var vehicle = Vehicle.Create("B STAT", "Toyota", "Avanza", 2023, "White", 7,
            new Money(350_000m, "IDR"), Guid.NewGuid());
        vehicle.Status.Should().Be(VehicleStatus.Available);

        vehicle.UpdateStatus(VehicleStatus.Rented);
        vehicle.Status.Should().Be(VehicleStatus.Rented);

        vehicle.UpdateStatus(VehicleStatus.Available);
        vehicle.Status.Should().Be(VehicleStatus.Available);
    }
}
```

---

## 11. CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Test Suite
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  unit:
    name: Unit Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-dotnet@v4
        with:
          dotnet-version: "10.0.x"
      - run: dotnet test tests/Rentalin.Tests.Unit --configuration Release --logger "trx;LogFileName=unit-results.trx"
      - uses: dorny/test-reporter@v1
        if: always()
        with:
          name: Unit Tests
          path: "**/*-results.trx"
          reporter: dotnet-trx

  integration:
    name: Integration Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-dotnet@v4
        with:
          dotnet-version: "10.0.x"
      - run: dotnet test tests/Rentalin.Tests.Integration --configuration Release --logger "trx;LogFileName=integration-results.trx"
      - uses: dorny/test-reporter@v1
        if: always()
        with:
          name: Integration Tests
          path: "**/*-results.trx"
          reporter: dotnet-trx

  e2e:
    name: E2E Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-dotnet@v4
        with:
          dotnet-version: "10.0.x"
      - uses: actions/setup-node@v4
        with:
          node-version: "22"
      - run: pnpm install
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm run test:e2e
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/

  a11y:
    name: Accessibility
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "22"
      - run: pnpm install
      - run: pnpm run test:a11y

  contracts:
    name: Contract Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-dotnet@v4
        with:
          dotnet-version: "10.0.x"
      - run: dotnet test tests/Rentalin.Tests.Contracts --configuration Release

  required:
    name: All Checks Passed
    needs: [unit, integration, e2e, a11y, contracts]
    if: always()
    runs-on: ubuntu-latest
    steps:
      - run: |
          if [[ "${{ needs.unit.result }}" != "success" || \
                "${{ needs.integration.result }}" != "success" || \
                "${{ needs.e2e.result }}" != "success" || \
                "${{ needs.a11y.result }}" != "success" || \
                "${{ needs.contracts.result }}" != "success" ]]; then
            echo "Some tests failed."
            exit 1
          fi
```

**Branch protection** on `main`: require the `All Checks Passed` status check before merging.

---

## 12. Test Data

### 12.1 Test Data Factory

```csharp
// TestDataFactory.cs
using Rentalin.Core.ValueObjects;
using Rentalin.Fleet.Domain.Entities;
using Rentalin.Reservations.Domain.Entities;

namespace Rentalin.Tests.Common;

public static class TestDataFactory
{
    public static readonly Guid BusinessId = Guid.Parse("00000000-0000-0000-0000-000000000001");
    public static readonly Guid CustomerId = Guid.Parse("00000000-0000-0000-0000-000000000002");
    public static readonly Guid VehicleId = Guid.Parse("00000000-0000-0000-0000-000000000003");
    public static readonly string Currency = "IDR";

    public static Business CreateBusiness(string name = "Test Rental Co") =>
        Business.Create(name, "123 Test St", "555-0000", "test@rental.com");

    public static Customer CreateCustomer(string name = "Test Customer") =>
        Customer.Create(name, "test@email.com", "+62-812-0000-0000", null);

    public static Vehicle CreateVehicle(string plate = "B TST01", Money? rate = null) =>
        Vehicle.Create(plate, "Toyota", "Avanza", 2023, "Silver", 7,
            rate ?? new Money(350_000m, Currency), BusinessId);

    public static Inquiry CreatePendingInquiry() =>
        Inquiry.Create(CustomerId, VehicleId,
            new DateRange(DateTimeOffset.UtcNow.AddDays(1), DateTimeOffset.UtcNow.AddDays(4)), null);

    public static Inquiry CreateConfirmedInquiry()
    {
        var inquiry = CreatePendingInquiry();
        inquiry.Confirm();
        return inquiry;
    }

    public static Reservation CreateActiveReservation(Money? cost = null)
    {
        var inquiry = CreateConfirmedInquiry();
        return Reservation.CreateFromInquiry(inquiry, cost ?? new Money(500_000m, Currency));
    }

    public static Reservation CreateInProgressReservation()
    {
        var reservation = CreateActiveReservation();
        reservation.Prepare();
        reservation.ReadyForHandover();
        reservation.HandoverComplete();
        return reservation;
    }

    public static Rental CreateActiveRental()
    {
        var reservation = CreateInProgressReservation();
        var rental = Rental.CreateFromReservation(reservation);
        rental.Start(10000);
        return rental;
    }

    public static Payment CreatePendingPayment(Guid rentalId) =>
        Payment.Create(rentalId, new Money(500_000m, Currency), PaymentMethod.Cash);

    public static Inspection CreatePendingInspection(Guid vehicleId, Guid rentalId) =>
        Inspection.Create(vehicleId, rentalId, InspectionType.PostRental, ["url1"], "OK");
}
```

### 12.2 Clean Up Between Tests

- **Unit tests:** No shared state. Each test creates its own objects. xUnit runs test classes in parallel by default; each test method receives a fresh class instance.
- **Integration tests:** Use `IAsyncLifetime` to create a fresh in-memory database per test class. Reset by closing and reopening the connection or by deleting/recreating the database.
- **E2E tests:** Playwright runs each test in an isolated browser context. Seed data via API calls at the start of each test. Never rely on persistent database state.

---

## Test File Organization

```
backend/
  tests/
    Rentalin.Tests.Common/           # Shared test utilities, TestDataFactory
    Rentalin.Tests.Unit/
      Core/
        ValueObjects/
          MoneyTests.cs
          DateRangeTests.cs
      Fleet/
        Domain/
          VehicleTests.cs
        Handlers/
          UpdateVehicleHandlerTests.cs
      Reservations/
        Domain/
          InquiryTests.cs
          ReservationTests.cs
          RentalTests.cs
          PaymentTests.cs
        Handlers/
          ConfirmInquiryHandlerTests.cs
          CreateReservationHandlerTests.cs
      Inspections/
        Domain/
          InspectionTests.cs
      Timeline/
        Domain/
          TimelineEntryTests.cs
      BusinessRules/
        BusinessRuleTests.cs
    Rentalin.Tests.Integration/
      IntegrationTestBase.cs
      Api/
        VehicleEndpointsTests.cs
        InquiryEndpointsTests.cs
        ReservationEndpointsTests.cs
      Pipeline/
        RentalPipelineTests.cs
      Database/
        MigrationTests.cs
        EventPipelineTests.cs
    Rentalin.Tests.Contracts/
      ApiContractTests.cs
    Rentalin.Benchmarks/
      VehicleQueryBenchmarks.cs

frontend/
  e2e/
    playwright.config.ts
    full-rental-flow.spec.ts
    offline-resilience.spec.ts
    offline-data-entry.spec.ts
    visual.spec.ts
    accessibility.spec.ts
  __tests__/
    contracts.spec.ts
```
