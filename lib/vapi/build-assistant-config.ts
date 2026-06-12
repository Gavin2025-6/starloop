import config from './erin-assistant-config.json';
import { getVerticalPreset } from '../verticals';

interface BookingRules {
  hoursStart: string;      // e.g. "08:00"
  hoursEnd: string;        // e.g. "18:00"
  bufferMins: number;      // e.g. 30
  weekendEnabled: boolean;
  autoConfirm: boolean;
}

export function buildVapiConfig(business: {
  name: string;
  trade: string;
  city: string;
  priceBookItems: Array<{ name: string; priceMin: number; priceMax: number; unit: string }>;
  bookingRules?: BookingRules;
}) {
  const preset = getVerticalPreset(business.trade);

  const priceBookSummary = business.priceBookItems
    .filter(i => i.priceMin > 0)
    .map(i => `- ${i.name}: $${i.priceMin}–$${i.priceMax} (${i.unit})`)
    .join('\n');

  // Build booking rules context to inject into systemPrompt
  const rules = business.bookingRules;
  const bookingRulesSection = rules ? `\n\nBOOKING RULES:
- Available hours: ${rules.hoursStart} – ${rules.hoursEnd}${rules.weekendEnabled ? ' (Mon–Sun)' : ' (Mon–Fri only)'}
- Buffer between jobs: ${rules.bufferMins} minutes
- Auto-confirm bookings: ${rules.autoConfirm ? 'YES — confirm appointments immediately on the call' : 'NO — tell the customer a team member will confirm shortly'}
- If the customer requests a time outside available hours, politely suggest the nearest available slot.` : '';

  const systemPrompt = config.model.systemPrompt
    .replace(/{businessName}/g, business.name)
    .replace(/{trade}/g, business.trade)
    .replace(/{city}/g, business.city || 'your area')
    .replace(/{tradeSystemPromptAddendum}/g, preset.aiPromptPack.systemPromptAddendum)
    .replace(
      /{priceBookSummary}/g,
      priceBookSummary || 'No price book set up yet — recommend estimate visits for all inquiries.'
    )
    + bookingRulesSection;

  return {
    ...config,
    name: `Erin — ${business.name}`,
    model: { ...config.model, systemPrompt },
    firstMessage: `Hi, thanks for calling ${business.name}! This is Erin — how can I help you today?`,
    serverUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/vapi/webhook`,
  };
}
