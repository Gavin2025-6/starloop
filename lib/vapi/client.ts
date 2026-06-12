// Vapi REST API client — all functions return null gracefully when VAPI_API_KEY is not set

const BASE = "https://api.vapi.ai";

function headers() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.VAPI_API_KEY}`,
  };
}

export function isVapiConfigured() {
  return !!(process.env.VAPI_API_KEY && process.env.VAPI_API_KEY.length > 10);
}

export interface VapiAssistant {
  id: string;
  name: string;
  firstMessage: string;
  model: {
    provider: string;
    model: string;
    systemPrompt: string;
    temperature?: number;
  };
  voice?: { provider: string; voiceId: string };
}

export interface VapiCall {
  id: string;
  type: string;
  status: string;
  startedAt: string | null;
  endedAt: string | null;
  endedReason: string | null;
  customer?: { number: string };
  analysis?: { summary: string | null; successEvaluation: string | null };
  artifact?: { transcript: string | null };
}

export async function getAssistant(assistantId: string): Promise<VapiAssistant | null> {
  if (!isVapiConfigured()) return null;
  try {
    const res = await fetch(`${BASE}/assistant/${assistantId}`, { headers: headers() });
    if (!res.ok) { console.error("[vapi/getAssistant]", res.status, await res.text()); return null; }
    return res.json();
  } catch (err) {
    console.error("[vapi/getAssistant]", err);
    return null;
  }
}

export async function updateAssistant(
  assistantId: string,
  payload: { firstMessage?: string; systemPrompt?: string }
): Promise<VapiAssistant | null> {
  if (!isVapiConfigured()) return null;
  try {
    const body: Record<string, unknown> = {};
    if (payload.firstMessage !== undefined) body.firstMessage = payload.firstMessage;
    if (payload.systemPrompt !== undefined) body.model = { systemPrompt: payload.systemPrompt };

    const res = await fetch(`${BASE}/assistant/${assistantId}`, {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify(body),
    });
    if (!res.ok) { console.error("[vapi/updateAssistant]", res.status, await res.text()); return null; }
    return res.json();
  } catch (err) {
    console.error("[vapi/updateAssistant]", err);
    return null;
  }
}

export async function listCalls(params?: {
  assistantId?: string;
  limit?: number;
}): Promise<VapiCall[]> {
  if (!isVapiConfigured()) return [];
  try {
    const qs = new URLSearchParams();
    if (params?.assistantId) qs.set("assistantId", params.assistantId);
    if (params?.limit) qs.set("limit", String(params.limit));

    const url = `${BASE}/call${qs.toString() ? "?" + qs.toString() : ""}`;
    const res = await fetch(url, { headers: headers() });
    if (!res.ok) { console.error("[vapi/listCalls]", res.status, await res.text()); return []; }
    const data = await res.json();
    // Vapi returns either an array or { results: [...] }
    return Array.isArray(data) ? data : (data.results ?? []);
  } catch (err) {
    console.error("[vapi/listCalls]", err);
    return [];
  }
}
