export function buildCheckAvailabilityTool(webhookUrl: string) {
  return {
    name: "check_availability",
    description:
      "Check available appointment slots for a given date. ALWAYS call this before offering any time slots to the customer. Never guess or make up available times.",
    parameters: {
      type: "object",
      properties: {
        date: {
          type: "string",
          description:
            "The date to check in YYYY-MM-DD format. Convert 'today' to today's date, 'tomorrow' to tomorrow's date.",
        },
      },
      required: ["date"],
    },
    serverUrl: webhookUrl,
  };
}
