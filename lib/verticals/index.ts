export type Trade = "HVAC" | "PLUMBING" | "ELECTRICAL" | "CLEANING" | "ROOFING" | "HANDYMAN";

export interface ServiceCatalogItem {
  name: string;
  description: string;
  priceMin: number;
  priceMax: number;
  unit: string;
}

export interface IntakeQuestion {
  question: string;
  key: string;
  required: boolean;
}

export interface VerticalPreset {
  trade: Trade;
  displayName: string;
  icon: string;
  serviceCatalog: ServiceCatalogItem[];
  intakeQuestions: IntakeQuestion[];
  aiPromptPack: {
    systemPromptAddendum: string;
    vocabulary: string[];
    urgencyRules: string;
  };
  smsTemplates: {
    confirmation: string;
    reminder: string;
  };
}

export { hvac }    from "./hvac";
export { plumbing } from "./plumbing";
export { electrical } from "./electrical";
export { cleaning }  from "./cleaning";
export { roofing }   from "./roofing";
export { handyman }  from "./handyman";

import { hvac }       from "./hvac";
import { plumbing }   from "./plumbing";
import { electrical } from "./electrical";
import { cleaning }   from "./cleaning";
import { roofing }    from "./roofing";
import { handyman }   from "./handyman";

export const VERTICALS: Record<Trade, VerticalPreset> = {
  HVAC: hvac,
  PLUMBING: plumbing,
  ELECTRICAL: electrical,
  CLEANING: cleaning,
  ROOFING: roofing,
  HANDYMAN: handyman,
};

export function getVerticalPreset(trade: string): VerticalPreset {
  const key = trade.toUpperCase() as Trade;
  return VERTICALS[key] ?? hvac;
}
