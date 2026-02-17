import { NextRequest } from "next/server";
import { jsonResponse, errorResponse } from "@/lib/api-utils";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const doctorId = request.nextUrl.searchParams.get("doctorId") ?? undefined;
    const priorityParam = request.nextUrl.searchParams.get("priority");

    let entries = store.waitlist
      .getAll()
      .filter((w) => w.status === "waiting");

    if (doctorId) {
      entries = entries.filter((w) => w.doctorId === doctorId);
    }
    if (priorityParam != null && priorityParam !== "") {
      const p = parseInt(String(priorityParam), 10);
      if (!Number.isNaN(p)) {
        entries = entries.filter((w) => w.priority === p);
      }
    }

    entries.sort((a, b) => {
      const prio = a.priority - b.priority;
      if (prio !== 0) return prio;
      return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
    });

    return jsonResponse({
      waitlist: entries.map((w) => ({
        id: w.id,
        patientId: w.patientId,
        doctorId: w.doctorId,
        preferredSlotId: w.preferredSlotId,
        tokenSource: w.tokenSource,
        priority: w.priority,
        joinedAt: w.joinedAt,
        patientDetails: w.patientDetails,
      })),
    });
  } catch (e) {
    console.error(e);
    return errorResponse("Internal server error", 500);
  }
}
