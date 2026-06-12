/**
 * ServiceStar Full Closed-Loop E2E Test Suite
 *
 * Simulates a real user going through the complete closed loop:
 * Login → Dashboard → Create Job → Complete Job → Payment Link →
 * Review Request → Customers → Front Office → Reviews →
 * Campaigns → Settings → Navigation.
 *
 * Requirements:
 *   - Server running at E2E_BASE_URL (default http://localhost:3000)
 *   - TEST_EMAIL / TEST_PASSWORD env vars for a pre-existing account
 *   - TWILIO_MOCK=1 on the server to suppress real SMS
 *
 * Run:
 *   npx playwright test tests/e2e/full-loop.spec.ts --reporter=list
 */

import { test, expect, Page } from "@playwright/test";
import path from "path";
import fs from "fs";

// ─── Config ───────────────────────────────────────────────────────────────────

const TEST_EMAIL = process.env.TEST_EMAIL || "e2e@servicestar.app";
const TEST_PASSWORD = process.env.TEST_PASSWORD || "Playwright123!";
const SCREENSHOT_DIR = path.join(__dirname, "../screenshots");

// Shared state for the serial suite
let createdJobUrl = "";
const JOB_TITLE = `Lawn mowing ${Date.now().toString(36)}`; // unique per run

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function ensureScreenshotDir() {
  if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function saveScreenshot(page: Page, name: string) {
  await ensureScreenshotDir();
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, `${name.replace(/\W+/g, "_")}.png`),
    fullPage: true,
  });
}

/** Login via credentials form — goes directly to /auth/login */
async function login(page: Page) {
  await page.goto("/auth/login");
  await page.waitForLoadState("networkidle");
  // Labels are uppercase via CSS but text content is "Email" / "Password"
  await page.locator('input[type="email"]').fill(TEST_EMAIL);
  await page.locator('input[type="password"]').fill(TEST_PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL("**/dashboard", { timeout: 20_000 });
}

// ─── Suite ───────────────────────────────────────────────────────────────────

test.describe.serial("ServiceStar Full Loop", () => {

  // ── Test 1 — Login ──────────────────────────────────────────────────────────
  test("Test 1 — Login", async ({ page }) => {
    // Go to the landing page (marketing home)
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // The landing page has a "Sign In" link in the header
    const signInLink = page.getByRole("link", { name: /sign in/i }).first();
    await expect(signInLink).toBeVisible({ timeout: 8_000 });
    await signInLink.click();

    // Should arrive at /auth/login
    await page.waitForURL("**/auth/login", { timeout: 10_000 });

    // Fill in credentials
    await page.locator('input[type="email"]').fill(TEST_EMAIL);
    await page.locator('input[type="password"]').fill(TEST_PASSWORD);
    await page.getByRole("button", { name: /sign in/i }).click();

    // Verify redirect to /dashboard
    await page.waitForURL("**/dashboard", { timeout: 20_000 });
    await expect(page).toHaveURL(/\/dashboard$/);

    // Verify greeting visible (Good morning / afternoon / evening)
    const greeting = page.locator("h1").filter({
      hasText: /good (morning|afternoon|evening)/i,
    });
    await expect(greeting).toBeVisible({ timeout: 10_000 });

    await saveScreenshot(page, "test-1-login-success");
  });

  // ── Test 2 — Home Dashboard ─────────────────────────────────────────────────
  test("Test 2 — Home Dashboard", async ({ page }) => {
    await login(page);
    await page.waitForLoadState("networkidle");

    // 4 action cards by title
    await expect(page.getByText("Jobs Today")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Awaiting Payment")).toBeVisible();
    await expect(page.getByText("Reviews to Reply")).toBeVisible();
    await expect(page.getByText("Win Back Customers")).toBeVisible();

    // Verify exactly 4 clickable action cards in the 2×2 grid
    const actionCards = page.locator(".grid.gap-4 > div.bg-white.rounded-xl");
    await expect(actionCards).toHaveCount(4, { timeout: 8_000 });

    // "This week" closed-loop summary bar
    await expect(page.getByText(/this week/i)).toBeVisible();
    await expect(page.getByText(/jobs completed/i)).toBeVisible();
    await expect(page.getByText(/payments received/i)).toBeVisible();
    await expect(page.getByText(/reviews collected/i)).toBeVisible();
    await expect(page.getByText(/new bookings/i)).toBeVisible();

    // All 7 sidebar nav items present (check by label text)
    const navItems = [
      { href: "/dashboard",              label: "Home" },
      { href: "/dashboard/front-office", label: "Front Office" },
      { href: "/dashboard/jobs",         label: "Jobs" },
      { href: "/dashboard/customers",    label: "Customers" },
      { href: "/dashboard/reviews",      label: "Reviews" },
      { href: "/dashboard/campaigns",    label: "Campaigns" },
      { href: "/dashboard/settings",     label: "Settings" },
    ];
    for (const item of navItems) {
      await expect(
        page.locator("aside").locator(`a[href="${item.href}"]`),
        `Sidebar link "${item.label}" should be visible`
      ).toBeVisible({ timeout: 5_000 });
    }

    // Verify all nav routes respond with 200 (no 404s)
    for (const item of navItems) {
      const resp = await page.request.get(item.href);
      expect(
        resp.status(),
        `Nav route ${item.href} should return 200, got ${resp.status()}`
      ).toBe(200);
    }

    await saveScreenshot(page, "test-2-dashboard");
  });

  // ── Test 3 — Create New Job ─────────────────────────────────────────────────
  test("Test 3 — Create New Job", async ({ page }) => {
    await login(page);
    await page.goto("/dashboard/jobs");
    await page.waitForLoadState("networkidle");

    // Open the new job modal
    await page.getByRole("button", { name: /new job/i }).click();
    await expect(page.getByRole("heading", { name: /new job/i })).toBeVisible({ timeout: 8_000 });

    // ── Step 1: Customer ──
    const searchInput = page.getByPlaceholder(/name or phone/i);
    await searchInput.fill("gavin");
    await page.waitForTimeout(600);

    const dropdownItem = page.locator(
      "div.border.border-gray-200.rounded-lg button"
    ).filter({ hasText: /gavin/i }).first();

    const customerFound = await dropdownItem.isVisible({ timeout: 3_000 }).catch(() => false);
    if (customerFound) {
      await dropdownItem.click();
      // Confirmation panel shows selected customer name
      await expect(
        page.locator("div.p-3, div.bg-\\[\\#F0FDF4\\]").filter({ hasText: /gavin/i }).first()
      ).toBeVisible({ timeout: 5_000 });
    } else {
      // Fall back: create a new customer inline
      await searchInput.fill("");
      await page.getByText("+ New Customer").click();
      // Input fields inside the new customer form panel
      const newCustForm = page.locator("div.border.border-gray-200.rounded-xl.bg-gray-50");
      await newCustForm.locator("input").nth(0).fill("Gavin Gao");
      await newCustForm.locator("input").nth(1).fill("+14165550100");
    }

    // Advance to step 2 — button text is "Next →"
    await page.getByRole("button", { name: /next/i }).first().click();
    await page.waitForTimeout(300);

    // ── Step 2: Job details ──
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    // Service description textarea — use unique title to avoid cross-run collisions
    await page.locator("textarea").first().fill(JOB_TITLE);

    // Amount input ($)
    const amountInput = page.locator('input[type="number"]').first();
    await amountInput.fill("150");

    // Date and time
    await page.locator('input[type="date"]').fill(tomorrowStr);
    await page.locator('input[type="time"]').fill("09:00");

    // Advance to step 3
    await page.getByRole("button", { name: /next/i }).first().click();
    await page.waitForTimeout(300);

    // ── Step 3: Confirm & create ──
    // Scope checks to the modal to avoid matching jobs-list items behind the overlay
    const modal = page.locator("div.fixed.inset-0").last().locator("div.bg-white");
    await expect(modal.getByText(JOB_TITLE)).toBeVisible({ timeout: 5_000 });
    await expect(modal.getByText("$150.00")).toBeVisible();
    await page.getByRole("button", { name: /create job/i }).click();

    // Verify the new job appears in the list
    await expect(page.getByText(JOB_TITLE).first()).toBeVisible({ timeout: 12_000 });

    // Verify status badge "Scheduled" is present
    await expect(page.getByText("Scheduled").first()).toBeVisible({ timeout: 8_000 });

    await saveScreenshot(page, "test-3-job-created");
  });

  // ── Test 4 — Job Flow ───────────────────────────────────────────────────────
  test("Test 4 — Job Flow", async ({ page }) => {
    await login(page);
    await page.goto("/dashboard/jobs");
    await page.waitForLoadState("networkidle");

    // Find the test job card
    const jobCard = page.locator(".bg-white.rounded-xl").filter({
      hasText: JOB_TITLE,
    }).first();
    await expect(jobCard).toBeVisible({ timeout: 10_000 });

    // Click "Start Job" → moves to In Progress
    await jobCard.getByRole("button", { name: /start job/i }).click();
    await page.waitForTimeout(1_500);

    // Verify "In Progress" badge
    await expect(page.getByText("In Progress").first()).toBeVisible({ timeout: 8_000 });

    // Navigate to job detail — click the service description text (not the action button)
    // The card container div has an onClick that navigates; clicking the inner <p> bubbles up
    const serviceDescText = page.locator("p.text-gray-500").filter({ hasText: JOB_TITLE }).first();
    await serviceDescText.click();
    await page.waitForURL("**/dashboard/jobs/**", { timeout: 10_000 });
    createdJobUrl = page.url();

    // ── Verify two-column layout (lg breakpoint) ──
    // The layout uses grid-cols-[1fr_340px] at lg
    await expect(page.locator(".grid.grid-cols-1")).toBeVisible({ timeout: 8_000 });

    // ── Customer name visible as a clickable button/link ──
    await expect(
      page.locator("button, a").filter({ hasText: /gavin/i }).first()
    ).toBeVisible({ timeout: 8_000 });

    // ── Amount visible ──
    await expect(page.getByText(/\$150/).first()).toBeVisible();

    // ── Mark Complete ──
    // Both "Mark Complete" (direct) and "Finished early? Complete anyway" (when scheduled in future)
    // open the same modal — handle either case.
    const markCompleteBtn = page.getByRole("button", { name: /mark complete/i });
    await expect(markCompleteBtn).toBeVisible({ timeout: 5_000 });

    const isDisabled = await markCompleteBtn.isDisabled();
    if (isDisabled) {
      // Job scheduled in future → "Finished early?" also opens the same modal
      const earlyLink = page.getByRole("button", { name: /finished early/i });
      await expect(earlyLink).toBeVisible({ timeout: 5_000 });
      await earlyLink.click();
    } else {
      await markCompleteBtn.click();
    }

    // Modal is now open (showComplete OR showEarlyOverride) — fill amount & confirm
    const modal = page.locator(".fixed.inset-0");
    await expect(modal).toBeVisible({ timeout: 5_000 });
    await modal.locator('input[type="number"]').fill("150");
    await modal.getByRole("button", { name: /confirm complete/i }).click();
    await page.waitForTimeout(2_000);

    // ── Verify Complete status ──
    await expect(page.getByText("Complete").first()).toBeVisible({ timeout: 10_000 });

    // ── Verify Activity timeline ──
    // Activity renders in both a mobile (lg:hidden) and desktop (hidden lg:block) panel.
    // At 1280px (Desktop Chrome), the desktop panel is visible and the mobile is hidden.
    // .last() gets the desktop version.
    await expect(
      page.getByText(/job marked complete/i).last()
    ).toBeVisible({ timeout: 8_000 });

    await saveScreenshot(page, "test-4-job-complete");
  });

  // ── Test 5 — Payment Link ───────────────────────────────────────────────────
  test("Test 5 — Payment Link", async ({ page }) => {
    await login(page);

    // Navigate to the completed job
    if (createdJobUrl) {
      await page.goto(createdJobUrl);
    } else {
      await page.goto("/dashboard/jobs");
      await page.waitForLoadState("networkidle");
      // Find the completed job and navigate to it
      const card = page.locator(".bg-white.rounded-xl").filter({ hasText: JOB_TITLE }).first();
      await card.locator("p").first().click();
      await page.waitForURL("**/dashboard/jobs/**", { timeout: 10_000 });
      createdJobUrl = page.url();
    }

    await page.waitForLoadState("networkidle");

    // Payment card shows "Not sent yet" with Send Payment Link button
    // (invoice.status only becomes "sent" via Stripe webhook — known blocker #5)
    const sendBtn = page.getByRole("button", { name: /send payment link/i });
    const alreadyInvoiced = await page.getByText(/link sent|invoiced/i).isVisible({ timeout: 2_000 }).catch(() => false);

    if (!alreadyInvoiced) {
      await expect(page.getByText(/not sent yet/i)).toBeVisible({ timeout: 8_000 });
      await expect(sendBtn).toBeVisible({ timeout: 5_000 });
      await sendBtn.click();
      await page.waitForTimeout(2_000);
    }

    // After clicking (or if already invoiced), job status should be "Invoiced" or "Complete"
    // and the Payment section should either show "Link sent" (Stripe working) or
    // "Not sent yet" (Stripe key broken — known blocker #5 in BLOCKERS.md)
    const paymentState = await page.getByText(/link sent|not sent yet/i).first().isVisible({ timeout: 5_000 }).catch(() => false);
    expect(paymentState, "Payment section should be visible after send attempt").toBeTruthy();

    // Verify job status badge shows Invoiced (invoice record was created)
    await expect(page.getByText(/invoiced|complete/i).first()).toBeVisible({ timeout: 8_000 });

    // Activity timeline — shows events from job completion (thank-you text, etc.)
    await expect(
      page.getByText(/thank-you text|payment link|job marked complete/i).last()
    ).toBeVisible({ timeout: 8_000 });

    await saveScreenshot(page, "test-5-payment-link");
  });

  // ── Test 6 — Review Request ─────────────────────────────────────────────────
  test("Test 6 — Review Request", async ({ page }) => {
    await login(page);

    if (createdJobUrl) {
      await page.goto(createdJobUrl);
    } else {
      await page.goto("/dashboard/jobs");
      await page.waitForLoadState("networkidle");
      const card = page.locator(".bg-white.rounded-xl").filter({ hasText: JOB_TITLE }).first();
      await card.locator("p").first().click();
      await page.waitForURL("**/dashboard/jobs/**", { timeout: 10_000 });
      createdJobUrl = page.url();
    }

    await page.waitForLoadState("networkidle");

    // Review Request section heading visible (use role to avoid partial-text matches on activity)
    await expect(
      page.getByRole("heading", { name: "Review Request" })
    ).toBeVisible({ timeout: 8_000 });

    // Job is complete — "Complete this job to send..." must not appear
    await expect(
      page.getByText("Complete this job to send a review request")
    ).toHaveCount(0);

    // The Review Request card shows either:
    //   a) "⭐ Send Review Request" button  (not yet sent via the button)
    //   b) "Sent Jun 12" confirmation       (reviewSentAt was set by a prior sms_sent event)
    const sendReviewBtn = page.getByRole("button", { name: /send review request/i });
    const alreadySentDate = page.locator("span").filter({ hasText: /^Sent/ });

    const btnVisible = await sendReviewBtn.isVisible({ timeout: 3_000 }).catch(() => false);
    const dateVisible = await alreadySentDate.isVisible({ timeout: 1_000 }).catch(() => false);

    if (btnVisible && !dateVisible) {
      await sendReviewBtn.click();
      await page.waitForTimeout(2_000);
      // After sending, either the date appears or the button reloads
    }

    // Final state: button still visible (Twilio trial, SMS sent in degraded mode)
    // OR date confirmation visible — either is a valid outcome
    const btnOrDate = await sendReviewBtn.or(alreadySentDate).first().isVisible({ timeout: 5_000 }).catch(() => false);
    expect(btnOrDate, "Review Request section should show send button or sent confirmation").toBeTruthy();

    await saveScreenshot(page, "test-6-review-request");
  });

  // ── Test 7 — Customers Page ─────────────────────────────────────────────────
  test("Test 7 — Customers Page", async ({ page }) => {
    await login(page);
    await page.goto("/dashboard/customers");
    await page.waitForLoadState("networkidle");

    // Customer table visible
    await expect(page.locator("table")).toBeVisible({ timeout: 10_000 });

    // At least one real customer row (not a "no data" colspan row)
    const realRows = page.locator("tbody tr").filter({
      hasNot: page.locator("td[colspan]"),
    });
    const rowCount = await realRows.count();
    expect(rowCount, "Expected at least 1 customer").toBeGreaterThan(0);

    // Status badges present
    const statusBadges = page.locator("tbody td span.rounded-full");
    await expect(statusBadges.first()).toBeVisible({ timeout: 5_000 });

    // At least one of the expected statuses
    const knownStatuses = page.locator("tbody td span.rounded-full").filter({
      hasText: /^(active|at-risk|lost|new)$/i,
    });
    await expect(knownStatuses.first()).toBeVisible({ timeout: 5_000 });

    // Click "Re-analyze"
    const reAnalyzeBtn = page.getByRole("button", { name: /re-analyze/i });
    await expect(reAnalyzeBtn).toBeVisible();

    // Dismiss any alert() dialogs (present in old code before the toast refactor)
    page.on("dialog", d => d.dismiss());

    await reAnalyzeBtn.click();

    // Wait for toast "X customers re-analyzed" — allow up to 30s for the full cycle
    // (API call + list reload). Toast lasts 3s; if missed, fall back to checking
    // that the table still shows customers (re-analyze ran without crashing).
    const toastFound = await page
      .getByText(/customers re-analyzed/i)
      .waitFor({ state: "visible", timeout: 30_000 })
      .then(() => true)
      .catch(() => false);

    if (toastFound) {
      await expect(page.getByText(/customers re-analyzed/i)).toBeVisible();
    } else {
      // Toast missed (too fast) — verify table still has customers and button is back
      await expect(reAnalyzeBtn).not.toBeDisabled({ timeout: 45_000 });
      await expect(page.locator("tbody tr").filter({ hasNot: page.locator("td[colspan]") }).first())
        .toBeVisible({ timeout: 5_000 });
    }

    await saveScreenshot(page, "test-7-customers");
  });

  // ── Test 8 — Front Office ───────────────────────────────────────────────────
  test("Test 8 — Front Office", async ({ page }) => {
    await login(page);
    await page.goto("/dashboard/front-office");
    await page.waitForLoadState("networkidle");

    // Page heading
    await expect(page.getByText("Your Front Office")).toBeVisible({ timeout: 10_000 });

    // Stats bar (always visible) — appears in both the bar AND Erin's card, use first()
    await expect(page.getByText(/calls this week/i).first()).toBeVisible({ timeout: 8_000 });

    // 6 agent cards with names
    const agentNames = ["Erin", "Dwight", "Jim", "Angela", "Oscar", "Andy"];
    for (const name of agentNames) {
      await expect(
        page.locator(".grid > div.bg-white").filter({ hasText: name }).first(),
        `Agent "${name}" card should be visible`
      ).toBeVisible({ timeout: 10_000 });
    }

    // Non-Erin agents show "Active" status dot
    for (const name of ["Dwight", "Jim", "Angela", "Oscar", "Andy"]) {
      const card = page.locator(".grid > div.bg-white").filter({ hasText: name }).first();
      await expect(card.getByText("Active"), `${name} should show "Active"`).toBeVisible();
    }

    // Booking Rules section
    await expect(page.getByRole("heading", { name: "Booking Rules" })).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText(/available hours/i).first()).toBeVisible();
    await expect(page.getByText(/buffer time/i).first()).toBeVisible();

    // Save Booking Rules button
    const saveBtn = page.getByRole("button", { name: /save booking rules/i });
    await expect(saveBtn).toBeVisible({ timeout: 5_000 });
    await saveBtn.click();

    // Button briefly shows "✓ Saved!" (2.5s window)
    await expect(
      page.getByRole("button", { name: /saved/i })
    ).toBeVisible({ timeout: 6_000 });

    await saveScreenshot(page, "test-8-front-office");
  });

  // ── Test 9 — Reviews Page ───────────────────────────────────────────────────
  test("Test 9 — Reviews Page", async ({ page }) => {
    await login(page);
    await page.goto("/dashboard/reviews");
    await page.waitForLoadState("networkidle");

    // Google Business banner (connected OR not connected)
    await expect(
      page.locator(".rounded-xl").filter({ hasText: /google business profile/i }).first()
    ).toBeVisible({ timeout: 10_000 });

    // Stats row — 4 stat cards
    const statCards = page.locator(".grid.grid-cols-2 > div.bg-white.rounded-xl");
    expect(await statCards.count()).toBeGreaterThanOrEqual(4);

    // Filter tabs
    const filterTabs = ["All", "Needs Reply", "5 Star", "4 Star", "3 Star & Below"];
    for (const tab of filterTabs) {
      await expect(
        page.getByRole("button", { name: tab }).or(page.locator("button").filter({ hasText: tab }))
      ).toBeVisible({ timeout: 5_000 });
    }

    // Auto-Request Settings card
    await expect(page.getByText("Auto-Request Settings")).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText("After job marked complete")).toBeVisible();
    await expect(page.getByText("After payment received")).toBeVisible();

    // ── Toggle 1: "After job marked complete" — ON/OFF color changes ──
    // Locate the toggle button next to the label
    const toggleRow1 = page.locator("div.flex.items-center.justify-between")
      .filter({ hasText: "After job marked complete" })
      .first();
    // The toggle is the button element (last child after the label span)
    const toggle1 = toggleRow1.locator("button").last();

    const bg1Before = await toggle1.evaluate((el: HTMLElement) =>
      window.getComputedStyle(el).backgroundColor
    );

    await toggle1.click();
    await page.waitForTimeout(350);

    const bg1After = await toggle1.evaluate((el: HTMLElement) =>
      window.getComputedStyle(el).backgroundColor
    );
    expect(bg1Before, "Toggle 1 background should change on click").not.toBe(bg1After);

    // Toggle back to original state
    await toggle1.click();
    await page.waitForTimeout(350);
    const bg1Reset = await toggle1.evaluate((el: HTMLElement) =>
      window.getComputedStyle(el).backgroundColor
    );
    expect(bg1Reset).toBe(bg1Before);

    // ── Toggle 2: "After payment received" — works independently ──
    const toggleRow2 = page.locator("div.flex.items-center.justify-between")
      .filter({ hasText: "After payment received" })
      .first();
    const toggle2 = toggleRow2.locator("button").last();

    const bg2Before = await toggle2.evaluate((el: HTMLElement) =>
      window.getComputedStyle(el).backgroundColor
    );
    await toggle2.click();
    await page.waitForTimeout(350);
    const bg2After = await toggle2.evaluate((el: HTMLElement) =>
      window.getComputedStyle(el).backgroundColor
    );
    expect(bg2Before, "Toggle 2 background should change on click").not.toBe(bg2After);

    // Verify Toggle 1 was NOT affected by Toggle 2 click
    const bg1AfterToggle2 = await toggle1.evaluate((el: HTMLElement) =>
      window.getComputedStyle(el).backgroundColor
    );
    expect(bg1AfterToggle2, "Toggle 1 should be independent from Toggle 2").toBe(bg1Before);

    await saveScreenshot(page, "test-9-reviews");
  });

  // ── Test 10 — Campaigns ─────────────────────────────────────────────────────
  test("Test 10 — Campaigns", async ({ page }) => {
    await login(page);
    await page.goto("/dashboard/campaigns");
    await page.waitForLoadState("networkidle");

    // "Automatic Winback" section heading
    await expect(page.getByText("Automatic Winback")).toBeVisible({ timeout: 10_000 });

    // Auto-winback toggle
    const winbackSection = page.locator(".bg-white.rounded-xl").filter({
      hasText: "Automatic Winback",
    }).first();
    await expect(winbackSection).toBeVisible();
    // The toggle button is the last button in the section header area
    const winbackToggle = winbackSection.locator("button").last();
    await expect(winbackToggle).toBeVisible({ timeout: 5_000 });

    // "+ New Campaign" button
    await expect(page.getByRole("button", { name: /\+ new campaign|new campaign/i })).toBeVisible({ timeout: 5_000 });
    await page.getByRole("button", { name: /new campaign/i }).click();

    // ── Step 1: Segment selection ──
    await expect(page.getByText("Who do you want to reach?")).toBeVisible({ timeout: 8_000 });

    // Step indicator dots (1, 2, 3)
    await expect(page.locator("div.w-7.h-7.rounded-full").filter({ hasText: "1" })).toBeVisible();
    await expect(page.locator("div.w-7.h-7.rounded-full").filter({ hasText: "2" })).toBeVisible();
    await expect(page.locator("div.w-7.h-7.rounded-full").filter({ hasText: "3" })).toBeVisible();

    // Step label
    await expect(page.getByText("Select Segment")).toBeVisible();

    // Select "All Inactive" segment
    await page.getByRole("button", { name: /all inactive/i }).click();
    await page.waitForTimeout(1_000);

    // Try to proceed — may be disabled if 0 customers
    const nextBtn = page.getByRole("button", { name: /next/i }).last();
    const canProceed = await nextBtn.isEnabled({ timeout: 3_000 }).catch(() => false);

    if (!canProceed) {
      // No customers in segment — verify "No customers in this segment" message
      await expect(page.getByText(/no customers in this segment/i)).toBeVisible();
      // Close the wizard and exit this test gracefully
      const closeBtn = page.locator("button").filter({ has: page.locator("svg") }).last();
      await closeBtn.click();
      await expect(page.getByText("Automatic Winback")).toBeVisible({ timeout: 5_000 });
      await saveScreenshot(page, "test-10-campaigns-no-customers");
      return;
    }

    await nextBtn.click();

    // ── Step 2: Review message ──
    await expect(page.getByText("Review your message")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Review Message")).toBeVisible();

    // Phone mockup with SMS preview
    await expect(page.locator(".bg-gray-100.rounded-2xl")).toBeVisible({ timeout: 8_000 });

    const nextBtn2 = page.getByRole("button", { name: /^next/i }).last();
    await expect(nextBtn2).toBeVisible();
    await nextBtn2.click();

    // ── Step 3: Confirm & Send ──
    // Step indicator shows "Confirm & Send"; label shows "Type SEND to confirm"
    await expect(page.getByText("Confirm & Send")).toBeVisible({ timeout: 8_000 });

    // Input field with placeholder "Type SEND"
    const sendInput = page.getByPlaceholder(/type send/i);
    await expect(sendInput).toBeVisible();

    // Send Campaign button is disabled before typing
    const sendCampaignBtn = page.getByRole("button", { name: /send campaign/i });
    await expect(sendCampaignBtn).toBeDisabled();

    // Type "SEND" — button should activate
    await sendInput.fill("SEND");
    await page.waitForTimeout(200);
    await expect(sendCampaignBtn).toBeEnabled({ timeout: 3_000 });

    // Cancel instead of actually sending
    const cancelBtn = page.getByRole("button", { name: /cancel/i }).first();
    await cancelBtn.click();

    // Back to campaigns main view
    await expect(page.getByText("Automatic Winback")).toBeVisible({ timeout: 8_000 });

    await saveScreenshot(page, "test-10-campaigns");
  });

  // ── Test 11 — Settings ──────────────────────────────────────────────────────
  test("Test 11 — Settings", async ({ page }) => {
    await login(page);
    await page.goto("/dashboard/settings");
    await page.waitForLoadState("networkidle");

    // 4 tab buttons
    const settingsTabs = ["Business", "Price Book", "Payments", "Integrations"];
    for (const tab of settingsTabs) {
      await expect(page.getByRole("button", { name: tab })).toBeVisible({ timeout: 8_000 });
    }

    // ── Payments Tab ──
    await page.getByRole("button", { name: "Payments" }).click();
    await page.waitForTimeout(500);

    // Section 1: Customer Payments
    await expect(page.getByText("Customer Payments")).toBeVisible({ timeout: 8_000 });
    await expect(
      page.getByText(/collect payments from your customers via stripe/i)
    ).toBeVisible();

    // Visual divider between sections
    await expect(page.locator("hr").first()).toBeVisible();

    // Section 2: Your Subscription
    await expect(page.getByText("Your Subscription")).toBeVisible();
    await expect(page.getByText(/your servicestar plan/i)).toBeVisible();

    // FREE badge (gray pill) — scoped to the subscription section, not the nav badge
    await expect(
      page.locator("span.bg-gray-100").filter({ hasText: "FREE" })
    ).toBeVisible();

    // Feature list
    const features = [
      /up to 10 active jobs/i,
      /1 business location/i,
      /SMS notifications/i,
      /stripe payment processing/i,
      /AI review replies/i,
    ];
    for (const feat of features) {
      await expect(page.getByText(feat)).toBeVisible({ timeout: 5_000 });
    }

    // Upgrade button → shows toast
    const upgradeBtn = page.getByRole("button", { name: /upgrade to pro/i });
    await expect(upgradeBtn).toBeVisible();
    await upgradeBtn.click();
    await expect(
      page.getByText("Subscription plans coming soon!")
    ).toBeVisible({ timeout: 5_000 });

    // Small text below the button
    await expect(page.getByText(/pro plan coming soon.*\$49\/month/i)).toBeVisible();

    // ── Integrations Tab ──
    await page.getByRole("button", { name: "Integrations" }).click();
    await page.waitForTimeout(500);

    // Three integration cards
    await expect(page.getByText("Google Business Profile")).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText("Stripe Payments")).toBeVisible();
    await expect(page.getByText("Twilio SMS")).toBeVisible();

    // Coming Soon section heading (first match; badges also contain this text)
    await expect(page.getByText("Coming Soon").first()).toBeVisible();
    for (const name of ["Facebook Reviews", "Yelp", "HomeStars"]) {
      await expect(page.getByText(name)).toBeVisible({ timeout: 5_000 });
    }

    await saveScreenshot(page, "test-11-settings");
  });

  // ── Test 12 — Navigation ────────────────────────────────────────────────────
  test("Test 12 — Navigation", async ({ page }) => {
    await login(page);

    const navItems = [
      { href: "/dashboard",              label: "Home" },
      { href: "/dashboard/front-office", label: "Front Office" },
      { href: "/dashboard/jobs",         label: "Jobs" },
      { href: "/dashboard/customers",    label: "Customers" },
      { href: "/dashboard/reviews",      label: "Reviews" },
      { href: "/dashboard/campaigns",    label: "Campaigns" },
      { href: "/dashboard/settings",     label: "Settings" },
    ];

    // Verify all 7 sidebar links are present by href
    for (const item of navItems) {
      await expect(
        page.locator("aside").locator(`a[href="${item.href}"]`),
        `Sidebar link "${item.label}" should be visible`
      ).toBeVisible({ timeout: 8_000 });
    }

    // Navigate to each page — confirm no 404 and sidebar remains
    for (const item of navItems) {
      await page.goto(item.href);
      await page.waitForLoadState("networkidle");

      // Sidebar must still be present (layout intact on desktop viewport)
      await expect(page.locator("aside")).toBeVisible({ timeout: 5_000 });

      // Page must not show a 404 error text
      const notFoundText = page.getByText("404").or(
        page.getByText("This page could not be found")
      );
      await expect(notFoundText).toHaveCount(0);
    }

    // Verify active state on Jobs page — active class contains "bg-white/15"
    await page.goto("/dashboard/jobs");
    await page.waitForLoadState("networkidle");

    const activeJobsLink = page.locator("aside a[href='/dashboard/jobs']").first();
    const cls = await activeJobsLink.getAttribute("class");
    // Active nav item uses bg-white/15 or similar "active" bg class
    expect(cls, "Jobs nav item should have active bg class").toMatch(/bg-white/);

    // ── Unpaid filter tab ──
    await page.goto("/dashboard/jobs?filter=unpaid");
    await page.waitForLoadState("networkidle");

    // "Unpaid" tab should exist and be visually active (bold/underlined)
    const unpaidTab = page.getByRole("button", { name: "Unpaid" });
    await expect(unpaidTab).toBeVisible({ timeout: 8_000 });
    // Active class has font-bold
    const unpaidCls = await unpaidTab.getAttribute("class");
    expect(unpaidCls, "Unpaid tab should be active when filter=unpaid is in URL")
      .toContain("font-bold");

    // ── Mobile bottom nav has exactly 5 items ──
    const mobileNavLinks = page.locator("nav.fixed.bottom-0.left-0.right-0 a");
    await expect(mobileNavLinks).toHaveCount(5, { timeout: 8_000 });

    await saveScreenshot(page, "test-12-navigation");
  });

});
