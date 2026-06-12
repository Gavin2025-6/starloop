import config from './erin-assistant-config.json';
import { getVerticalPreset } from '../verticals';

export function buildVapiConfig(business: {
  name: string;
  trade: string;
  city: string;
  priceBookItems: Array<{ name: string; priceMin: number; priceMax: number; unit: string }>;
}) {
  const preset = getVerticalPreset(business.trade);

  const priceBookSummary = business.priceBookItems
    .filter(i => i.priceMin > 0)
    .map(i => `- ${i.name}: $${i.priceMin}–$${i.priceMax} (${i.unit})`)
    .join('\n');

  const systemPrompt = config.model.systemPrompt
    .replace(/{businessName}/g, business.name)
    .replace(/{trade}/g, business.trade)
    .replace(/{city}/g, business.city || 'your area')
    .replace(/{tradeSystemPromptAddendum}/g, preset.aiPromptPack.systemPromptAddendum)
    .replace(/{priceBookSummary}/g, priceBookSummary || 'No price book set up yet — recommend estimate visits for all inquiries.');

  return {
    ...config,
    name: `Erin — ${business.name}`,
    model: { ...config.model, systemPrompt },
    firstMessage: `Hi, thanks for calling ${business.name}! This is Erin — how can I help you today?`,
    serverUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/vapi/webhook`,
  };
}
