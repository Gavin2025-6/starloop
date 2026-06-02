# Proofline Architecture

Proofline is an event-driven reputation growth system.

## Core Flow

```txt
business event
-> normalize customer state
-> classify signal
-> run rules
-> plan next action
-> approve or execute
-> record audit trail
-> measure outcome
```

## Key Modules

- Event intake: Google reviews, CSV imports, paid invoices, appointments, customer replies, forms, and webhooks.
- Customer state: consent, opt-out, last contact, service type, open issue, value, and history.
- Rules engine: consent, cooldown, opt-out, open issue, gift policy, review policy, approval requirements.
- Action planner: review request, follow-up, public reply, recovery call, proof publishing, referral ask, repeat reminder, gift suggestion.
- Approval workflow: required for public replies, negative reviews, sensitive recovery, gifts, refunds, discounts, and first campaign runs.
- Audit log: records trigger, evidence, rule result, approval, execution, and outcome.
- Founder GTM loop: prospect audit, outreach draft, report open, follow-up, conversion tracking.
- Setup loop: audit result, source connection, customer import, template approval, automation activation, first owner brief.

## Model-Independent AI Boundary

AI is an assistant, not the decision maker.

AI can draft, classify, summarize, and suggest. Rules and approvals decide whether anything can be sent, published, rewarded, or executed.

## First Real Integrations

Do not chase 1000 app logos at the start.

Start with:

- Google Business Profile
- CSV import
- Zapier or webhook intake
- Email provider
- SMS provider

Then add Stripe, Jobber, Housecall Pro, Square, QuickBooks, Facebook, Yelp, and call tracking.
