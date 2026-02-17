import { NextRequest } from "next/server";
import { jsonResponse, errorResponse } from "@/lib/api-utils";
import { store } from "@/lib/store";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slotId: string }> }
) {
  try {
    const { slotId } = await params;
    const slot = store.slots.getById(slotId);
    if (!slot) {
      return errorResponse("Slot not found", 404);
    }

    const tokensInSlot = store.tokens.getBySlot(slotId);
    const currentToken = tokensInSlot
      .filter((t) => t.status === "in_consultation" || t.status === "allocated")
      .sort((a, b) => a.positionInQueue - b.positionInQueue)[0];
    const waitlistCount = store.waitlist
      .getAll()
      .filter((w) => w.preferredSlotId === slotId && w.status === "waiting").length;

    return jsonResponse({
      currentToken: currentToken?.tokenNumber ?? null,
      estimatedDelay: slot.estimatedDelay,
      remainingTokens: tokensInSlot.filter(
        (t) => !["cancelled", "no_show", "completed"].includes(t.status)
      ).length,
      waitlistCount,
    });
  } catch (e) {
    console.error(e);
    return errorResponse("Internal server error", 500);
  }
}
