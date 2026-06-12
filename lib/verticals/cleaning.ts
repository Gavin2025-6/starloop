import type { VerticalPreset } from "./index";

export const cleaning: VerticalPreset = {
  trade: "CLEANING",
  displayName: "Cleaning",
  icon: "🧹",
  serviceCatalog: [
    { name: "Standard clean — 1BR/1BA",   description: "Regular maintenance clean, 1 bed / 1 bath",      priceMin: 80,  priceMax: 120, unit: "flat" },
    { name: "Standard clean — 2BR/2BA",   description: "Regular maintenance clean, 2 bed / 2 bath",      priceMin: 110, priceMax: 160, unit: "flat" },
    { name: "Standard clean — 3BR/2BA",   description: "Regular maintenance clean, 3 bed / 2 bath",      priceMin: 140, priceMax: 200, unit: "flat" },
    { name: "Deep clean — per hour",       description: "Thorough scrub of all surfaces, inside appliances",priceMin: 40,  priceMax: 60,  unit: "hourly" },
    { name: "Move-in / move-out clean",   description: "Full empty-home clean for tenants/landlords",    priceMin: 200, priceMax: 450, unit: "flat" },
    { name: "Post-renovation clean",      description: "Dust and debris removal after construction",      priceMin: 250, priceMax: 600, unit: "flat" },
    { name: "Carpet cleaning — per room", description: "Hot-water extraction carpet cleaning",            priceMin: 40,  priceMax: 80,  unit: "flat" },
    { name: "Window cleaning (interior)", description: "Interior window cleaning per floor",              priceMin: 80,  priceMax: 150, unit: "flat" },
    { name: "Airbnb turnover clean",      description: "Quick turnaround clean between guests",           priceMin: 70,  priceMax: 130, unit: "flat" },
  ],
  intakeQuestions: [
    { question: "What is the square footage or number of bedrooms and bathrooms?", key: "size",          required: true  },
    { question: "Is this a regular clean or a deep clean?",                        key: "clean_type",    required: true  },
    { question: "Do you have any pets? (affects time and products used)",           key: "pets",          required: false },
    { question: "Is the home furnished or empty?",                                 key: "furnished",     required: false },
    { question: "What is the address for the service?",                            key: "address",       required: true  },
  ],
  aiPromptPack: {
    systemPromptAddendum: "You are a cleaning service dispatcher. You book residential and commercial cleaning services. Ask about home size, clean type, and pets before giving a quote.",
    vocabulary: ["deep clean", "move-out", "turnover", "squeegee", "microfiber", "HEPA", "grout", "baseboard", "steam clean"],
    urgencyRules: "No emergency rules for cleaning. For same-day requests, check availability before confirming.",
  },
  smsTemplates: {
    confirmation: "Hi {customerName}! Your cleaning with {businessName} is confirmed for {scheduledAt}. Our team will bring all supplies. Reply STOP to opt out.",
    reminder:     "Reminder: {businessName} cleaning team arriving {scheduledAt}. Please ensure access. Reply STOP to opt out.",
  },
};
