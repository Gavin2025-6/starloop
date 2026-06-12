import type { VerticalPreset } from "./index";

export const plumbing: VerticalPreset = {
  trade: "PLUMBING",
  displayName: "Plumbing",
  icon: "🔧",
  serviceCatalog: [
    { name: "Drain cleaning — kitchen",   description: "Unclog kitchen sink drain",                         priceMin: 149, priceMax: 249, unit: "flat" },
    { name: "Drain cleaning — bathroom",  description: "Unclog tub, shower, or bathroom sink",              priceMin: 99,  priceMax: 199, unit: "flat" },
    { name: "Toilet repair",              description: "Fix running, clogged, or leaking toilet",           priceMin: 99,  priceMax: 250, unit: "flat" },
    { name: "Toilet replacement",         description: "Remove old, supply and install new toilet",         priceMin: 350, priceMax: 700, unit: "flat" },
    { name: "Faucet repair / replacement","description": "Repair or replace kitchen / bathroom faucet",     priceMin: 99,  priceMax: 350, unit: "flat" },
    { name: "Water heater replacement",   description: "Remove old, supply and install 40-gal tank",        priceMin: 1200,priceMax: 2200,unit: "flat" },
    { name: "Pipe repair — burst / leak", description: "Locate and repair leaking or burst pipe",           priceMin: 250, priceMax: 800, unit: "flat" },
    { name: "Sewer camera inspection",    description: "Video inspection of main sewer line",               priceMin: 199, priceMax: 399, unit: "flat" },
    { name: "Main water shut-off repair", description: "Replace or repair main house shut-off valve",       priceMin: 250, priceMax: 600, unit: "flat" },
    { name: "Service call / diagnostic",  description: "On-site diagnostic, fee applied to repair",         priceMin: 99,  priceMax: 149, unit: "flat" },
  ],
  intakeQuestions: [
    { question: "Is this a leak, a clog, or something else?",               key: "issue_type",     required: true  },
    { question: "Where is the problem located? (kitchen, bathroom, basement?)", key: "location",   required: true  },
    { question: "Have you turned off the main water supply?",               key: "shutoff_done",   required: true  },
    { question: "Is water currently leaking or flooding?",                  key: "active_leak",    required: true  },
    { question: "What is the address for the service?",                     key: "address",        required: true  },
  ],
  aiPromptPack: {
    systemPromptAddendum: "You are a plumbing dispatcher. You handle drain clogs, leaks, toilet repairs, water heater replacements, and pipe issues. Always ask if the water is shut off for any leak situation.",
    vocabulary: ["P-trap", "shut-off valve", "snake", "hydro-jet", "sump pump", "backflow", "main stack", "wax ring", "soldering"],
    urgencyRules: "If the customer reports a burst pipe, flooding, or sewage backup: treat as emergency, guide them to shut off the main water valve immediately, escalate to on-call technician.",
  },
  smsTemplates: {
    confirmation: "Hi {customerName}! Your plumbing service with {businessName} is confirmed for {scheduledAt}. Reply STOP to opt out.",
    reminder:     "Reminder: {businessName} plumber arriving {scheduledAt}. They'll call 20 min before. Reply STOP to opt out.",
  },
};
