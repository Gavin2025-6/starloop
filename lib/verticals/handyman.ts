import type { VerticalPreset } from "./index";

export const handyman: VerticalPreset = {
  trade: "HANDYMAN",
  displayName: "Handyman",
  icon: "🔨",
  serviceCatalog: [
    { name: "Handyman service — per hour",  description: "General repairs and installations",              priceMin: 75,  priceMax: 120, unit: "hourly" },
    { name: "TV mounting",                  description: "Mount flat-screen TV on wall (up to 65\")",      priceMin: 99,  priceMax: 199, unit: "flat"   },
    { name: "Furniture assembly",           description: "Assemble flat-pack furniture (per piece)",       priceMin: 60,  priceMax: 150, unit: "flat"   },
    { name: "Door repair / adjustment",     description: "Fix sticking, squeaking, or misaligned door",    priceMin: 75,  priceMax: 200, unit: "flat"   },
    { name: "Drywall patch (small)",        description: "Patch hole up to 6\"×6\" and prime",             priceMin: 75,  priceMax: 150, unit: "flat"   },
    { name: "Drywall patch (large)",        description: "Patch hole up to 2'×2', mud, sand, prime",       priceMin: 150, priceMax: 350, unit: "flat"   },
    { name: "Caulking — per area",          description: "Remove old and apply fresh caulk (bath/kitchen)",priceMin: 75,  priceMax: 150, unit: "flat"   },
    { name: "Tile repair (per tile)",       description: "Remove and replace broken wall or floor tile",   priceMin: 40,  priceMax: 80,  unit: "flat"   },
    { name: "Deck / fence repair",          description: "Replace boards, reinforce posts",                priceMin: 150, priceMax: 600, unit: "flat"   },
  ],
  intakeQuestions: [
    { question: "Can you describe what needs to be done?",                             key: "description",   required: true  },
    { question: "Do you have an estimate of how long the job will take?",              key: "duration",      required: false },
    { question: "Will you supply the materials, or should we bring them?",             key: "materials",     required: true  },
    { question: "Is there anything that requires special tools or equipment?",         key: "special_tools", required: false },
    { question: "What is the address for the service?",                               key: "address",       required: true  },
  ],
  aiPromptPack: {
    systemPromptAddendum: "You are Jim, the AI receptionist for {businessName}.\nPersonality: Easygoing, practical, gets to the point without being blunt.\n\nFor vague requests, gently narrow down:\n\"Sure, we can help with that — just so I can give you an accurate time estimate, \nis this more of a quick fix or a bigger project?\"\n\nAlways ask: who provides materials, rough time estimate, \nany access restrictions. Keep it conversational.",
    vocabulary: ["stud finder", "drywall anchor", "caulk", "spackle", "toggle bolt", "lag screw", "miter cut", "spirit level"],
    urgencyRules: "No emergency rules for standard handyman. Prioritize safety if customer describes a structural issue (sagging ceiling, broken step) — flag for same-day assessment.",
  },
  smsTemplates: {
    confirmation: "Hi {customerName}! Your handyman service with {businessName} is confirmed for {scheduledAt}. We'll bring standard tools. Reply STOP to opt out.",
    reminder:     "Reminder: {businessName} handyman arriving {scheduledAt}. Have the work area clear and accessible. Reply STOP to opt out.",
  },
};
