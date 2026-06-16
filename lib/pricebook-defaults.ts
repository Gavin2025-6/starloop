export interface ServiceItem {
  name: string;
  description: string;
  price: number | null;
  durationMins: number;
  isRecommended?: boolean;
  requiresQuote?: boolean;
}

export function getDefaultServices(industry: string): ServiceItem[] {
  const normalized = industry.toLowerCase().replace(/[\s-]/g, "_");

  if (normalized.includes("auto") || normalized.includes("detail")) {
    return [
      { name: "Exterior Wash & Dry", description: "Hand wash, dry, tire shine, windows cleaned", price: 70, durationMins: 60 },
      { name: "Interior Detail", description: "Full vacuum, wipe-down, windows, door panels, cup holders", price: 135, durationMins: 90 },
      { name: "Full Detail (Interior + Exterior)", description: "Complete detail, tire shine, protection spray", price: 230, durationMins: 150, isRecommended: true },
      { name: "Premium Full Detail", description: "Full detail + clay bar, machine polish, wax, leather conditioning", price: 385, durationMins: 240 },
      { name: "Ceramic Coating", description: "Long-term paint protection 2–5 years — on-site quote required", price: null, requiresQuote: true, durationMins: 480 },
      { name: "Pet Hair Removal (Add-on)", description: "Specialized pet hair extraction from seats and carpet", price: 60, durationMins: 30 },
    ];
  }

  if (normalized.includes("clean")) {
    return [
      { name: "Standard Cleaning", description: "Vacuum, mop, kitchen wipe-down, bathrooms, dusting", price: 150, durationMins: 120 },
      { name: "Deep Cleaning", description: "Standard + inside appliances, baseboards, inside cabinets", price: 250, durationMins: 210, isRecommended: true },
      { name: "Move-In / Move-Out Cleaning", description: "Full deep clean for empty property", price: 350, durationMins: 300 },
      { name: "Bi-Weekly Recurring Clean", description: "Standard cleaning every two weeks, consistent schedule", price: 130, durationMins: 120 },
    ];
  }

  if (normalized.includes("lawn") || normalized.includes("grass") || normalized.includes("yard")) {
    return [
      { name: "Lawn Mowing", description: "Cut, edge, blow clippings", price: 65, durationMins: 60 },
      { name: "Full Lawn Maintenance", description: "Mow, edge, trim hedges, blow", price: 130, durationMins: 90, isRecommended: true },
      { name: "Spring Cleanup", description: "Rake, trim dead branches, edge beds, first mow", price: 265, durationMins: 210 },
      { name: "Fall Cleanup", description: "Leaf removal, final mow, bed clearing, winter prep", price: 300, durationMins: 240 },
    ];
  }

  if (normalized.includes("hvac") || normalized.includes("heating") || normalized.includes("cooling") || normalized.includes("air")) {
    return [
      { name: "Diagnostic Visit", description: "On-site inspection and diagnosis, fee applied to repair", price: 120, durationMins: 60 },
      { name: "AC Tune-Up / Maintenance", description: "Clean coils, check refrigerant, inspect electrical", price: 165, durationMins: 90 },
      { name: "Furnace Annual Inspection", description: "Heat exchanger check, combustion test, filter change, safety inspection", price: 149, durationMins: 90 },
      { name: "Refrigerant Recharge", description: "Leak test + refrigerant top-up, price depends on leak size", price: null, requiresQuote: true, durationMins: 90 },
      { name: "AC System Replacement", description: "Full central AC replacement — on-site quote required", price: null, requiresQuote: true, durationMins: 540 },
      { name: "Furnace Replacement", description: "New furnace supply and installation — on-site quote required", price: null, requiresQuote: true, durationMins: 420 },
    ];
  }

  if (normalized.includes("handyman") || normalized.includes("repair") || normalized.includes("maintenance")) {
    return [
      { name: "Handyman (Hourly)", description: "General repairs and installations, 1 hour minimum", price: 85, durationMins: 60 },
      { name: "Half-Day Service (4 hours)", description: "Larger projects, better value for bigger jobs", price: 320, durationMins: 240, isRecommended: true },
      { name: "TV Wall Mount", description: "Mount TV, hide cables, test setup", price: 150, durationMins: 90 },
      { name: "Furniture Assembly", description: "IKEA or flatpack furniture assembly", price: 115, durationMins: 90 },
    ];
  }

  if (normalized.includes("pressure") || normalized.includes("power_wash")) {
    return [
      { name: "Driveway Cleaning", description: "Full driveway pressure wash and rinse", price: 200, durationMins: 90 },
      { name: "House Exterior Wash", description: "Full exterior siding, windows, trim", price: 350, durationMins: 150, isRecommended: true },
      { name: "Deck / Patio Cleaning", description: "Pressure wash deck boards, steps, railings", price: 225, durationMins: 120 },
    ];
  }

  // Generic fallback
  return [
    { name: "Service Call", description: "On-site service visit", price: 100, durationMins: 60 },
    { name: "Hourly Rate", description: "Work billed by the hour", price: 80, durationMins: 60 },
  ];
}
