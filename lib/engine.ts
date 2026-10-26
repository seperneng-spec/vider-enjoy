export type IssueSeverity = "info" | "warning" | "error" | "security";

export type EngineIssue = {
  id: string;
  severity: IssueSeverity;
  message: string;
  line?: number;
  column?: number;
  rule: string;
  suggestion?: string;
};

export type AnalyzeCodeInput = {
  code: string;
  language?: string;
};

const MAX_CODE_LENGTH = 200000;

export function detectLanguage(code: string, preferred?: string) {
  const normalized = (preferred ?? "").toLowerCase();
  if (normalized === "typescript" || normalized === "javascript" || normalized === "python") {
    return normalized;
  }

  const pythonish = /\b(def |import |from |if __name__ == ["']__main__["']|print\()/.test(code);
  if (pythonish) return "python";

  const tsish = /:\s*(string|number|boolean|unknown|Record<|Promise<|interface |type )/.test(code);
  if (tsish) return "typescript";

  const jsish = /const\s+\w+\s*=\s*|function\s+\w+\s*\(|=>\s*\{|console\.log\(/.test(code);
  if (jsish) return "javascript";

  return "typescript";
}

function findLineNumber(code: string, index: number) {
  return code.slice(0, index).split(/\r?\n/).length;
}

function buildIssue(severity: IssueSeverity, message: string, line: number | undefined, rule: string, suggestion?: string): EngineIssue {
  return {
    id: `${severity}-${line ?? "line"}-${rule}`,
    severity,
    message,
    line,
    rule,
    suggestion,
  };
}

export function analyzeCode({ code, language }: AnalyzeCodeInput) {
  const input = typeof code === "string" ? code : "";
  const safeCode = input.trim();
  const detectedLanguage = detectLanguage(safeCode, language);

  if (!safeCode) {
    return {
      ok: true,
      language: detectedLanguage,
      issues: [],
      recommendations: ["Add the code you want analyzed to begin static review."],
      summary: {
        totalIssues: 0,
        severities: { info: 0, warning: 0, error: 0, security: 0 },
      },
    };
  }

  if (safeCode.length > MAX_CODE_LENGTH) {
    return {
      ok: false,
      error: `Code is too large for safe static analysis. Maximum supported length is ${MAX_CODE_LENGTH} characters.`,
      language: detectedLanguage,
    };
  }

  const issues: EngineIssue[] = [];
  const lines = safeCode.split(/\r?\n/);

  if (/[<>]/.test(safeCode) && /innerHTML|outerHTML|insertAdjacentHTML/.test(safeCode)) {
    issues.push(buildIssue("security", "Direct HTML injection patterns detected using innerHTML or similar APIs.", undefined, "unsafe-dom-injection", "Prefer safe DOM APIs or sanitization before rendering untrusted content."));
  }

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmedLine = line.trim();

    if (!trimmedLine) continue;

    if (/\bTODO\b|\bFIXME\b/i.test(trimmedLine)) {
      issues.push(buildIssue("warning", "Inline TODO/FIXME marker found and should be reviewed before release.", index + 1, "todo-fixme", "Replace or resolve this marker before shipping."));
    }

    if (/\bdebugger\b/i.test(trimmedLine)) {
      issues.push(buildIssue("warning", "Debugger statement found in code; it can remain in development builds but should be removed before release.", index + 1, "debugger-statement", "Remove the debugger statement before production deployment."));
    }

    if (/\beval\s*\(|\bFunction\s*\(|\bexec\s*\(/i.test(trimmedLine)) {
      issues.push(buildIssue("security", "Dynamic code execution detected; this pattern can be unsafe if input is untrusted.", index + 1, "dynamic-execution", "Avoid dynamic code execution and prefer explicit logic or validated parsing."));
    }

    if (/\bconsole\.log\s*\(/i.test(trimmedLine)) {
      issues.push(buildIssue("info", "Console output is present; consider removing or guarding debug logging in production.", index + 1, "debug-logging", "Use structured logging with environment-aware guards instead of unconditional console output."));
    }

    if (trimmedLine.includes("=") && trimmedLine.includes("null") && !trimmedLine.includes("===") && !trimmedLine.includes("!==")) {
      issues.push(buildIssue("warning", "Loose null comparison pattern detected; prefer strict equality checks.", index + 1, "loose-equality", "Use === or !== to avoid implicit coercion."));
    }
  }

  const braces = ((safeCode.match(/\{/g) ?? []).length) - ((safeCode.match(/\}/g) ?? []).length);
  const parens = ((safeCode.match(/\(/g) ?? []).length) - ((safeCode.match(/\)/g) ?? []).length);
  const brackets = ((safeCode.match(/\[/g) ?? []).length) - ((safeCode.match(/\]/g) ?? []).length);

  if (braces !== 0 || parens !== 0 || brackets !== 0) {
    const unmatchedLine = findLineNumber(safeCode, Math.min(safeCode.length - 1, safeCode.length - 1));
    issues.push(buildIssue("error", "There appears to be an unmatched delimiter in the code block.", unmatchedLine, "unbalanced-delimiters", "Check bracket, parenthesis, and brace balance before shipping."));
  }

  if (detectedLanguage === "python" && /\bopen\s*\(/i.test(safeCode)) {
    issues.push(buildIssue("warning", "File system access is present; review file paths and permissions before use.", undefined, "file-io", "Validate file paths and permissions when reading or writing external files."));
  }

  const dedupedIssues = issues.filter((issue, index, arr) => arr.findIndex((candidate) => candidate.rule === issue.rule && candidate.line === issue.line && candidate.message === issue.message) === index);

  const severities = { info: 0, warning: 0, error: 0, security: 0 };
  for (const issue of dedupedIssues) {
    severities[issue.severity] += 1;
  }

  const recommendations = dedupedIssues
    .filter((issue) => issue.suggestion)
    .map((issue) => issue.suggestion as string)
    .slice(0, 5);

  return {
    ok: true,
    language: detectedLanguage,
    issues: dedupedIssues,
    recommendations: recommendations.length > 0 ? recommendations : ["No critical issues were detected by static heuristics in the supplied source."],
    summary: {
      totalIssues: dedupedIssues.length,
      severities,
    },
  };
}
