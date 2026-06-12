// Vapi assistant IDs — set these Railway env vars after running the setup:
// POST /api/vapi/setup-agents  (requires VAPI_API_KEY)
// Then copy the returned IDs into Railway Variables.

export const VAPI_AGENTS = {
  erin:   process.env.VAPI_AGENT_ERIN   ?? "",
  dwight: process.env.VAPI_AGENT_DWIGHT ?? "",
  jim:    process.env.VAPI_AGENT_JIM    ?? "",
  angela: process.env.VAPI_AGENT_ANGELA ?? "",
  oscar:  process.env.VAPI_AGENT_OSCAR  ?? "",
  andy:   process.env.VAPI_AGENT_ANDY   ?? "",
};

export type AgentKey = keyof typeof VAPI_AGENTS;
