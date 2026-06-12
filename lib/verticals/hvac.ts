import type { VerticalPreset } from "./index";

export const hvac: VerticalPreset = {
  trade: "HVAC",
  displayName: "HVAC",
  icon: "🌡️",
  serviceCatalog: [
    { name: "Furnace tune-up",           description: "Annual maintenance, filter check, efficiency test",         priceMin: 99,  priceMax: 149,  unit: "flat" },
    { name: "AC tune-up",                description: "Refrigerant check, coil cleaning, performance test",        priceMin: 99,  priceMax: 149,  unit: "flat" },
    { name: "Furnace repair",            description: "Diagnose and repair heating system faults",                 priceMin: 150, priceMax: 500,  unit: "flat" },
    { name: "AC repair",                 description: "Diagnose and repair cooling system faults",                 priceMin: 150, priceMax: 600,  unit: "flat" },
    { name: "Furnace replacement",       description: "Supply and install new furnace (mid-efficiency)",           priceMin: 2800,priceMax: 5500, unit: "flat" },
    { name: "AC replacement",            description: "Supply and install new central AC unit",                    priceMin: 3000,priceMax: 6000, unit: "flat" },
    { name: "Heat pump installation",    description: "Supply and install heat pump system",                       priceMin: 4000,priceMax: 9000, unit: "flat" },
    { name: "Duct cleaning",             description: "Whole-home duct cleaning and sanitize",                     priceMin: 350, priceMax: 600,  unit: "flat" },
    { name: "Thermostat replacement",    description: "Remove old, install smart thermostat",                      priceMin: 150, priceMax: 350,  unit: "flat" },
    { name: "Service call / diagnostic", description: "On-site diagnostic, fee applied to repair",                 priceMin: 99,  priceMax: 149,  unit: "flat" },
  ],
  intakeQuestions: [
    { question: "Is this a heating or cooling issue?",                   key: "hvac_type",       required: true  },
    { question: "What is the equipment brand and approximate age?",      key: "equipment_info",  required: true  },
    { question: "Are you noticing any unusual smell or sound — especially a gas or burning smell?", key: "smell_sound", required: true },
    { question: "Is the system making any noise (clicking, banging)?",   key: "noise",           required: false },
    { question: "What is the address for the service?",                  key: "address",         required: true  },
  ],
  aiPromptPack: {
    systemPromptAddendum: "You are an HVAC dispatcher for a local HVAC company. You understand heating, cooling, and ventilation systems. You know common brands: Carrier, Lennox, Trane, Goodman, Rheem. Always ask about equipment age and brand.",
    vocabulary: ["compressor", "refrigerant", "capacitor", "heat exchanger", "evaporator coil", "blower motor", "duct", "BTU", "SEER", "AFUE"],
    urgencyRules: "If the customer mentions a gas smell, burning smell, or carbon monoxide alarm: immediately escalate to emergency, tell them to leave the building and call 911, then notify the on-call technician.",
  },
  smsTemplates: {
    confirmation: "Hi {customerName}! Your HVAC service with {businessName} is confirmed for {scheduledAt}. Our tech will arrive within the time window. Reply STOP to opt out.",
    reminder:     "Reminder: {businessName} HVAC service tomorrow at {scheduledAt}. Our tech will call 30 min before arrival. Reply STOP to opt out.",
  },
};
