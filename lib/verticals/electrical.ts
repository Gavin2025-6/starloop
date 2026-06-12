import type { VerticalPreset } from "./index";

export const electrical: VerticalPreset = {
  trade: "ELECTRICAL",
  displayName: "Electrical",
  icon: "⚡",
  serviceCatalog: [
    { name: "Outlet / switch replacement",  description: "Replace faulty outlet or light switch",              priceMin: 99,  priceMax: 199, unit: "flat" },
    { name: "GFCI outlet installation",     description: "Install GFCI outlet in kitchen/bath (code-required)",priceMin: 149, priceMax: 249, unit: "flat" },
    { name: "Panel breaker replacement",    description: "Replace tripping or faulty breaker",                 priceMin: 150, priceMax: 350, unit: "flat" },
    { name: "Panel upgrade 100A → 200A",    description: "Full electrical panel upgrade with permit",          priceMin: 2500,priceMax: 4500,unit: "flat" },
    { name: "Ceiling fan installation",     description: "Install ceiling fan (pre-wired box required)",       priceMin: 149, priceMax: 299, unit: "flat" },
    { name: "Light fixture installation",   description: "Install or replace light fixture",                   priceMin: 99,  priceMax: 249, unit: "flat" },
    { name: "EV charger installation",      description: "Install Level 2 EV charger in garage",              priceMin: 600, priceMax: 1500,unit: "flat" },
    { name: "Smoke / CO detector install",  description: "Install hardwired smoke and CO detector",            priceMin: 149, priceMax: 249, unit: "flat" },
    { name: "Home rewiring (per room)",     description: "Rewire single room — older knob-and-tube removal",   priceMin: 800, priceMax: 2000,unit: "flat" },
    { name: "Service call / diagnostic",    description: "On-site diagnostic, fee applied to repair",          priceMin: 99,  priceMax: 149, unit: "flat" },
  ],
  intakeQuestions: [
    { question: "How much of the home has lost power? (single outlet, one circuit, whole house?)", key: "outage_scope", required: true  },
    { question: "Are you noticing any burning smell, sparks, or flickering lights?",               key: "hazard_signs", required: true  },
    { question: "Is any breaker tripping repeatedly?",                                             key: "breaker_trip", required: false },
    { question: "Is this for a new installation or a repair?",                                     key: "work_type",    required: true  },
    { question: "What is the address for the service?",                                            key: "address",      required: true  },
  ],
  aiPromptPack: {
    systemPromptAddendum: "You are Dwight, the AI receptionist for {businessName}.\nPersonality: Safety-first, methodical, no shortcuts.\n\nSAFETY RULE — flickering lights + burning smell, exposed wires, \nor partial power loss across multiple rooms:\n\"That combination of symptoms can be serious. \nPlease avoid using that circuit until {businessName} can look at it. \nI'm marking this as priority.\"\n\nFor standard requests: confirm panel type, affected area, \nwhether it's residential or commercial. Book with precision.",
    vocabulary: ["GFCI", "AFCI", "breaker", "panel", "circuit", "load", "neutral", "ground", "EMT conduit", "arc fault"],
    urgencyRules: "If the customer reports sparks, burning smell, or exposed wiring: treat as electrical emergency. Tell them to turn off the main breaker if it's safe to do so, leave the area, and call 911 if there is any sign of fire.",
  },
  smsTemplates: {
    confirmation: "Hi {customerName}! Your electrical service with {businessName} is confirmed for {scheduledAt}. Our licensed electrician will arrive then. Reply STOP to opt out.",
    reminder:     "Reminder: {businessName} electrician tomorrow at {scheduledAt}. They'll call 30 min before. Reply STOP to opt out.",
  },
};
