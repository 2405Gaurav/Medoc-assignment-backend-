/**
 * Shared API helpers: JSON response, error format, Zod parse.
 */

import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function jsonResponse<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function errorResponse(
  message: string,
  status: number = 400,
  details?: unknown
) {
  return NextResponse.json(
    details != null ? { success: false, error: message, details } : { success: false, error: message },
    { status }
  );
}

export function handleZodError(e: ZodError) {
  return errorResponse(
    "Validation failed",
    400,
    e.errors.map((err) => ({ path: err.path.join("."), message: err.message }))
  );
}
