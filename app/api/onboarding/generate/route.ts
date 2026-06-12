import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import { VERTICALS, type Trade } from "@/lib/verticals";

const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { trade } = await req.json();
    if (!trade || !(trade in VERTICALS)) {
      return NextResponse.json({ error: "Invalid trade" }, { status: 400 });
    }

    const business = await prisma.business.findUnique({ where: { userId: session.user.id } });
    if (!business) return NextResponse.json({ error: "No business" }, { status: 404 });

    const preset = VERTICALS[trade as Trade];

    // Persist trade + intakeQuestions to business
    await prisma.business.update({
      where: { id: business.id },
      data: {
        trade: trade as Trade,
        intakeQuestions: JSON.parse(JSON.stringify(preset.intakeQuestions)),
        industry: preset.displayName,
      },
    });

    // Generate personalized AI greeting script — fallback gracefully on failure
    let aiGreetingScript: string | null = null;
    try {
      const msg = await claude.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        messages: [{
          role: "user",
          content: `Write a friendly, professional phone greeting script (under 40 words) for ${business.name}, a ${preset.displayName} company${business.city ? ` in ${business.city}` : ""}. The AI answers missed calls. Start with "Hi, thanks for calling ${business.name}!" and then mention what they specialize in. End with asking how you can help.`,
        }],
      });
      aiGreetingScript = msg.content[0].type === "text" ? msg.content[0].text.trim() : null;
    } catch {
      aiGreetingScript = `Hi, thanks for calling ${business.name}! We specialize in ${preset.displayName.toLowerCase()} services. How can we help you today?`;
    }

    if (aiGreetingScript) {
      await prisma.business.update({
        where: { id: business.id },
        data: { aiGreetingScript },
      });
    }

    return NextResponse.json({
      trade,
      preset: {
        displayName: preset.displayName,
        icon: preset.icon,
        serviceCatalog: preset.serviceCatalog,
        intakeQuestions: preset.intakeQuestions,
        smsTemplates: preset.smsTemplates,
      },
      aiGreetingScript: aiGreetingScript ?? `Hi, thanks for calling ${business.name}! How can we help you today?`,
    });
  } catch (err) {
    console.error("[onboarding/generate]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
