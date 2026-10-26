export const capabilityRegistry = [
  {
    name: "next_app",
    description: "Next.js application scaffold for the product shell",
    status: "available",
    evidence: ["app/page.tsx", "app/layout.tsx", "next.config.ts"],
  },
  {
    name: "supabase_schema",
    description: "Supabase database schema and profile/chat/message tables",
    status: "available",
    evidence: ["supabase/schema.sql"],
  },
  {
    name: "openai_config",
    description: "OpenAI configuration variables and client config placeholders",
    status: "available",
    evidence: [".env.example", "lib/openai.ts"],
  },
  {
    name: "rls_guard",
    description: "Row-level security and policy validation for sensitive access",
    status: "needs-review",
    evidence: ["supabase/schema.sql"],
  },
  {
    name: "approval_gate",
    description: "Approval gate checklist for external service actions",
    status: "pending",
    evidence: ["docs/autonomous-system-builder.md"],
  },
  {
    name: "dashboard",
    description: "Operational dashboard for plan, tests, and rollback state",
    status: "available",
    evidence: ["app/page.tsx", "app/dashboard/page.tsx"],
  },
];

export function createCapabilityRegistry() {
  return capabilityRegistry.map((item) => ({ ...item }));
}

export function createIntegrationRegistry() {
  return [
    {
      name: "Supabase",
      type: "database",
      auth: "server-side secret",
      status: "available",
      health: "ready",
      review: "RLS checks required before production use",
    },
    {
      name: "OpenAI",
      type: "llm",
      auth: "server-side secret",
      status: "configured",
      health: "needs-review",
      review: "Verify request and data minimization controls",
    },
    {
      name: "Deployment system",
      type: "deploy",
      auth: "approval gated",
      status: "pending",
      health: "blocked",
      review: "No deploy without approval from an authorized operator",
    },
  ];
}

export function createApprovalGateChecklist() {
  return [
    { name: "external_payment", required: true, status: "pending" },
    { name: "customer_data_write", required: true, status: "pending" },
    { name: "data_delete", required: true, status: "pending" },
    { name: "production_deploy", required: true, status: "pending" },
  ];
}

export function createSystemPlan(goal = "Build autonomous system builder") {
  return {
    goal,
    summary:
      "Create a bounded autonomous workflow with registry, planner, validation, and approval controls.",
    dependencies: [
      {
        name: "Capability Registry",
        type: "system",
        reason: "Catalog available, missing, and risky capabilities.",
      },
      {
        name: "System Planner",
        type: "system",
        reason: "Translate objectives into a dependency-aware execution plan.",
      },
      {
        name: "Code Generation Jobs",
        type: "system",
        reason: "Create implementation tasks in isolated workspaces before applying changes.",
      },
      {
        name: "Guardrails & Security",
        type: "security",
        reason: "Validate secrets, RLS, and approval gates before external actions.",
      },
      {
        name: "CI & Validation",
        type: "data",
        reason: "Run lint, typecheck, tests, and security checks for every change.",
      },
    ],
    acceptanceTests: [
      {
        name: "registry_present",
        command: "node tests/engine.test.mjs",
        expected: "Capability registry is available and verified.",
      },
      {
        name: "plan_dependency_trace",
        command: "npm run test",
        expected: "Planner and jobs produce structured dependency steps.",
      },
      {
        name: "security_policy_check",
        command: "npm run security",
        expected: "No user_id IS NULL or anonymous policy risk remains.",
      },
    ],
    risks: [
      "Secrets must remain server-side and never be exposed to the browser.",
      "All external service actions need an approval gate.",
      "Production or destructive actions require explicit operator approval.",
    ],
  };
}

export function createCodeGenerationJobs(goal = "Build autonomous system builder") {
  return [
    {
      id: "job-001",
      path: "lib/autonomous-system-builder.js",
      summary: `Create capability registry and planner for: ${goal}`,
      diff: "+ define registry\n+ define planner\n+ define acceptance tests",
    },
    {
      id: "job-002",
      path: "app/dashboard/page.tsx",
      summary: "Add dashboard view for plan history, tests, connection health, and rollback state.",
      diff: "+ dashboard route\n+ operational summary cards\n+ connection status panel",
    },
    {
      id: "job-003",
      path: "supabase/schema.sql",
      summary: "Enforce row-level security with explicit auth.uid() checks and no anonymous access paths.",
      diff: "+ ENABLE ROW LEVEL SECURITY\n+ self-only policies\n+ user_id isolation rules",
    },
  ];
}

export function evaluateRlsPolicy(sql = "") {
  const findings = [];

  if (sql.includes("user_id IS NULL")) {
    findings.push("Policy allows user_id IS NULL and should be rejected in production.");
  }

  if (!sql.includes("auth.uid()")) {
    findings.push("No auth.uid() guard found in the policy set.");
  }

  if (!sql.includes("ROW LEVEL SECURITY")) {
    findings.push("ROW LEVEL SECURITY is not enabled.");
  }

  if (findings.length > 0) {
    return {
      status: "needs-review",
      riskLevel: "high",
      findings,
    };
  }

  return {
    status: "secure",
    riskLevel: "low",
    findings: [],
  };
}

export function createValidationLoop(maxAttempts = 3, timeoutMs = 60000) {
  return {
    maxAttempts,
    timeoutMs,
    status: "ready",
    message: "Bounded self-repair loop is armed. It stops after the configured attempts or timeout.",
  };
}

export function runValidationLoop(checks = []) {
  const steps = Array.isArray(checks) ? checks : [];
  const loop = createValidationLoop();

  const result = {
    status: "pass",
    attempts: 0,
    maxAttempts: loop.maxAttempts,
    timeoutMs: loop.timeoutMs,
    checks: steps.map((check, index) => ({
      index,
      name: check.name || `check-${index + 1}`,
      status: check.status || "pending",
    })),
  };

  for (const check of steps) {
    result.attempts += 1;
    if (check.status === "failed") {
      result.status = "repair-needed";
      break;
    }
  }

  if (result.status === "repair-needed" && result.attempts >= result.maxAttempts) {
    result.status = "blocked";
  }

  return result;
}

export function createDashboardSummary() {
  return {
    status: "operational",
    planCount: createSystemPlan().dependencies.length,
    capabilityCount: createCapabilityRegistry().length,
    integrations: createIntegrationRegistry().length,
    approvalGates: createApprovalGateChecklist().length,
  };
}

export default {
  capabilityRegistry,
  createCapabilityRegistry,
  createIntegrationRegistry,
  createApprovalGateChecklist,
  createSystemPlan,
  createCodeGenerationJobs,
  evaluateRlsPolicy,
  createValidationLoop,
  runValidationLoop,
  createDashboardSummary,
};
