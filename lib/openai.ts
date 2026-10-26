import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY ?? "";
const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

export const openaiClient = apiKey
  ? new OpenAI({
      apiKey,
      timeout: 20_000,
      maxRetries: 1,
    })
  : null;

export function getOpenAIConfig() {
  return {
    apiKey: apiKey || undefined,
    model,
    available: Boolean(apiKey),
  };
}

export async function askCodeQuestion({
  question,
  code,
  language,
}: {
  question: string;
  code?: string;
  language?: string;
}) {
  if (!openaiClient || !apiKey) {
    return {
      ok: false,
      message: "OpenAI API key is not configured. Set OPENAI_API_KEY and OPENAI_MODEL to enable chat features.",
      skipped: true,
    };
  }

  try {
    const response = await openaiClient.responses.create({
      model,
      input: [
        {
          role: "system",
          content: `You are a helpful coding assistant for ${language ?? "generic code"}. Provide concise guidance and avoid making claims about runtime execution or security guarantees you cannot verify.`,
        },
        ...(code
          ? [{ role: "user", content: `Code context:\n\n${code.slice(0, 12000)}` }]
          : []),
        { role: "user", content: question },
      ],
    });

    const answer = response.output_text ?? "No response generated.";
    return {
      ok: true,
      answer,
      model,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "OpenAI request failed.";
    return {
      ok: false,
      message,
      skipped: false,
    };
  }
}
