const auditForm = document.querySelector("#auditForm");

function createLocalAudit({ business, market }) {
  const businessName = business
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "")
    .replace(/maps\.google\.com/i, "Google Business profile")
    .trim();

  const normalizedName = businessName || "Local business";
  const normalizedMarket = market || "local service business";

  return {
    id: `audit-${Date.now()}`,
    businessName: normalizedName,
    market: normalizedMarket,
    score: 74,
    generatedAt: new Date().toISOString(),
    findings: [
      {
        title: "Recent review momentum can improve",
        text: `${normalizedName} should ask recent happy customers while the service is still fresh.`,
      },
      {
        title: "Owner replies are a quick trust win",
        text: "Unanswered reviews make the business look less active than competitors with fast public replies.",
      },
      {
        title: "Your best customer phrases should sell for you",
        text: "Strong review language should appear on the website, local pages, social posts, and sales follow-ups.",
      },
    ],
    actions: [
      "Reply to the three most recent unanswered reviews.",
      "Send a compliant review request to customers from the last 14 days.",
      "Publish two strong review quotes on the main service page.",
      "Create a repeat reminder for customers due for the next service.",
      "Track referrals after 5-star reviews and resolved recovery moments.",
    ],
    outreach: `Hi, I made a short review-growth audit for ${normalizedName}. I noticed a few quick wins around recent review replies, competitor activity, and customer proof you could reuse on your site. If useful, I can help set up the first review routine this week.`,
  };
}

if (auditForm) {
  auditForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(auditForm);
    const audit = createLocalAudit({
      business: String(formData.get("business") || ""),
      market: String(formData.get("market") || ""),
    });

    localStorage.setItem("proofline:lastAudit", JSON.stringify(audit));
    window.location.href = `./audit-report.html?id=${encodeURIComponent(audit.id)}`;
  });
}
