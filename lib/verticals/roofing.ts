import type { VerticalPreset } from "./index";

export const roofing: VerticalPreset = {
  trade: "ROOFING",
  displayName: "Roofing",
  icon: "🏠",
  serviceCatalog: [
    { name: "Roof inspection",             description: "Full roof condition assessment, written report",    priceMin: 199, priceMax: 399,  unit: "flat" },
    { name: "Shingle repair (per 10 sq)", description: "Replace damaged or missing shingles",              priceMin: 200, priceMax: 500,  unit: "flat" },
    { name: "Roof leak repair",            description: "Locate and repair active leak area",               priceMin: 250, priceMax: 800,  unit: "flat" },
    { name: "Full roof replacement — asphalt (per sq)", description: "Tear-off and replace, 30-yr shingles", priceMin: 350, priceMax: 550, unit: "flat" },
    { name: "Flat roof repair",            description: "Patch flat membrane or tar-and-gravel roof",       priceMin: 300, priceMax: 1000, unit: "flat" },
    { name: "Skylight installation",       description: "Supply and install standard skylight",             priceMin: 1000,priceMax: 3000, unit: "flat" },
    { name: "Gutter cleaning",             description: "Clean and flush gutters and downspouts",           priceMin: 99,  priceMax: 199,  unit: "flat" },
    { name: "Gutter replacement (per LF)", description: "Remove old and install new aluminum gutters",     priceMin: 8,   priceMax: 15,   unit: "flat" },
    { name: "Ice dam removal",             description: "Safely remove ice dams and install protection",    priceMin: 300, priceMax: 800,  unit: "flat" },
  ],
  intakeQuestions: [
    { question: "Where on the roof is the problem, or is it the whole roof?",          key: "leak_location", required: true  },
    { question: "What type of roofing material do you have? (asphalt, metal, flat?)",  key: "roof_type",     required: true  },
    { question: "Are you filing an insurance claim for this damage?",                  key: "insurance",     required: false },
    { question: "How old is the current roof?",                                        key: "roof_age",      required: false },
    { question: "What is the address for the service?",                                key: "address",       required: true  },
  ],
  aiPromptPack: {
    systemPromptAddendum: "You are Angela, the AI receptionist for {businessName}.\nPersonality: Precise, detail-oriented, professional. \nEvery piece of information matters. No vague answers accepted.\n\nAlways collect: exact leak location, roof material/age, \nwhether insurance claim is involved.\n\nIf insurance is mentioned: \"I'll make sure to note that. \n{businessName} works with insurance claims — we'll need the damage date \nand your policy provider when we visit.\"\n\nDo not proceed to booking until all required intake fields are confirmed. \n\"I just want to make sure we have everything right before we schedule.\"",
    vocabulary: ["flashing", "fascia", "soffit", "rake board", "drip edge", "underlayment", "membrane", "ice-and-water shield", "ridge cap", "valley"],
    urgencyRules: "If the customer reports active water entering the home through the roof, treat as urgent. Offer emergency tarp service same-day and schedule a full repair inspection.",
  },
  smsTemplates: {
    confirmation: "Hi {customerName}! Your roofing service with {businessName} is confirmed for {scheduledAt}. Our team will call 30 min before. Reply STOP to opt out.",
    reminder:     "Reminder: {businessName} roofing crew arriving {scheduledAt}. Please ensure roof access. Reply STOP to opt out.",
  },
};
