const assert = require("assert");
const { createAuditForProspect, executeAction, planActions } = require("../src/automation-engine");
const { getFounderBrief, getProspects, markProspectSent } = require("../src/prospects");

const actions = planActions();
assert(actions.length > 0, "Expected action planner to create demo actions.");
assert(actions.some((action) => action.type === "recovery_call"), "Expected recovery action.");
assert(actions.some((action) => action.type === "publish_proof_asset"), "Expected proof asset action.");

const approvalAction = actions.find((action) => action.approvalRequired);
assert(approvalAction, "Expected at least one action requiring approval.");

const blocked = executeAction(approvalAction);
assert.strictEqual(blocked.ok, false, "Unapproved sensitive action should not execute.");

const audit = createAuditForProspect({
  businessName: "Sparkle Home Cleaning",
  industry: "Cleaning",
  city: "Toronto",
});
assert(audit.findings.length >= 3, "Expected audit findings.");
assert(audit.outreachDraft.includes("Sparkle Home Cleaning"), "Expected personalized outreach draft.");

const prospects = getProspects();
assert(prospects.length >= 4, "Expected founder GTM prospects.");
const firstProspect = markProspectSent(prospects[0].id);
assert.strictEqual(firstProspect.sent, true, "Expected prospect sent state to update.");
assert(getFounderBrief().sent >= 1, "Expected founder brief to reflect sent outreach.");

console.log("Proofline smoke test passed.");
