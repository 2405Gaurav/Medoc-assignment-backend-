/**
 * Priority determination for token sources.
 * Lower number = higher priority.
 * Paid Priority (1) > Follow-up/Online Booking (2) > Walk-in (3).
 * Emergency uses 0 (super priority).
 */

import type { TokenSource } from "@/lib/types";

/** Priority levels: 1 = highest (paid_priority), 2 = follow-up/online_booking, 3 = walk_in */
const SOURCE_PRIORITY: Record<TokenSource, number> = {
  paid_priority: 1,
  follow_up: 2,
  online_booking: 2,
  walk_in: 3,
};

/**
 * Get numeric priority for a token source.
 * @param source - Token source type
 * @returns Priority number (1 = highest, 3 = lowest)
 */
export function getPriorityForSource(source: TokenSource): number {
  return SOURCE_PRIORITY[source];
}

/**
 * Compare two priorities for ordering (ascending = higher priority first).
 * @returns negative if a before b, positive if a after b, 0 if equal
 */
export function comparePriority(priorityA: number, priorityB: number): number {
  return priorityA - priorityB;
}

/**
 * Check if source A has strictly higher priority than source B.
 */
export function hasHigherPriority(sourceA: TokenSource, sourceB: TokenSource): boolean {
  return SOURCE_PRIORITY[sourceA] < SOURCE_PRIORITY[sourceB];
}

/**
 * Emergency super-priority (inserted before all others).
 */
export const EMERGENCY_PRIORITY = 0;
