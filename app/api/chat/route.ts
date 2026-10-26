import { NextResponse } from "next/server";

import { getOpenAIConfig, askCodeQuestion } from "@/lib/openai";

const MAX_MESSAGE_LENGTH = 4000;
const MAX_REQUESTS_PER_MINUTE = 30;
const rateLimit = new Map<string, number[]>();

function trimToSize(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }
  return value.slice(0, maxLength).trim();
}

function enforceRateLimit(ip: string) {
  const now = Date.now();
  const timestamps = rateLimit.get(ip) ?? [];
  const recent = timestamps.filter((timestamp) => now - timestamp < 60_000);

  if (recent.length >= MAX_REQUESTS_PER_MINUTE) {
    return false;
  }

  recent.push(now);
  rateLimit.set(ip, recent);
  return true;
}

export async function POST(request: Request) {
  try {
    const clientIp = request.headers.get("x-forwarded-for") ?? "local";

    if (!enforceRateLimit(clientIp)) {
      return NextResponse.json(
        { ok: false, error: "Too many requests. Please wait a moment and try again." },
        { status: 429 }
      );
    }

    if (!request.headers.get("content-type")?.includes("application/json")) {
      return NextResponse.json(
        { ok: false, error: "Request body must be valid JSON." },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { ok: false, error: "A JSON object is required." },
        { status: 400 }
      );
    }

    const message = typeof body.message === "string" ? body.message : "";
    const language = typeof body.language === "string" ? body.language : "typescript";

    if (!message.trim()) {
      return NextResponse.json(
        { ok: false, error: "A message is required." },
        { status: 400 }
      );
    }

    const safeMessage = trimToSize(message, MAX_MESSAGE_LENGTH);
    const config = getOpenAIConfig();

    if (!config.apiKey) {
      return NextResponse.json(
        {
          ok: false,
          mode: "degraded",
          reply: "OpenAI is not configured. Set OPENAI_API_KEY and OPENAI_MODEL before enabling chat.",
        },
        { status: 503 }
      );
    }

    const reply = await askCodeQuestion({
      question: safeMessage,
      language,
      code: typeof body.code === "string" ? trimToSize(body.code, 12_000) : "",
    });

    if (!reply.ok) {
      return NextResponse.json(
        { ok: false, error: reply.message ?? "Unable to complete the request." },
        { status: 503 }
      );
    }

    return NextResponse.json({ ok: true, reply: reply.answer ?? "No response generated.", model: config.model }, { status: 200 });
  } catch {
    return NextResponse.json(
      { ok: false, error: "An unexpected error occurred while processing the chat request." },
      { status: 500 }
    );
  }
}
