/**
 * MedflowX - Core type definitions for OPD Token Allocation System
 */

/** Token source types with different priority levels */
export type TokenSource =
  | "online_booking"
  | "walk_in"
  | "paid_priority"
  | "follow_up";

/** Token status lifecycle */
export type TokenStatus =
  | "allocated"
  | "waiting"
  | "in_consultation"
  | "completed"
  | "cancelled"
  | "no_show";

/** Slot status */
export type SlotStatus =
  | "scheduled"
  | "active"
  | "completed"
  | "delayed"
  | "cancelled";

/** Waitlist entry status */
export type WaitlistStatus = "waiting" | "promoted" | "expired";

export interface WorkingHours {
  start: string; // HH:mm
  end: string;   // HH:mm
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  slotDuration: number; // minutes, default 60
  maxPatientsPerSlot: number; // default 10
  workingHours: WorkingHours;
}

export interface TimeSlot {
  id: string;
  doctorId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // ISO 8601
  endTime: string;   // ISO 8601
  maxCapacity: number;
  currentOccupancy: number;
  status: SlotStatus;
  actualStartTime: string | null; // for delay tracking
  estimatedDelay: number; // minutes
}

export interface Patient {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  isFollowUp: boolean;
  previousVisit: string | null; // ISO 8601
}

export interface Token {
  id: string;
  tokenNumber: string; // e.g. 'D1-S2-T05'
  patientId: string;
  doctorId: string;
  slotId: string;
  tokenSource: TokenSource;
  priority: number; // 1 = highest (calculated from source)
  status: TokenStatus;
  allocatedAt: string; // ISO 8601
  estimatedConsultationTime: string; // ISO 8601
  actualConsultationTime: string | null;
  completedAt: string | null;
  positionInQueue: number;
  isEmergency?: boolean;
}

export interface WaitlistEntry {
  id: string;
  patientId: string;
  doctorId: string;
  preferredSlotId: string | null;
  tokenSource: TokenSource;
  priority: number;
  joinedAt: string; // ISO 8601
  status: WaitlistStatus;
  patientDetails?: { name: string; phone: string; email?: string };
}

/** API request/response types */
export interface AllocateTokenRequest {
  patientId: string;
  doctorId: string;
  slotTime: string; // ISO 8601
  tokenSource: TokenSource;
  patientDetails?: { name: string; phone: string; email?: string };
  notes?: string;
}

export interface AllocateTokenResponse {
  success: boolean;
  tokenNumber?: string;
  estimatedTime?: string;
  slotId?: string;
  position?: number;
  message: string;
  waitlistPosition?: number;
}

export interface CancelTokenResponse {
  success: boolean;
  freedSlotId?: string;
  reallocatedTo?: string | null;
  waitlistPromotions?: Array<{ patientId: string; tokenNumber: string }>;
}

export interface EmergencyInsertRequest {
  patientId: string;
  doctorId: string;
  preferredSlot?: string;
}

export interface EmergencyInsertResponse {
  allocatedSlot: {
    slotId: string;
    tokenNumber: string;
    estimatedTime: string;
  };
  bumpedPatients: Array<{ patientId: string; newSlotId: string; tokenNumber: string }>;
  notifications: string[];
}
