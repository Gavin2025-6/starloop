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

const STATUS_LABELS: Record<string, string> = {
  scheduled:        "Scheduled",
  in_progress:      "In Progress",
  completed:        "Completed",
  awaiting_payment: "Awaiting Payment",
  paid:             "Paid",
  partially_paid:   "Partially Paid",
  cancelled:        "Cancelled",
  no_show:          "No Show",
  // legacy
  requested:        "Requested",
  invoiced:         "Invoiced",
};

export function humanize(
  type: string,
  payload: Record<string, unknown> | null,
  customerName?: string
): { human: string; icon: string } {
  const name = customerName ?? "customer";

  switch (type) {
    case "job_created":
      return { icon: "🆕", human: "Job created" };

    case "booking_created":
      return { icon: "📅", human: `${name} booked online` };

    case "status_changed": {
      const from = (payload?.from ?? payload?.fromStatus) as string | undefined;
      const to = (payload?.to ?? payload?.toStatus) as string | undefined;

      if (to === "in_progress")      return { icon: "▶️",  human: "Work started" };
      if (to === "completed")        return { icon: "✅",  human: "Job marked complete" };
      if (to === "awaiting_payment") return { icon: "💳",  human: `Payment link sent to ${name}` };
      if (to === "paid")             return { icon: "💰",  human: "Payment received in full" };
      if (to === "partially_paid") {
        const amt = payload?.paidAmount as number | undefined;
        return { icon: "💳", human: `Partial payment received${amt !== undefined ? ` — $${amt.toFixed(2)}` : ""}` };
      }
      if (to === "cancelled") {
        const reason = payload?.cancelReason as string | undefined;
        return { icon: "❌", human: reason ? `Job cancelled — ${reason}` : "Job cancelled" };
      }
      if (to === "no_show") return { icon: "🚫", human: `No show — customer unreachable` };

      const fromLabel = STATUS_LABELS[from ?? ""] ?? from;
      const toLabel = STATUS_LABELS[to ?? ""] ?? to;
      return { icon: "🔄", human: `Status changed: ${fromLabel} → ${toLabel}` };
    }

    case "rescheduled": {
      const newAt = payload?.newScheduledAt as string | undefined;
      if (newAt) {
        const dt = new Date(newAt);
        const label = dt.toLocaleString("en-US", {
          month: "short", day: "numeric",
          hour: "numeric", minute: "2-digit", hour12: true,
        });
        return { icon: "📅", human: `Rescheduled to ${label}` };
      }
      return { icon: "📅", human: "Job rescheduled" };
    }

    case "sms_sent": {
      const kind = payload?.kind as string | undefined;
      if (kind === "thank_you")        return { icon: "✅",  human: `Thank-you text sent to ${name}` };
      if (kind === "review_request")   return { icon: "⭐",  human: `Review request sent to ${name}` };
      if (kind === "invoice")          return { icon: "📄",  human: `Invoice text sent to ${name}` };
      if (kind === "reminder")         return { icon: "🔔",  human: `Appointment reminder sent to ${name}` };
      if (kind === "winback")          return { icon: "🔄",  human: `Win-back text sent to ${name}` };
      if (kind === "payment_link") {
        const note = payload?.note as string | undefined;
        return {
          icon: "💳",
          human: note === "balance_due"
            ? `Balance-due link sent to ${name}`
            : `Payment link sent to ${name}`,
        };
      }
      if (kind === "cancellation")     return { icon: "❌",  human: `Cancellation notice sent to ${name}` };
      if (kind === "reschedule")       return { icon: "📅",  human: `Reschedule notice sent to ${name}` };
      return { icon: "💬", human: `Text message sent to ${name}` };
    }

    case "sms_mocked": {
      const kind = payload?.kind as string | undefined;
      const label =
        kind === "review_request" ? "Review request" :
        kind === "thank_you"      ? "Thank-you text" :
        kind === "payment_link"   ? "Payment link"   :
                                    "Text message";
      return { icon: "🔕", human: `${label} queued for ${name} (trial mode — URL omitted)` };
    }

    case "call_received": {
      const phone = payload?.phone as string | undefined;
      const dur = payload?.duration as number | undefined;
      return { icon: "📞", human: `Call received from ${phone ?? "unknown"} — AI responded${dur ? ` in ${dur}s` : ""}` };
    }

    case "call_missed":
      return { icon: "📵", human: `Missed call from ${(payload?.phone as string) ?? "unknown"} — AI responded` };

    case "payment_link_created": {
      const amt = payload?.amount as number | undefined;
      return { icon: "💳", human: `Payment link created${amt !== undefined ? ` — $${amt.toFixed(2)}` : ""}` };
    }

    case "payment_received": {
      const amt = payload?.amount as number | undefined;
      return { icon: "💰", human: `Payment received${amt !== undefined ? ` — $${amt.toFixed(2)}` : ""}` };
    }

    case "payment_failed":
      return { icon: "⚠️", human: `Payment attempt failed — ${name} will retry` };

    case "refunded":
      return { icon: "↩️", human: "Payment refunded" };

    case "disputed":
      return { icon: "⚠️", human: "Payment disputed — review required" };

    case "review_received": {
      const stars = payload?.rating as number | undefined;
      return { icon: "⭐", human: `${stars ? `${stars}-star ` : ""}review left by ${name}` };
    }

    case "review_no_response":
      return { icon: "🤷", human: `No review yet from ${name} — about 1 in 3 customers leave one` };

    case "note_added":
      return { icon: "📝", human: "Note added" };

    case "photo_added":
      return { icon: "📷", human: "Photo added to job" };

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
