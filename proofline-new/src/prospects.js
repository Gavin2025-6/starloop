const prospects = [
  {
    id: "sparkle",
    business: "Sparkle Home Cleaning",
    industry: "Cleaning",
    city: "Toronto",
    score: 91,
    status: "Audit ready",
    reason: "Competitor review velocity is higher, and four recent reviews have no owner reply.",
    offer: "$99 setup: reply templates, first review request routine, and homepage proof suggestions.",
    nextAction: "Send audit email today",
    channel: "Email",
    outreach:
      "Hi, I made a short review-growth audit for Sparkle Home Cleaning. You already have solid customer proof, but nearby competitors are getting more recent Google activity. I found a few quick wins around unanswered reviews and proof you could reuse on your site. If useful, I can help set up the first review routine this week.",
    sent: false,
    replies: 0,
  },
  {
    id: "northside",
    business: "Northside Auto Detail",
    industry: "Auto",
    city: "Mississauga",
    score: 84,
    status: "Email ready",
    reason: "Strong rating, weak response coverage, and service phrases not reused on the website.",
    offer: "$149/month routine: weekly owner brief, review requests, and reply queue.",
    nextAction: "Send first email, follow up in 2 days",
    channel: "Website contact form",
    outreach:
      "Hi, I reviewed Northside Auto Detail's public reviews and noticed a simple opportunity: your happy customers mention quality and convenience, but that proof is not being reused consistently. I made a short audit and can help set up the first review/reply routine if useful.",
    sent: false,
    replies: 0,
  },
  {
    id: "brightdental",
    business: "Bright Dental Studio",
    industry: "Dental",
    city: "Toronto",
    score: 68,
    status: "Human check",
    reason: "Healthcare category needs careful language. Review reply value is clear, but outreach should avoid aggressive claims.",
    offer: "Free audit first, no software pitch until they request setup.",
    nextAction: "Rewrite outreach more conservatively",
    channel: "Email",
    outreach:
      "Hi, I made a small review-response audit for Bright Dental Studio. It focuses on simple public trust improvements: unanswered reviews, response consistency, and patient-friendly proof on your site. Happy to send it over if useful.",
    sent: false,
    replies: 0,
  },
  {
    id: "rapidrepair",
    business: "Rapid Repair HVAC",
    industry: "Home services",
    city: "Brampton",
    score: 88,
    status: "Follow-up due",
    reason: "High urgency service category, strong review ROI, and several emergency-service phrases to reuse.",
    offer: "$99 setup plus first 50 review requests imported from completed jobs.",
    nextAction: "Send second follow-up with one specific finding",
    channel: "Email",
    outreach:
      "Quick follow-up. One finding from the audit: your reviews already mention emergency response, but that proof is not visible enough on the service page. I can help turn those reviews into a simple proof block and review request routine.",
    sent: false,
    replies: 0,
  },
];

function getProspects() {
  return prospects;
}

function markProspectSent(id) {
  const prospect = prospects.find((item) => item.id === id);
  if (!prospect) return undefined;
  prospect.sent = true;
  prospect.status = "Sent";
  prospect.nextAction = "Follow up in 2 days if no reply";
  return prospect;
}

function getFounderBrief() {
  const sent = prospects.filter((item) => item.sent).length;
  const avgScore = Math.round(prospects.reduce((sum, item) => sum + item.score, 0) / prospects.length);
  const byIndustry = prospects.reduce((acc, item) => {
    acc[item.industry] = (acc[item.industry] || 0) + 1;
    return acc;
  }, {});
  const bestIndustry = Object.entries(byIndustry).sort((a, b) => b[1] - a[1])[0][0];

  return {
    queueSize: prospects.length,
    sent,
    avgScore,
    bestIndustry,
    today:
      "Send specific audit emails to cleaning and home-service companies. Avoid long product pitches; sell the first review routine setup.",
  };
}

module.exports = {
  getFounderBrief,
  getProspects,
  markProspectSent,
};
