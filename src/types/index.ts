export type Role = "OWNER" | "CLIENT" | "ADMIN";

export type UserStatus = "ACTIVE" | "SUSPENDED" | "DEACTIVATED";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  requires2FA: boolean;
  emailVerified: string | null;
}

export type AssetType = "TRUCK" | "EQUIPMENT" | "MATERIAL";

export type AvailabilityStatus =
  | "AVAILABLE"
  | "HIRED"
  | "MAINTENANCE"
  | "INACTIVE";

export type BookingStatus =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "DISPUTED";

export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type TicketStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "ESCALATED"
  | "RESOLVED"
  | "CLOSED";

export type ReversalStatus =
  | "PENDING"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "PROCESSED";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
