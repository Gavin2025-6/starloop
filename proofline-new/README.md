# Proofline

Proofline is an AI growth operations product for local reputation.

Open these files in a browser:

- `index.html`: public marketing and product positioning page.
- `audit-report.html`: generated review-growth audit report.
- `setup.html`: guided setup flow for a new customer.
- `workspace.html`: interactive product workspace demo.
- `lead-inbox.html`: founder GTM inbox for prospect audits and outreach.
- `cleaning-review-audit.html`: first vertical landing page for cleaning companies.

## Current Product Shape

Proofline combines:

- Review requests
- Follow-up reminders
- Review monitoring
- Reputation inbox
- AI replies
- Recovery tasks
- Website widgets
- Social sharing
- Referrals
- Repeats
- Gifts
- Insights
- Microsites and local proof pages
- Integrations
- Compliance audit trail
- Founder prospecting and audit workflow
- Guided customer setup

## Strategic Standard

The UI must feel like a trustworthy funded SaaS product, not a cheap clone. NiceJob is the minimum visual quality bar; Birdeye and Podium are product-depth references.

## AI Automation Plan

Use an automation layer that is independent from any specific model provider:

- Deterministic rules for consent, opt-out, cooldown, and review-gating prevention.
- AI-assisted drafting for review replies, owner briefs, customer segmentation, and issue summaries.
- Human approval for public replies, sensitive recovery actions, gifts, and compliance-sensitive output.
- Graceful fallback to rule-based templates if AI is unavailable.

## Local Demo Server

Run:

```bash
npm start
```

Then open:

```txt
http://127.0.0.1:5190
```

Available demo API routes:

- `GET /api/health`
- `GET /api/state`
- `GET /api/actions`
- `GET /api/actions/:id`
- `POST /api/actions/plan`
- `POST /api/actions/:id/approve`
- `POST /api/actions/:id/execute`
- `POST /api/audits`
