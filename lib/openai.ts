export const openaiClient = {
  apiKey: process.env.OPENAI_API_KEY ?? "",
  model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
};

export function getOpenAIConfig() {
  return {
    apiKey: openaiClient.apiKey,
    model: openaiClient.model,
  };
}
