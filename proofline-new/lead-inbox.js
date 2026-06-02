const fallbackProspects = [
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
  },
];

let prospects = fallbackProspects;
let brief = {
  queueSize: prospects.length,
  sent: 0,
  avgScore: 91,
  bestIndustry: "Cleaning",
  today: "Send specific audit emails to cleaning companies with unanswered reviews.",
};
let selectedId = prospects[0].id;

const leadMetrics = document.querySelector("#leadMetrics");
const leadList = document.querySelector("#leadList");
const leadDetail = document.querySelector("#leadDetail");
const generateProspects = document.querySelector("#generateProspects");

async function fetchJson(url, options) {
  const response = await fetch(url, {
    headers: { "content-type": "application/json" },
    ...options,
  });
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
}

async function loadProspects() {
  try {
    const data = await fetchJson("/api/prospects");
    prospects = data.prospects;
    brief = data.brief;
    selectedId = prospects.find((item) => item.id === selectedId)?.id || prospects[0].id;
  } catch {
    // Static-file fallback keeps the page useful without the local server.
  }
  render();
}

function renderMetrics() {
  leadMetrics.innerHTML = `
    <article><span>Today&apos;s queue</span><strong>${brief.queueSize}</strong><small>start with highest fit</small></article>
    <article><span>Marked sent</span><strong>${brief.sent}</strong><small>outreach actions</small></article>
    <article><span>Average fit score</span><strong>${brief.avgScore}</strong><small>review-gap signal</small></article>
    <article><span>Best niche</span><strong>${brief.bestIndustry}</strong><small>keep testing</small></article>
  `;
}

function renderList() {
  leadList.innerHTML = prospects
    .map(
      (prospect) => `
        <button class="${prospect.id === selectedId ? "is-active" : ""} ${prospect.sent ? "is-done" : ""}" type="button" data-prospect="${prospect.id}">
          <span>
            <b>${prospect.business}</b>
            <small>${prospect.industry} - ${prospect.city} - ${prospect.status}</small>
          </span>
          <em>${prospect.score}</em>
        </button>
      `,
    )
    .join("");
}

function renderDetail() {
  const prospect = prospects.find((item) => item.id === selectedId) || prospects[0];
  leadDetail.innerHTML = `
    <p class="eyebrow">${prospect.status}</p>
    <h2>${prospect.business}</h2>
    <div class="lead-detail-grid">
      <div><span>Why this prospect</span><p>${prospect.reason}</p></div>
      <div><span>Offer to test</span><p>${prospect.offer}</p></div>
      <div><span>Next action</span><p>${prospect.nextAction}</p></div>
      <div><span>Channel</span><p>${prospect.channel}</p></div>
    </div>
    <div class="outreach-panel">
      <h3>Ready-to-send outreach</h3>
      <p>${prospect.outreach}</p>
    </div>
    <div class="outreach-panel founder-brief">
      <h3>Founder brief</h3>
      <p>${brief.today}</p>
    </div>
    <div class="setup-actions">
      <button class="button primary" type="button" data-mark-done="${prospect.id}">${prospect.sent ? "Sent" : "Mark outreach sent"}</button>
      <button class="button secondary" type="button" data-copy-outreach="${prospect.id}">Copy message</button>
      <a class="button secondary" href="./audit-report.html">Open audit report</a>
    </div>
  `;
}

function render() {
  renderMetrics();
  renderList();
  renderDetail();
}

leadList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-prospect]");
  if (!button) return;
  selectedId = button.dataset.prospect;
  render();
});

leadDetail.addEventListener("click", async (event) => {
  const done = event.target.closest("[data-mark-done]");
  if (done) {
    try {
      const data = await fetchJson(`/api/prospects/${done.dataset.markDone}/sent`, { method: "POST" });
      prospects = prospects.map((item) => (item.id === data.prospect.id ? data.prospect : item));
      brief = data.brief;
    } catch {
      prospects = prospects.map((item) =>
        item.id === done.dataset.markDone ? { ...item, sent: true, status: "Sent", nextAction: "Follow up in 2 days" } : item,
      );
      brief = {
        ...brief,
        sent: prospects.filter((item) => item.sent).length,
      };
    }
    render();
    return;
  }

  const copy = event.target.closest("[data-copy-outreach]");
  if (!copy) return;
  const prospect = prospects.find((item) => item.id === copy.dataset.copyOutreach);
  try {
    await navigator.clipboard.writeText(prospect.outreach);
    copy.textContent = "Copied";
  } catch {
    copy.textContent = "Select text";
  }
});

generateProspects.addEventListener("click", loadProspects);

render();
loadProspects();
