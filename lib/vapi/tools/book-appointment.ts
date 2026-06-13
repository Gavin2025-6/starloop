export function buildBookAppointmentTool(webhookUrl: string) {
  return {
    name: "book_appointment",
    description:
      "Book an appointment after the customer has confirmed ALL details. Only call this once you have: customer name, phone, service address, service description, date, and chosen time slot.",
    parameters: {
      type: "object",
      properties: {
        customerName:       { type: "string", description: "Customer's full name" },
        customerPhone:      { type: "string", description: "Customer's phone number" },
        customerAddress:    { type: "string", description: "Full service address" },
        serviceDescription: { type: "string", description: "Description of the service needed" },
        appointmentDate:    { type: "string", description: "Date in YYYY-MM-DD format" },
        appointmentTime:    { type: "string", description: "Time slot e.g. '2:00 PM'" },
        estimatedDuration:  { type: "number", description: "Estimated duration in minutes, default 90" },
      },
      required: ["customerName", "customerPhone", "customerAddress", "serviceDescription", "appointmentDate", "appointmentTime"],
    },
    serverUrl: webhookUrl,
  };
}
