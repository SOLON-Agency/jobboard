import { NextResponse } from "next/server";

/**
 * Standard JSON success response for API route handlers.
 *
 * @pattern ApiResponse
 * @usedBy src/app/api/ route handlers
 * @example
 * ```ts
 * return apiSuccess({ id: newRecord.id });
 * ```
 */
export function apiSuccess<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

/**
 * Standard JSON error response for API route handlers.
 * Logs the raw error server-side and returns a sanitised message to the client.
 *
 * @pattern ApiResponse
 * @usedBy src/app/api/ route handlers
 * @example
 * ```ts
 * return apiError("Utilizatorul nu este autentificat.", 401);
 * ```
 */
export function apiError(message: string, status: number, extra?: Record<string, unknown>): NextResponse {
  return NextResponse.json({ error: message, ...extra }, { status });
}
