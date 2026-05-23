"use client";

import { useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Languages,
  ListChecks,
  Radar,
  Send,
  ShieldCheck,
  Workflow,
} from "lucide-react";

const capabilities = [
  {
    title: "Request",
    shortTitle: "Request",
    Icon: Workflow,
    headline: "StarLoop asks before the owner remembers to ask.",
    signal: "Completed visit, invoice, QR scan, customer list, or manual request.",
    processing: [
      "Choose whether the customer should get a feedback request, review request, or follow-up.",
      "Adapt the page and message to the customer's language.",
      "Avoid asking too often or sending the wrong request after a bad experience.",
    ],
    result: "More fresh customer signals without the owner chasing every person manually.",
  },
  {
    title: "Triage",
    shortTitle: "Triage",
    Icon: ShieldCheck,
    headline: "Every signal is sorted before it becomes noise.",
    signal: "Low rating, praise, silence, refund language, delay complaint, staff issue, or public review.",
    processing: [
      "Classify urgency, complaint type, sentiment, and business impact.",
      "Separate promoter, neutral, at-risk, and urgent recovery cases.",
      "Decide what should be public, private, ignored, escalated, or followed up.",
    ],
    result: "The owner sees a priority queue, not a messy inbox.",
  },
  {
    title: "Recover",
    shortTitle: "Recover",
    Icon: Send,
    headline: "Bad experiences become recovery tasks with clear next steps.",
    signal: "A customer is unhappy, silent, or likely to post publicly.",
    processing: [
      "Recommend the next action: apologize, clarify, offer a fix, call back, or escalate.",
      "Draft the message only after the action is clear.",
      "Track whether the owner handled it or the case is still open.",
    ],
    result: "A clear recovery path that can save the customer before the damage spreads.",
  },
  {
    title: "Publish",
    shortTitle: "Publish",
    Icon: ListChecks,
    headline: "Public responses are controlled, consistent, and owner-approved.",
    signal: "Public reviews, private feedback, language, tone, business context, and risk level.",
    processing: [
      "Draft public replies only when they are useful.",
      "Flag sensitive cases that need owner approval.",
      "Keep response history so the business does not sound random over time.",
    ],
    result: "Public reputation improves without turning the owner into a full-time reviewer.",
  },
  {
    title: "Learn",
    shortTitle: "Learn",
    Icon: Radar,
    headline: "The system remembers what keeps hurting trust.",
    signal: "Review freshness, response speed, unresolved issues, customer themes, and sentiment shifts.",
    processing: [
      "Track patterns across feedback and customer language.",
      "Highlight what changed since the last report.",
      "Connect reputation movement to operational issues.",
    ],
    result: "The owner sees whether wait time, staff tone, quality, price, or delays are becoming a pattern.",
  },
  {
    title: "Localize",
    shortTitle: "Language",
    Icon: Languages,
    headline: "Customers speak naturally while the owner keeps one clear view.",
    signal: "Browser language, review language, message language, and owner dashboard language.",
    processing: [
      "Adapt customer-facing pages to the language visitors actually use.",
      "Keep the business dashboard consistent and simple.",
      "Draft replies that match customer language and tone.",
    ],
    result: "A smoother customer experience without extra work for the business.",
  },
  {
    title: "Improve",
    shortTitle: "Growth",
    Icon: BarChart3,
    headline: "Reputation work becomes a business improvement loop.",
    signal: "Feedback volume, response rate, recovery tasks, complaint themes, and trend movement.",
    processing: [
      "Summarize what improved, what worsened, and what needs attention.",
      "Rank actions by impact and effort.",
      "Build memory so reports become more specific over time.",
    ],
    result: "A practical action plan for the next week of operations.",
  },
];

export default function CapabilityExplorer() {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = capabilities[activeIndex];
  const ActiveIcon = active.Icon;

  return (
    <section id="product" className="border-y border-white/10 bg-[#F6F8FB] text-[#07142F]">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.58fr_1.42fr] lg:items-center">
          <div>
            <h2 className="max-w-[430px] text-[clamp(2rem,3.15vw,3.35rem)] font-bold leading-[1.06]">
              From customer signal to business action.
            </h2>
          </div>
          <p className="max-w-2xl text-base leading-8 lg:ml-auto" style={{ color: "#536079" }}>
            StarLoop connects requests, triage, recovery, publishing, learning, language, and reporting into one operating flow for local businesses.
          </p>
        </div>

        <div className="mt-10 overflow-hidden rounded-2xl border border-[#DDE5EF] bg-white shadow-[0_24px_80px_rgba(7,20,47,0.08)]">
          <div className="flex flex-wrap border-b border-[#E6ECF4] bg-[#FBFCFE]">
            {capabilities.map(({ title, shortTitle, Icon }, index) => {
              const selected = index === activeIndex;
              return (
                <button
                  key={title}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setActiveIndex(index)}
                  className="flex min-h-16 flex-1 basis-1/2 items-center gap-2 border-b border-r border-[#E6ECF4] px-4 text-left text-sm font-semibold transition-colors sm:basis-1/3 lg:basis-auto lg:border-b-0"
                  style={{
                    background: selected ? "#07142F" : "#FBFCFE",
                    color: selected ? "#FFFFFF" : "#536079",
                  }}
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                    style={{
                      background: selected ? "rgba(24,214,198,0.16)" : "#EAFBF8",
                      color: selected ? "#8CFFF0" : "#087C6D",
                    }}
                  >
                    <Icon size={18} />
                  </span>
                  <span>{shortTitle}</span>
                </button>
              );
            })}
          </div>

          <div className="grid gap-0 lg:grid-cols-[0.86fr_1.14fr] items-start min-h-[400px]">
            <div className="border-b border-[#E6ECF4] p-6 sm:p-8 lg:border-b-0 lg:border-r">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EAFBF8] text-[#087C6D]">
                <ActiveIcon size={23} />
              </div>
              <p className="mt-7 text-sm font-semibold text-[#087C6D]">{active.title}</p>
              <h3 className="mt-3 max-w-lg text-3xl font-bold leading-tight">
                {active.headline}
              </h3>
              <div className="mt-8 rounded-2xl border border-[#DDE5EF] bg-[#F8FAFC] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7F8AA3]">
                  Incoming signal
                </p>
                <p className="mt-3 text-sm leading-6 text-[#28354D]">{active.signal}</p>
              </div>
            </div>

            <div className="p-6 sm:p-8 items-start">
              <div className="grid gap-4">
                <div className="rounded-2xl border border-[#DDE5EF] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7F8AA3]">
                    Decision path
                  </p>
                  <div className="mt-5 grid gap-3">
                    {active.processing.map((item, index) => (
                      <div key={item} className="grid grid-cols-[36px_1fr] items-start gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EAFBF8] text-sm font-bold text-[#087C6D]">
                          {index + 1}
                        </div>
                        <p className="pt-1.5 text-sm leading-6 text-[#28354D]">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                  <div className="rounded-2xl border border-[#DDE5EF] bg-[#F8FAFC] p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7F8AA3]">
                      Owner view
                    </p>
                    <p className="mt-3 text-sm leading-6 text-[#28354D]">
                      Clear status, plain language, and only the work that matters next.
                    </p>
                  </div>
                  <div className="hidden h-10 w-10 items-center justify-center rounded-full border border-[#DDE5EF] text-[#7F8AA3] sm:flex">
                    <ArrowRight size={17} />
                  </div>
                  <div className="rounded-2xl border border-[#BDEFE8] bg-[#EAFBF8] p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#087C6D]">
                      Result
                    </p>
                    <p className="mt-3 text-sm font-medium leading-6 text-[#07142F]">
                      {active.result}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
