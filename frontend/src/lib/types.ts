export interface VehicleResponse {
  id: string;
  licensePlate: string;
  make: string;
  model: string;
  year: number;
  color: string;
  seatingCapacity: number;
  dailyRateAmount: number;
  dailyRateCurrency: string;
  status: VehicleStatus;
  businessId: string;
}

export type VehicleStatus = "Available" | "Reserved" | "Rented" | "Maintenance" | "Retired";

export interface InquiryResponse {
  id: string;
  customerId: string;
  customerName: string;
  vehicleId: string;
  vehicleSummary: string;
  startDate: string;
  endDate: string;
  status: InquiryStatus;
  notes?: string;
}

export type InquiryStatus = "New" | "Pending" | "Responded" | "Converted" | "Cancelled";

export interface ReservationResponse {
  id: string;
  inquiryId: string;
  customerId: string;
  customerName: string;
  vehicleId: string;
  vehicleSummary: string;
  startDate: string;
  endDate: string;
  estimatedCost: number;
  currency: string;
  status: ReservationStatus;
}

export type ReservationStatus = "Confirmed" | "PreRental" | "Cancelled" | "Ready" | "Active";

export interface RentalResponse {
  id: string;
  reservationId: string;
  vehicleId: string;
  vehicleSummary: string;
  customerId: string;
  customerName: string;
  actualStart?: string;
  actualEnd?: string;
  odometerStart?: number;
  odometerEnd?: number;
  status: "Active" | "Completed" | "Overdue";
}

export interface InspectionResponse {
  id: string;
  rentalId: string;
  vehicleId: string;
  inspectionType: "PreRental" | "PostRental";
  notes?: string;
  photoUrls: string[];
  status: "Pending" | "Completed" | "Failed";
  inspectionDate?: string;
}

export interface TimelineEntryResponse {
  id: string;
  referenceType: string;
  referenceId: string;
  eventType: string;
  description: string;
  occurredAt: string;
  actor: string;
}

export interface CreateVehicleRequest {
  licensePlate: string;
  make: string;
  model: string;
  year: number;
  color: string;
  seatingCapacity: number;
  dailyRate: number;
  currency: string;
  businessId: string;
}

export interface UpdateVehicleRequest {
  id: string;
  licensePlate: string;
  make: string;
  model: string;
  year: number;
  color: string;
  seatingCapacity: number;
  dailyRate: number;
  currency: string;
  businessId: string;
}

export interface CreateInquiryRequest {
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  vehicleId: string;
  startDate: string;
  endDate?: string;
  notes?: string;
}

export interface CreateReservationRequest {
  inquiryId: string;
  estimatedCost: number;
  currency: string;
}

export interface StartRentalRequest {
  reservationId: string;
  odometerStart: number;
}

export interface CompleteRentalRequest {
  rentalId: string;
  odometerEnd: number;
}

export interface OperationsSummary {
  totalVehicles: number; availableVehicles: number; rentedVehicles: number;
  activeInquiries: number; activeReservations: number; activeRentals: number;
  pendingInspections: number; todayRevenue: number; revenueCurrency: string;
}

export interface CustomerResponse {
  id: string;
  name: string;
  phoneNumber: string;
  email: string;
  notes?: string;
}

export interface PaymentResponse {
  id: string;
  rentalId: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  paidAt?: string;
}

export interface CreateCustomerRequest {
  name: string;
  phoneNumber: string;
  email: string;
  notes?: string;
}

export interface CreatePaymentRequest {
  rentalId: string;
  amount: number;
  currency: string;
  method: string;
}

export interface BusinessResponse {
  id: string;
  name: string;
  address: string;
  phoneNumber: string;
  email: string;
  logoUrl?: string;
  slug: string;
}

export interface StaffResponse {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  role: string;
  businessId: string;
  isActive: boolean;
}

export interface AttachmentResponse {
  id: string;
  referenceType: string;
  referenceId: string;
  fileName: string;
  contentType: string;
  fileUrl: string;
  fileSizeBytes: number;
  uploadedAt: string;
}

export interface CreateBusinessRequest {
  name: string;
  address: string;
  phoneNumber: string;
  email: string;
}

export interface UpdateBusinessRequest {
  id: string;
  name: string;
  address: string;
  phoneNumber: string;
  email: string;
}

export interface CreateStaffRequest {
  name: string;
  email: string;
  phoneNumber: string;
  role: string;
  businessId: string;
}

export interface CreateAttachmentRequest {
  referenceType: string;
  referenceId: string;
  fileName: string;
  contentType: string;
  fileUrl: string;
  fileSizeBytes: number;
}
