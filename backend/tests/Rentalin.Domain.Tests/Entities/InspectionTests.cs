using FluentAssertions;
using Rentalin.Core.Exceptions;
using Rentalin.Inspections.Domain.Entities;
using Rentalin.Inspections.Domain.Enums;

namespace Rentalin.Domain.Tests.Entities;

public sealed class InspectionTests
{
    [Fact]
    public void Create_ShouldSetPendingStatus()
    {
        var inspection = CreatePendingInspection();

        inspection.Status.Should().Be(InspectionStatus.Pending);
    }

    [Fact]
    public void Create_ShouldStoreProperties()
    {
        var vehicleId = Guid.NewGuid();
        var rentalId = Guid.NewGuid();
        var photoUrls = new List<string> { "url1", "url2" };

        var inspection = Inspection.Create(vehicleId, rentalId, InspectionType.PostRental, photoUrls, "No damage");

        inspection.VehicleId.Should().Be(vehicleId);
        inspection.RentalId.Should().Be(rentalId);
        inspection.Type.Should().Be(InspectionType.PostRental);
        inspection.PhotoUrls.Should().BeEquivalentTo(photoUrls);
        inspection.Notes.Should().Be("No damage");
    }

    [Fact]
    public void Create_PreRentalType_ShouldSucceed()
    {
        var inspection = Inspection.Create(Guid.NewGuid(), Guid.NewGuid(),
            InspectionType.PreRental, [], "");

        inspection.Type.Should().Be(InspectionType.PreRental);
    }

    [Fact]
    public void Complete_WhenPendingWithoutNotesRequirement_ShouldTransitionToCompleted()
    {
        var inspection = CreatePendingInspection();

        inspection.Complete(requiresNotes: false);

        inspection.Status.Should().Be(InspectionStatus.Completed);
    }

    [Fact]
    public void Complete_WhenPendingWithNotes_ShouldTransitionToCompleted()
    {
        var inspection = Inspection.Create(Guid.NewGuid(), Guid.NewGuid(),
            InspectionType.PostRental, [], "Some damage found");

        inspection.Complete(requiresNotes: true);

        inspection.Status.Should().Be(InspectionStatus.Completed);
    }

    [Fact]
    public void Complete_WhenRequiresNotesButEmpty_ShouldThrow()
    {
        var inspection = Inspection.Create(Guid.NewGuid(), Guid.NewGuid(),
            InspectionType.PostRental, [], "");

        var act = () => inspection.Complete(requiresNotes: true);

        act.Should().Throw<DomainException>()
            .WithMessage("Notes are required when inspection has issues.");
    }

    [Fact]
    public void Complete_WhenAlreadyCompleted_ShouldThrow()
    {
        var inspection = CreatePendingInspection();
        inspection.Complete(requiresNotes: false);

        var act = () => inspection.Complete(requiresNotes: false);

        act.Should().Throw<DomainException>()
            .WithMessage("Cannot complete inspection — inspection already completed.");
    }

    private static Inspection CreatePendingInspection() =>
        Inspection.Create(Guid.NewGuid(), Guid.NewGuid(), InspectionType.PostRental, [], "No damage");
}
