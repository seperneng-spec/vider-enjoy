import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    status: "ok",
    service: "vider-enjoy",
    timestamp: new Date().toISOString(),
  });
}
