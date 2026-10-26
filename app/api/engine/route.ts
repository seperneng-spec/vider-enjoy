import { NextResponse } from "next/server";

import { analyzeCode } from "@/lib/engine";

const MAX_CODE_LENGTH = 200000;

export async function POST(request: Request) {
  try {
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

    const code = typeof body.code === "string" ? body.code : "";
    const languageInput = typeof body.language === "string" ? body.language : "typescript";

    if (!code.trim()) {
      return NextResponse.json(
        { ok: false, error: "Code content is required for analysis." },
        { status: 400 }
      );
    }

    if (code.length > MAX_CODE_LENGTH) {
      return NextResponse.json(
        { ok: false, error: `Code length exceeds the maximum supported size of ${MAX_CODE_LENGTH} characters.` },
        { status: 413 }
      );
    }

    const result = analyzeCode({ code, language: languageInput });
    if (!result.ok) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch {
    return NextResponse.json(
      { ok: false, error: "An internal error occurred while analyzing the code." },
      { status: 500 }
    );
  }
}
