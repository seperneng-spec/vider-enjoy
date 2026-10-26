import assert from "node:assert/strict";
import test from "node:test";

import { analyzeCode } from "../lib/engine.ts";

test("returns a clean result for valid TypeScript code", () => {
  const result = analyzeCode({
    code: `const total = (items: number[]) => items.reduce((sum, item) => sum + item, 0);\nconsole.log(total([1, 2, 3]));`,
    language: "typescript",
  });

  assert.equal(result.ok, true);
  assert.equal(result.language, "typescript");
  assert.equal(Array.isArray(result.issues), true);
  assert.equal(typeof result.summary?.totalIssues, "number");
});

test("handles empty code safely", () => {
  const result = analyzeCode({ code: "   ", language: "typescript" });
  assert.equal(result.ok, true);
  assert.equal(result.issues.length, 0);
  assert.ok(Array.isArray(result.recommendations));
});

test("returns an error for invalid input", () => {
  const result = analyzeCode({ code: "" as any, language: "javascript" });
  assert.equal(result.ok, true);
  assert.equal(Array.isArray(result.issues), true);
});

test("detects risky patterns and security issues", () => {
  const result = analyzeCode({
    code: `eval(userInput);\nconsole.log("debug")\nTODO: fix this\n`,
    language: "javascript",
  });

  assert.ok(result.issues.some((issue) => issue.severity === "security"));
  assert.ok(result.issues.some((issue) => issue.rule === "todo-fixme"));
});

test("returns a stable JSON-like structure", () => {
  const result = analyzeCode({
    code: `const a = 1;\nconst b = 2;\nconst sum = a + b;`,
    language: "typescript",
  });

  assert.equal(typeof result.ok, "boolean");
  assert.equal(typeof result.language, "string");
  assert.equal(typeof result.summary?.totalIssues, "number");
  assert.equal(typeof result.recommendations?.[0], "string");
});

test("handles large input defensively", () => {
  const oversizedCode = "const x = 1;\n".repeat(250000);
  const result = analyzeCode({ code: oversizedCode, language: "javascript" });

  assert.equal(result.ok, false);
  assert.ok(String(result.error ?? "").includes("too large"));
});
