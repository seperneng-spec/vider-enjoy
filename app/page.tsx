"use client";

import { useState } from "react";

export default function HomePage() {
  return (
    <main className="page-shell">
      <section className="panel app-panel" aria-labelledby="app-title">
        <header className="topbar">
          <div>
            <p className="eyebrow">AI Coding Assistant</p>
            <h1 id="app-title">Vider(enjoy)</h1>
          </div>
          <div className="status-pill" aria-label="Application status">
            Ready
          </div>
        </header>

        <CodeAnalyzer />
      </section>
    </main>
  );
}

function CodeAnalyzer() {
  const [language, setLanguage] = useState<"typescript" | "javascript" | "python">("typescript");
  const [code, setCode] = useState<string>(`const greet = (name: string) => {\n  return \`Hello, \${name}!\`;\n};\n\nconsole.log(greet("Vider"));\n`);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    ok: boolean;
    language: string;
    issues: Array<{ severity: string; message: string; line?: number; suggestion?: string }>;
    summary?: { totalIssues: number; severities: Record<string, number> };
    recommendations?: string[];
  } | null>(null);

  async function handleAnalyze() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/engine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language }),
      });

      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        throw new Error(payload?.error || "The engine could not analyze the provided code.");
      }

      setResult(payload);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to analyze the code.");
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="workspace-grid">
      <div className="card">
        <div className="field-group">
          <label htmlFor="language-select">Language</label>
          <select
            id="language-select"
            value={language}
            onChange={(event) => setLanguage(event.target.value as "typescript" | "javascript" | "python")}
            aria-label="Select code language"
          >
            <option value="typescript">TypeScript</option>
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
          </select>
        </div>

        <div className="field-group">
          <label htmlFor="code-input">Code</label>
          <textarea
            id="code-input"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            rows={18}
            spellCheck={false}
            aria-label="Paste or type code to analyze"
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                event.preventDefault();
                void handleAnalyze();
              }
            }}
          />
        </div>

        <div className="actions">
          <button type="button" onClick={() => void handleAnalyze()} disabled={isLoading}>
            {isLoading ? "Analyzing..." : "Analyze code"}
          </button>
          <button type="button" className="secondary" onClick={() => setCode("")}>
            Clear
          </button>
        </div>

        <div aria-live="polite" className="status-block">
          {error ? <p className="error-text">{error}</p> : null}
          {!error && isLoading ? <p className="loading-text">Running static analysis…</p> : null}
        </div>
      </div>

      <div className="card results-card" aria-live="polite">
        <h2>Analysis results</h2>

        {!result && !error && !isLoading ? (
          <p className="muted">No analysis has been run yet.</p>
        ) : null}

        {result ? (
          <>
            <div className="summary-row">
              <span className="summary-label">Language</span>
              <strong>{result.language}</strong>
            </div>
            <div className="summary-row">
              <span className="summary-label">Issues found</span>
              <strong>{result.summary?.totalIssues ?? result.issues.length}</strong>
            </div>

            <div className="severity-list" aria-label="Issue severities">
              {Object.entries(result.summary?.severities ?? {}).map(([severity, count]) => {
                if (count <= 0) return null;
                return (
                  <span key={severity} className={`severity-badge severity-${severity}`}>
                    {severity}: {count}
                  </span>
                );
              })}
            </div>

            <div className="issue-list">
              {result.issues.map((issue, index) => (
                <article key={`${issue.severity}-${index}`} className={`issue-item issue-${issue.severity}`}>
                  <header>
                    <span className={`severity-badge severity-${issue.severity}`}>{issue.severity}</span>
                    {typeof issue.line === "number" ? <span className="line-tag">Line {issue.line}</span> : null}
                  </header>
                  <p>{issue.message}</p>
                  {issue.suggestion ? <p className="suggestion">Suggestion: {issue.suggestion}</p> : null}
                </article>
              ))}
            </div>

            {result.recommendations && result.recommendations.length > 0 ? (
              <div className="recommendations">
                <h3>Recommended fixes</h3>
                <ul>
                  {result.recommendations.map((item, idx) => (
                    <li key={`${item}-${idx}`}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}

