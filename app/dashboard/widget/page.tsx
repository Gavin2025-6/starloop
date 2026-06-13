"use client";

import { useEffect, useState } from "react";
import { Copy, Check, ExternalLink, Link2 } from "lucide-react";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://service-star-production.up.railway.app";

interface BusinessInfo {
  name: string;
  slug: string;
  id: string;
}

export default function WidgetPage() {
  const [business, setBusiness] = useState<BusinessInfo | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedBooking, setCopiedBooking] = useState(false);

  useEffect(() => {
    fetch("/api/business/profile")
      .then(r => r.json())
      .then((d: { name?: string; slug?: string; id?: string }) => {
        if (d.name && d.slug && d.id) setBusiness({ name: d.name, slug: d.slug, id: d.id });
      })
      .catch(() => {});
  }, []);

  const embedCode = business
    ? `<script src="${APP_URL}/widget.js" data-business="${business.slug}"></script>`
    : "";

  function copyEmbed() {
    if (!embedCode) return;
    navigator.clipboard.writeText(embedCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const widgetUrl = business ? `${APP_URL}/widget/${business.slug}` : null;
  const bookingUrl = business ? `${APP_URL}/book/${business.slug}` : null;

  function copyBookingLink() {
    if (!bookingUrl) return;
    navigator.clipboard.writeText(bookingUrl).then(() => {
      setCopiedBooking(true);
      setTimeout(() => setCopiedBooking(false), 2000);
    });
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6 sm:py-8 space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-[#0D1117]">Chat Widget</h1>
          <p className="text-gray-400 text-sm mt-0.5">Add Erin to your website so customers can book without calling.</p>
        </div>

        {/* How it works */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
          <h2 className="text-base font-bold text-[#0D1117] mb-4">How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { step: "1", title: "Customer clicks", desc: "A floating \"Book Now\" button appears on your website" },
              { step: "2", title: "Erin chats", desc: "Erin collects their details and checks your real availability" },
              { step: "3", title: "Booking created", desc: "Job appears in your dashboard and both get confirmation SMS" },
            ].map(item => (
              <div key={item.step} className="text-center p-4 bg-gray-50 rounded-xl">
                <div className="w-8 h-8 bg-[#0D1117] text-white rounded-full flex items-center justify-center mx-auto mb-3 text-sm font-bold">
                  {item.step}
                </div>
                <p className="text-sm font-semibold text-[#0D1117] mb-1">{item.title}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Embed code */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-[#0D1117]">Embed Code</h2>
            {widgetUrl && (
              <a
                href={widgetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                Preview <ExternalLink size={11} />
              </a>
            )}
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Paste this code just before the <code className="bg-gray-100 px-1 rounded text-xs">&lt;/body&gt;</code> tag on your website.
          </p>
          {business ? (
            <>
              <div className="bg-gray-900 text-green-400 rounded-xl px-4 py-4 text-xs font-mono break-all leading-relaxed">
                {embedCode}
              </div>
              <button
                onClick={copyEmbed}
                className="mt-3 flex items-center gap-2 bg-[#0D1117] text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#374151] transition-colors"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copied!" : "Copy Embed Code"}
              </button>
            </>
          ) : (
            <div className="bg-gray-100 rounded-xl px-4 py-4 text-sm text-gray-400 animate-pulse">
              Loading your embed code…
            </div>
          )}
        </div>

        {/* Widget preview link */}
        {widgetUrl && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 flex items-start gap-3">
            <div className="flex-1">
              <p className="text-sm font-semibold text-blue-900">Test your widget</p>
              <p className="text-xs text-blue-700 mt-0.5">Open the link below to see exactly what customers will see on your website.</p>
              <a
                href={widgetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-2 text-xs text-blue-700 font-semibold underline hover:no-underline"
              >
                {widgetUrl} <ExternalLink size={11} />
              </a>
            </div>
          </div>
        )}

        {/* Booking link */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
          <div className="flex items-center gap-2 mb-1">
            <Link2 size={16} className="text-[#0D1117]" />
            <h2 className="text-base font-bold text-[#0D1117]">Share your booking link</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Send this link to customers so they can self-book directly — no website needed.
          </p>
          {bookingUrl ? (
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 font-mono truncate">
                {bookingUrl}
              </div>
              <div className="flex gap-2 shrink-0">
                <a
                  href={bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <ExternalLink size={14} /> Preview
                </a>
                <button
                  onClick={copyBookingLink}
                  className="flex items-center gap-1.5 bg-[#0D1117] text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#374151] transition-colors"
                >
                  {copiedBooking ? <Check size={14} /> : <Copy size={14} />}
                  {copiedBooking ? "Copied!" : "Copy Link"}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-100 rounded-lg px-4 py-3 text-sm text-gray-400 animate-pulse">
              Loading your booking link…
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
          <h2 className="text-base font-bold text-[#0D1117] mb-4">Platform Instructions</h2>
          <div className="space-y-4">
            {[
              {
                platform: "WordPress",
                steps: ["Go to Appearance → Theme Editor", "Open footer.php", "Paste the embed code before </body>"],
              },
              {
                platform: "Squarespace",
                steps: ["Settings → Advanced → Code Injection", "Paste in Footer section", "Save"],
              },
              {
                platform: "Wix",
                steps: ["Add → Embed → Embed a Widget → HTML iframe", "Set the iframe src to your widget URL", "Position in bottom-right corner"],
              },
              {
                platform: "Any HTML site",
                steps: ["Open your HTML file", "Find the </body> tag", "Paste the embed code just before it"],
              },
            ].map(({ platform, steps }) => (
              <div key={platform} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                <p className="text-sm font-semibold text-[#0D1117] mb-2">{platform}</p>
                <ol className="space-y-1">
                  {steps.map((step, i) => (
                    <li key={i} className="text-xs text-gray-600 flex gap-2">
                      <span className="text-gray-400 shrink-0">{i + 1}.</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
