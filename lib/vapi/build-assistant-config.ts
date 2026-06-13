import config from './erin-assistant-config.json';
import { getVerticalPreset } from '../verticals';
import { buildCheckAvailabilityTool } from './tools/check-availability';
import { buildBookAppointmentTool } from './tools/book-appointment';

interface BookingRules {
  hoursStart: string;
  hoursEnd: string;
  bufferMins: number;
  weekendEnabled: boolean;
  autoConfirm: boolean;
  avgJobDurationMins?: number;
  travelBufferMins?: number;
}

export function buildVapiConfig(business: {
  name: string;
  trade: string;
  city: string;
  priceBookItems: Array<{ name: string; priceMin: number; priceMax: number; unit: string }>;
  bookingRules?: BookingRules;
}) {
  const preset = getVerticalPreset(business.trade);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const webhookUrl = `${appUrl}/api/vapi/webhook`;

  const priceBookSummary = business.priceBookItems
    .filter(i => i.priceMin > 0)
    .map(i => `- ${i.name}: $${i.priceMin}–$${i.priceMax} (${i.unit})`)
    .join('\n');

  const rules = business.bookingRules;
  const bookingRulesSection = rules ? `\n\nBOOKING RULES:\n- Available hours: ${rules.hoursStart} – ${rules.hoursEnd}${rules.weekendEnabled ? ' (Mon–Sun)' : ' (Mon–Fri only)'}\n- Average job duration: ${rules.avgJobDurationMins ?? 90} minutes\n- Travel buffer between jobs: ${rules.travelBufferMins ?? 30} minutes\n- Auto-confirm bookings: ${rules.autoConfirm ? 'YES — confirm appointments immediately on the call' : 'NO — tell the customer a team member will confirm shortly'}\n- If the customer requests a time outside available hours, politely suggest the nearest available slot.` : '';

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

  // Build functions with live webhook URL
  const functions = [
    buildCheckAvailabilityTool(webhookUrl),
    buildBookAppointmentTool(webhookUrl),
  ];

  return {
    ...config,
    name: `Erin — ${business.name}`,
    model: { ...config.model, systemPrompt },
    firstMessage: `Hi, thanks for calling ${business.name}! This is Erin — how can I help you today?`,
    serverUrl: webhookUrl,
    functions,
  };
}
