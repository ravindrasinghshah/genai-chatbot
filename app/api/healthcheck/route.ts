/**
 * API layer for healthcheck
 * GET /api/healthcheck - check if the API is working
 */

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
    return NextResponse.json({ status: "ok", timestamp: new Date().toISOString() });
}
