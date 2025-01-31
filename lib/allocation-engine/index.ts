/**
 * MedflowX Allocation Engine - Public API
 */

export { getPriorityForSource, comparePriority, hasHigherPriority, EMERGENCY_PRIORITY } from "./priority-calculator";
export {
  getSortedWaitlist,
  getNextWaitlistPatient,
  markWaitlistPromoted,
  createWaitlistEntry,
} from "./waitlist-manager";
export {
  allocateToken,
  findSlotForTime,
  generateTokenNumber,
  estimateConsultationTime,
} from "./token-allocator";
export type { AllocateResult } from "./token-allocator";
export {
  reallocateFreedSlot,
  decrementSlotOccupancy,
} from "./reallocation-engine";
export type { ReallocationResult } from "./reallocation-engine";
export { emergencyInsert } from "./emergency-handler";
export type { EmergencyInsertResult } from "./emergency-handler";
export { adjustSlotTiming } from "./delay-manager";
export type { DelayAdjustmentResult } from "./delay-manager";
