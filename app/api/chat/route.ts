import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const message = typeof body?.message === "string" ? body.message : "Hello from vider-enjoy";

  return NextResponse.json({
    ok: true,
    reply: `Echo: ${message}`,
    timestamp: new Date().toISOString(),
  });
}
