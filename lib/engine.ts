export function buildEngineReply(message: string) {
  const trimmed = message.trim();

  if (!trimmed) {
    return "Please provide a message to continue.";
  }

  return `Engine response for: ${trimmed}`;
}

export function createAssistantSummary(messages: string[]) {
  return messages.filter(Boolean).join(" | ");
}
