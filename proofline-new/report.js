function fallbackAudit() {
  return {
    businessName: "Local business",
    market: "local service business",
    score: 74,
    findings: [
      {
        title: "Recent review momentum can improve",
        text: "Ask recent happy customers while the service is still fresh.",
      },
      {
        title: "Owner replies are a quick trust win",
        text: "Unanswered reviews make the business look less active than fast-responding competitors.",
      },
      {
        title: "Customer phrases should become sales proof",
        text: "Strong review language should appear on website pages, social posts, and owner follow-ups.",
      },
    ],
    actions: [
      "Reply to the three most recent unanswered reviews.",
      "Send a compliant review request to customers from the last 14 days.",
      "Publish two strong review quotes on the main service page.",
      "Create a repeat reminder for customers due for the next service.",
      "Track referrals after 5-star reviews and resolved recovery moments.",
    ],
    outreach:
      "Hi, I made a short review-growth audit for your business. I noticed a few quick wins around recent review replies, competitor activity, and customer proof you could reuse on your site.",
  };
}

function readAudit() {
  try {
    const raw = localStorage.getItem("proofline:lastAudit");
    if (!raw) return fallbackAudit();
    return {
      ...fallbackAudit(),
      ...JSON.parse(raw),
    };
  } catch {
    return fallbackAudit();
  }
}

const audit = readAudit();
const reportTitle = document.querySelector("#reportTitle");
const reportSubtitle = document.querySelector("#reportSubtitle");
const auditScore = document.querySelector("#auditScore");
const findingList = document.querySelector("#findingList");
const actionPlan = document.querySelector("#actionPlan");
const outreachCopy = document.querySelector("#outreachCopy");
const copyOutreach = document.querySelector("#copyOutreach");

reportTitle.textContent = `${audit.businessName} has review-growth opportunities.`;
reportSubtitle.textContent = `Market: ${audit.market}. Proofline found practical actions around reviews, replies, proof assets, referrals, and repeat customers.`;
auditScore.textContent = audit.score;

findingList.innerHTML = audit.findings
  .map(
    (finding) => `
      <div>
        <h3>${finding.title}</h3>
        <p>${finding.text}</p>
      </div>
    `,
  )
  .join("");

actionPlan.innerHTML = audit.actions.map((action) => `<li>${action}</li>`).join("");
outreachCopy.textContent = audit.outreach;

copyOutreach.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(audit.outreach);
    copyOutreach.textContent = "Copied";
  } catch {
    copyOutreach.textContent = "Select text to copy";
  }
});
