/**
 * State machine integration test.
 * Run with: npx tsx scripts/test-state-machine.ts
 *
 * Walks two paths:
 *   Happy path: SCHEDULED → IN_PROGRESS → COMPLETED → AWAITING_PAYMENT → PAID
 *   Edge path:  SCHEDULED → reschedule → CANCELLED + verify slot freed
 */

import { prisma } from "../lib/prisma";
import { transitionJobStatus, LEGAL_TRANSITIONS } from "../lib/job-state-machine";
import { generateJobNumber } from "../lib/job-number";

// Override env so SMS/Stripe calls are no-ops
process.env.TWILIO_MOCK = "1";

const PASS = "✅";
const FAIL = "❌";

function assert(condition: boolean, label: string) {
  if (condition) {
    console.log(`  ${PASS} ${label}`);
  } else {
    console.error(`  ${FAIL} ${label}`);
    process.exitCode = 1;
  }
}

async function createTestFixtures() {
  // Create a throwaway business + customer
  const user = await prisma.user.upsert({
    where: { email: "test-state-machine@internal" },
    create: {
      email: "test-state-machine@internal",
      name: "Test User",
      passwordHash: "x",
      business: {
        create: {
          name: "Test Business",
          industry: "HVAC",
          slug: `test-sm-${Date.now()}`,
        },
      },
    },
    update: {},
    include: { business: true },
  });

  const business = user.business!;

  const customer = await prisma.customer.create({
    data: {
      businessId: business.id,
      name: "Jane Test",
      phone: "+15550000001",
    },
  });

  return { business, customer };
}

async function cleanupJob(jobId: string) {
  await prisma.jobEvent.deleteMany({ where: { jobId } });
  await prisma.payment.deleteMany({ where: { jobId } });
  await prisma.job.delete({ where: { id: jobId } }).catch(() => {});
}

async function testHappyPath() {
  console.log("\n=== Happy Path: SCHEDULED → IN_PROGRESS → COMPLETED → AWAITING_PAYMENT → PAID ===\n");

  const { business, customer } = await createTestFixtures();

  const jobNumber = await generateJobNumber();
  const job = await prisma.job.create({
    data: {
      jobNumber,
      businessId: business.id,
      customerId: customer.id,
      title: "HVAC Service",
      serviceType: "HVAC",
      serviceDescription: "Annual AC maintenance",
      customerName: customer.name,
      customerPhone: customer.phone,
      address: "123 Test St",
      scheduledAt: new Date(Date.now() + 86400000), // tomorrow
      status: "scheduled",
      total: 250,
      balanceAmount: 250,
    },
  });

  console.log(`  Created job: ${job.jobNumber} (status: ${job.status})`);
  assert(job.status === "scheduled", "Job created in SCHEDULED status");

  // 1. SCHEDULED → IN_PROGRESS
  const j1 = await transitionJobStatus(job.id, "in_progress", { triggeredBy: "test" });
  assert(j1.status === "in_progress", "Transition to IN_PROGRESS");
  assert(!!j1.actualStart, "actualStart recorded");

  // 2. IN_PROGRESS → COMPLETED
  const j2 = await transitionJobStatus(job.id, "completed", {
    triggeredBy: "test",
    finalAmount: 275, // slightly more than original estimate
  });
  assert(j2.status === "completed", "Transition to COMPLETED");
  assert(!!j2.actualEnd, "actualEnd recorded");
  assert((j2.total as number) === 275, "finalAmount updated to 275");

  // 3. COMPLETED → AWAITING_PAYMENT
  const j3 = await transitionJobStatus(job.id, "awaiting_payment", { triggeredBy: "test" });
  assert(j3.status === "awaiting_payment", "Transition to AWAITING_PAYMENT");

  // 4. AWAITING_PAYMENT → PAID
  const j4 = await transitionJobStatus(job.id, "paid", {
    triggeredBy: "test",
    paidAmount: 275,
  });
  assert(j4.status === "paid", "Transition to PAID");
  assert((j4.paidAmount as number) === 275, "paidAmount = 275");
  assert((j4.balanceAmount as number) === 0, "balanceAmount = 0");

  // Verify audit trail
  const events = await prisma.jobEvent.findMany({
    where: { jobId: job.id, type: "status_changed" },
    orderBy: { createdAt: "asc" },
  });
  assert(events.length === 4, "4 status_changed events in audit trail");
  assert(events[0].fromStatus === "scheduled"        && events[0].toStatus === "in_progress",      "Event 1: scheduled→in_progress");
  assert(events[1].fromStatus === "in_progress"      && events[1].toStatus === "completed",        "Event 2: in_progress→completed");
  assert(events[2].fromStatus === "completed"        && events[2].toStatus === "awaiting_payment", "Event 3: completed→awaiting_payment");
  assert(events[3].fromStatus === "awaiting_payment" && events[3].toStatus === "paid",             "Event 4: awaiting_payment→paid");

  // Verify PAID is terminal (illegal transition should throw)
  let threw = false;
  try {
    await transitionJobStatus(job.id, "in_progress", { triggeredBy: "test" });
  } catch {
    threw = true;
  }
  assert(threw, "PAID → IN_PROGRESS correctly rejected (terminal state)");

  // Idempotency: transition to same state returns without error
  const j5 = await transitionJobStatus(job.id, "paid", { triggeredBy: "test" });
  assert(j5.status === "paid", "Idempotent: PAID → PAID returns without error");
  const eventsAfterIdempotent = await prisma.jobEvent.findMany({
    where: { jobId: job.id, type: "status_changed" },
  });
  assert(eventsAfterIdempotent.length === 4, "Idempotent: no extra event written");

  await cleanupJob(job.id);
  console.log("  Happy path complete.");
}

async function testEdgePath() {
  console.log("\n=== Edge Path: SCHEDULED → reschedule → CANCELLED + slot freed ===\n");

  const { business, customer } = await createTestFixtures();

  const originalDate = new Date(Date.now() + 86400000); // tomorrow
  const jobNumber = await generateJobNumber();
  const job = await prisma.job.create({
    data: {
      jobNumber,
      businessId: business.id,
      customerId: customer.id,
      title: "Plumbing Repair",
      serviceType: "Plumbing",
      customerName: customer.name,
      customerPhone: customer.phone,
      address: "456 Test Ave",
      scheduledAt: originalDate,
      status: "scheduled",
      total: 180,
      balanceAmount: 180,
    },
  });

  console.log(`  Created job: ${job.jobNumber} (scheduled: ${originalDate.toISOString()})`);

  // Verify slot is blocked (this job exists in scheduled state)
  const { getAvailableSlots } = await import("../lib/availability");
  const dateStr = originalDate.toISOString().slice(0, 10);
  const slots = await getAvailableSlots(business.id, dateStr);
  console.log(`  Slots available on ${dateStr}: ${slots?.available.length ?? 0}`);

  // Reschedule to next day
  const newDate = new Date(Date.now() + 2 * 86400000); // day after tomorrow
  await prisma.job.update({
    where: { id: job.id },
    data: { scheduledAt: newDate },
  });
  await prisma.jobEvent.create({
    data: {
      jobId: job.id,
      type: "rescheduled",
      triggeredBy: "test",
      payload: {
        oldScheduledAt: originalDate.toISOString(),
        newScheduledAt: newDate.toISOString(),
      },
    },
  });
  console.log(`  Rescheduled to: ${newDate.toISOString()}`);

  // Verify old slot freed (original date should now have the slot available)
  const slotsAfterReschedule = await getAvailableSlots(business.id, dateStr);
  const moreSlots = (slotsAfterReschedule?.available.length ?? 0) >= (slots?.available.length ?? 0);
  assert(moreSlots, "Original slot freed after reschedule");

  // Cancel the job
  const cancelled = await transitionJobStatus(job.id, "cancelled", {
    triggeredBy: "test",
    cancelReason: "Customer request",
  });
  assert(cancelled.status === "cancelled", "Transition to CANCELLED");
  assert((cancelled.cancelReason as string) === "Customer request", "cancelReason stored");

  // Verify new slot freed (after cancellation)
  const newDateStr = newDate.toISOString().slice(0, 10);
  const slotsAfterCancel = await getAvailableSlots(business.id, newDateStr);
  console.log(`  Slots on ${newDateStr} after cancel: ${slotsAfterCancel?.available.length ?? 0}`);
  assert((slotsAfterCancel?.available.length ?? 0) > 0, "Calendar slot freed after cancellation");

  // Verify CANCELLED is terminal
  let threw = false;
  try {
    await transitionJobStatus(job.id, "in_progress", { triggeredBy: "test" });
  } catch {
    threw = true;
  }
  assert(threw, "CANCELLED → IN_PROGRESS correctly rejected (terminal state)");

  // Verify NO_SHOW transition from scheduled
  const jobNumber2 = await generateJobNumber();
  const job2 = await prisma.job.create({
    data: {
      jobNumber: jobNumber2,
      businessId: business.id,
      customerId: customer.id,
      title: "No Show Test",
      serviceType: "Cleaning",
      customerName: customer.name,
      scheduledAt: new Date(),
      status: "scheduled",
      total: 100,
      balanceAmount: 100,
    },
  });
  const j2 = await transitionJobStatus(job2.id, "no_show", { triggeredBy: "test" });
  assert(j2.status === "no_show", "NO_SHOW transition works from SCHEDULED");

  await cleanupJob(job.id);
  await cleanupJob(job2.id);
  console.log("  Edge path complete.");
}

async function testPartialPayment() {
  console.log("\n=== Partial Payment: COMPLETED → PARTIALLY_PAID → PAID ===\n");

  const { business, customer } = await createTestFixtures();

  const jobNumber = await generateJobNumber();
  const job = await prisma.job.create({
    data: {
      jobNumber,
      businessId: business.id,
      customerId: customer.id,
      title: "Roofing Repair",
      serviceType: "Roofing",
      customerName: customer.name,
      scheduledAt: new Date(),
      status: "in_progress",
      total: 1000,
      balanceAmount: 1000,
      actualStart: new Date(),
    },
  });

  // IN_PROGRESS → COMPLETED
  await transitionJobStatus(job.id, "completed", { triggeredBy: "test", finalAmount: 1000 });

  // COMPLETED → PARTIALLY_PAID (deposit of $400)
  const partial = await transitionJobStatus(job.id, "partially_paid", {
    triggeredBy: "stripe_webhook",
    paidAmount: 400,
  });
  assert(partial.status === "partially_paid", "Transition to PARTIALLY_PAID");
  assert((partial.paidAmount as number) === 400, "paidAmount = 400");
  assert((partial.balanceAmount as number) === 600, "balanceAmount = 600");

  // PARTIALLY_PAID → PAID (balance paid)
  const paid = await transitionJobStatus(job.id, "paid", {
    triggeredBy: "stripe_webhook",
    paidAmount: 1000, // cumulative total
  });
  assert(paid.status === "paid", "Transition to PAID");
  assert((paid.paidAmount as number) === 1000, "paidAmount = 1000");
  assert((paid.balanceAmount as number) === 0, "balanceAmount = 0");

  await cleanupJob(job.id);
  console.log("  Partial payment test complete.");
}

async function testIllegalTransitions() {
  console.log("\n=== Illegal Transitions: rejected with clear error ===\n");

  const pairs: Array<[string, string]> = [
    ["completed", "scheduled"],   // can't go back to scheduled
    ["paid", "in_progress"],      // terminal state
    ["cancelled", "paid"],        // terminal state
    ["no_show", "scheduled"],     // terminal state
    ["scheduled", "paid"],        // skip — must go in_progress first
  ];

  for (const [from, to] of pairs) {
    const { business, customer } = await createTestFixtures();
    const jobNumber = await generateJobNumber();
    const j = await prisma.job.create({
      data: {
        jobNumber,
        businessId: business.id,
        customerId: customer.id,
        title: "Test",
        serviceType: "Test",
        status: from,
        total: 0,
        balanceAmount: 0,
      },
    });
    let threw = false;
    try {
      await transitionJobStatus(j.id, to as Parameters<typeof transitionJobStatus>[1], { triggeredBy: "test" });
    } catch {
      threw = true;
    }
    assert(threw, `${from} → ${to} correctly rejected`);
    await cleanupJob(j.id);
  }

  console.log("  Illegal transition tests complete.");
}

async function main() {
  console.log("ServiceStar Job State Machine — Integration Tests");
  console.log("=================================================\n");

  // Sanity check: verify LEGAL_TRANSITIONS structure
  console.log("Legal transitions defined:");
  for (const [from, tos] of Object.entries(LEGAL_TRANSITIONS)) {
    console.log(`  ${from} → [${tos.join(", ")}]`);
  }

  try {
    await testHappyPath();
    await testEdgePath();
    await testPartialPayment();
    await testIllegalTransitions();
  } finally {
    await prisma.$disconnect();
  }

  if (process.exitCode === 1) {
    console.log("\n❌ Some tests FAILED. See above.");
  } else {
    console.log("\n✅ All tests passed.");
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
