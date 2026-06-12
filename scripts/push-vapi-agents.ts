/**
 * Push all 6 agent configurations to Vapi.
 * Usage: VAPI_API_KEY=vapi_xxx npx tsx scripts/push-vapi-agents.ts
 *
 * Creates or updates each assistant by name, then prints env var commands.
 */

import { AGENT_CONFIGS } from "../lib/vapi/agents-config";

const BASE = "https://api.vapi.ai";
const KEY = process.env.VAPI_API_KEY;

if (!KEY) {
  console.error("VAPI_API_KEY is not set. Exiting.");
  process.exit(1);
}

const hdrs = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${KEY}`,
};

async function listAssistants(): Promise<Array<{ id: string; name: string }>> {
  const r = await fetch(`${BASE}/assistant`, { headers: hdrs });
  if (!r.ok) { console.error("listAssistants failed:", await r.text()); return []; }
  const d = await r.json();
  return Array.isArray(d) ? d : (d.results ?? []);
}

async function createAssistant(payload: object): Promise<{ id: string; name: string } | null> {
  const r = await fetch(`${BASE}/assistant`, {
    method: "POST",
    headers: hdrs,
    body: JSON.stringify(payload),
  });
  if (!r.ok) { console.error("createAssistant failed:", await r.text()); return null; }
  return r.json();
}

async function patchAssistant(id: string, payload: object): Promise<{ id: string; name: string } | null> {
  const r = await fetch(`${BASE}/assistant/${id}`, {
    method: "PATCH",
    headers: hdrs,
    body: JSON.stringify(payload),
  });
  if (!r.ok) { console.error("patchAssistant failed:", await r.text()); return null; }
  return r.json();
}

async function main() {
  console.log("Fetching existing Vapi assistants…");
  const existing = await listAssistants();
  const byName = new Map(existing.map(a => [a.name, a.id]));

  const results: Record<string, string> = {};

  for (const [key, config] of Object.entries(AGENT_CONFIGS)) {
    const existingId = byName.get(config.name);
    let result: { id: string; name: string } | null = null;

    if (existingId) {
      console.log(`  PATCH ${config.name} (${existingId})`);
      result = await patchAssistant(existingId, config);
    } else {
      console.log(`  POST  ${config.name} (new)`);
      result = await createAssistant(config);
    }

    if (result) {
      results[key] = result.id;
      console.log(`    ✓ ${config.name}: ${result.id}`);
    } else {
      console.error(`    ✗ ${config.name}: FAILED`);
    }
  }

  console.log("\n── Railway env vars to set ──────────────────────────────");
  for (const [key, id] of Object.entries(results)) {
    console.log(`VAPI_AGENT_${key.toUpperCase()}=${id}`);
  }

  if (results.erin) {
    console.log(`VAPI_ASSISTANT_ID=${results.erin}   ← set this too (default agent)`);
  }

  console.log("────────────────────────────────────────────────────────");
  console.log("Done. Set the env vars above in Railway then redeploy.");
}

main().catch(err => { console.error(err); process.exit(1); });
