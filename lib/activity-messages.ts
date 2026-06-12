/**
 * Converts raw JobEvent type + payload to human-readable Activity text.
 * Rule: subject + verb + object + outcome. No tech jargon.
 */

export type ActivityEntry = {
  id: string;
  type: string;
  payload: Record<string, unknown> | null;
  createdAt: Date;
  human: string;
  icon: string;
};

export function humanize(type: string, payload: Record<string, unknown> | null, customerName?: string): { human: string; icon: string } {
  const name = customerName ?? "customer";

  switch (type) {
    case "job_created":
      return { icon: "🆕", human: `Job created` };

    case "status_changed": {
      const from = payload?.from as string | undefined;
      const to = payload?.to as string | undefined;
      const labels: Record<string, string> = {
        requested: "Requested",
        scheduled: "Scheduled",
        in_progress: "In Progress",
        completed: "Completed",
        invoiced: "Invoiced",
        paid: "Paid",
        cancelled: "Cancelled",
      };
      if (to === "completed") return { icon: "✅", human: `Job marked complete` };
      if (to === "paid")      return { icon: "💰", human: `Payment received` };
      if (to === "invoiced")  return { icon: "📄", human: `Invoice sent to ${name}` };
      if (to === "cancelled") return { icon: "❌", human: `Job cancelled` };
      return { icon: "🔄", human: `Status changed: ${labels[from ?? ""] ?? from} → ${labels[to ?? ""] ?? to}` };
    }

    case "sms_sent": {
      const kind = payload?.kind as string | undefined;
      if (kind === "thank_you")        return { icon: "✅", human: `Thank-you text sent to ${name}` };
      if (kind === "review_request")   return { icon: "⭐", human: `Review request sent to ${name} — we'll track if they leave one` };
      if (kind === "invoice")          return { icon: "📄", human: `Invoice text sent to ${name}` };
      if (kind === "reminder")         return { icon: "🔔", human: `Appointment reminder sent to ${name}` };
      if (kind === "winback")          return { icon: "🔄", human: `Win-back text sent to ${name}` };
      if (kind === "payment_link")     return { icon: "💳", human: `Payment link sent to ${name}` };
      return { icon: "💬", human: `Text message sent to ${name}` };
    }

    case "sms_mocked": {
      const kind = payload?.kind as string | undefined;
      const label = kind === "review_request" ? "Review request" : kind === "thank_you" ? "Thank-you text" : "Text message";
      return { icon: "🔕", human: `${label} queued for ${name} (trial mode — link omitted)` };
    }

    case "call_received": {
      const phone = payload?.phone as string | undefined;
      const dur = payload?.duration as number | undefined;
      return { icon: "📞", human: `Call received from ${phone ?? "unknown"} — AI responded${dur ? ` in ${dur}s` : ""}` };
    }

    case "call_missed":
      return { icon: "📵", human: `Missed call from ${(payload?.phone as string) ?? "unknown"} — AI responded` };

    case "payment_link_created":
      return { icon: "💳", human: `Payment link created — $${payload?.amount ?? "?"}` };

    case "payment_received":
      return { icon: "💰", human: `Invoice paid — $${payload?.amount ?? "?"} received` };

    case "payment_failed":
      return { icon: "⚠️", human: `Payment attempt failed — ${name} will retry` };

    case "review_received": {
      const stars = payload?.rating as number | undefined;
      return { icon: "⭐", human: `${stars ? `${stars}-star ` : ""}review left by ${name}` };
    }

    case "review_no_response":
      return { icon: "🤷", human: `No review yet from ${name} — that's normal, about 1 in 3 customers leave one` };

    case "note_added":
      return { icon: "📝", human: `Note added` };

    case "photo_added":
      return { icon: "📷", human: `Photo added to job` };

    case "booking_created":
      return { icon: "📅", human: `${name} booked online` };

    case "invoice_created":
      return { icon: "📄", human: `Invoice generated — $${payload?.total ?? "?"}` };

    default:
      return { icon: "•", human: type.replace(/_/g, " ") };
  }
}

export function buildActivity(
  events: Array<{ id: string; type: string; payload: unknown; createdAt: Date }>,
  customerName?: string
): ActivityEntry[] {
  return events.map((e) => {
    const p = (e.payload ?? null) as Record<string, unknown> | null;
    const { human, icon } = humanize(e.type, p, customerName);
    return { id: e.id, type: e.type, payload: p, createdAt: e.createdAt, human, icon };
  });
}
