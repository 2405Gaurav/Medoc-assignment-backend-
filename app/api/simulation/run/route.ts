import { NextRequest } from "next/server";
import { z } from "zod";
import { jsonResponse, handleZodError } from "@/lib/api-utils";
import { runSimulation, type Scenario } from "@/lib/simulation/opd-day-simulator";

const BodySchema = z.object({
  scenario: z.enum(["normal_day", "high_load", "with_emergencies"]).default("normal_day"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return handleZodError(parsed.error);
    }

    const result = runSimulation(parsed.data.scenario as Scenario);
    const slots = result.slots;

    return jsonResponse({
      scenario: parsed.data.scenario,
      events: result.events,
      summary: {
        totalAllocated: result.totalAllocated,
        waitlistSize: result.waitlistSize,
        completed: result.completed,
        reallocations: result.reallocations,
        slotCount: slots.length,
      },
      slotUtilization: slots.map((s) => ({
        slotId: s.id,
        occupancy: s.currentOccupancy,
        maxCapacity: s.maxCapacity,
        utilizationPercent: Math.round((s.currentOccupancy / s.maxCapacity) * 100),
      })),
    });
  } catch (e) {
    console.error(e);
    return jsonResponse(
      { success: false, error: String(e) },
      500
    );
  }
}
