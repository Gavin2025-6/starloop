const steps = [
  {
    id: "google",
    name: "Connect Google",
    title: "Connect Google Business Profile",
    description:
      "Proofline needs reviews, business profile details, and reply workflow access. In demo mode, this shows the exact permission and status surface.",
    fields: [
      ["Status", "Ready to connect"],
      ["Data used", "Reviews, rating, profile name, review reply status"],
      ["Owner benefit", "Pull reviews into the action queue and draft replies"],
    ],
    action: "Mark Google connected",
  },
  {
    id: "customers",
    name: "Import customers",
    title: "Import recent customers",
    description:
      "Start with CSV or webhook events. Proofline only sends messages when consent, cooldown, and open-issue checks pass.",
    fields: [
      ["Accepted sources", "CSV, paid invoice, completed job, appointment finished"],
      ["Required columns", "Name, email or phone, service, date, consent"],
      ["Safety", "Opt-outs and open issues suppress automation"],
    ],
    action: "Import demo customers",
  },
  {
    id: "templates",
    name: "Approve templates",
    title: "Approve first request and reply templates",
    description:
      "The owner approves the first campaign templates before automation can send. Sensitive replies always require approval.",
    fields: [
      ["Review request", "Short, honest, service-specific SMS and email"],
      ["Public reply", "Brand voice with risk labels"],
      ["Recovery note", "Human-first language, no pressure for positive reviews"],
    ],
    action: "Approve templates",
  },
  {
    id: "automation",
    name: "Activate automations",
    title: "Activate the first automation rules",
    description:
      "Low-risk internal actions run automatically. Public replies, gifts, recovery, and first campaign sends stay in approval.",
    fields: [
      ["Auto", "Classify reviews, stop follow-ups, update proof library"],
      ["Approval", "Public replies, gifts, sensitive recovery, first batch send"],
      ["Audit", "Every decision stores evidence, rule result, and outcome"],
    ],
    action: "Activate demo rules",
  },
  {
    id: "brief",
    name: "Owner brief",
    title: "Generate the first weekly owner brief",
    description:
      "The weekly brief turns reviews, replies, referrals, repeats, and proof assets into a short Monday action list.",
    fields: [
      ["Top issue", "Weekend wait-time language increased"],
      ["Best proof", "Same-day service and careful cleanup"],
      ["Next move", "Publish proof, send 14 requests, call 2 unhappy customers"],
    ],
    action: "Generate brief",
  },
];

const setupSteps = document.querySelector("#setupSteps");
const setupPanel = document.querySelector("#setupPanel");
const setupScore = document.querySelector("#setupScore");
const setupSummary = document.querySelector("#setupSummary");
let activeStep = steps[0].id;
let completed = new Set(JSON.parse(localStorage.getItem("proofline:setupComplete") || "[]"));

function saveSetup() {
  localStorage.setItem("proofline:setupComplete", JSON.stringify([...completed]));
}

function renderSetupNav() {
  setupSteps.innerHTML = steps
    .map(
      (step, index) => `
        <button class="${activeStep === step.id ? "is-active" : ""} ${completed.has(step.id) ? "is-done" : ""}" type="button" data-step="${step.id}">
          <span>${index + 1}</span>
          <b>${step.name}</b>
          <small>${completed.has(step.id) ? "Complete" : "Pending"}</small>
        </button>
      `,
    )
    .join("");
}

function renderScore() {
  const percent = Math.round((completed.size / steps.length) * 100);
  setupScore.textContent = `${percent}%`;
  setupSummary.textContent =
    percent === 100
      ? "Setup complete. The workspace is ready for the first owner queue."
      : `${steps.length - completed.size} setup steps remain before the first owner brief.`;
}

function renderStep() {
  const step = steps.find((item) => item.id === activeStep) || steps[0];
  setupPanel.innerHTML = `
    <div class="setup-panel-head">
      <p class="eyebrow">${completed.has(step.id) ? "Complete" : "Pending"}</p>
      <h2>${step.title}</h2>
      <p>${step.description}</p>
    </div>
    <div class="setup-field-grid">
      ${step.fields
        .map(
          ([label, value]) => `
            <div>
              <span>${label}</span>
              <b>${value}</b>
            </div>
          `,
        )
        .join("")}
    </div>
    <div class="setup-preview">
      <h3>What the customer sees next</h3>
      <p>${completed.has(step.id) ? "This step is complete and recorded in the setup checklist." : "Completing this step unlocks the next part of the review growth routine."}</p>
    </div>
    <div class="setup-actions">
      <button class="button primary" type="button" data-complete-step="${step.id}">${completed.has(step.id) ? "Completed" : step.action}</button>
      <a class="button secondary" href="./workspace.html">Open workspace</a>
    </div>
  `;
}

function render() {
  renderSetupNav();
  renderScore();
  renderStep();
}

setupSteps.addEventListener("click", (event) => {
  const button = event.target.closest("[data-step]");
  if (!button) return;
  activeStep = button.dataset.step;
  render();
});

setupPanel.addEventListener("click", (event) => {
  const button = event.target.closest("[data-complete-step]");
  if (!button) return;
  completed.add(button.dataset.completeStep);
  saveSetup();
  const currentIndex = steps.findIndex((step) => step.id === button.dataset.completeStep);
  const next = steps[currentIndex + 1];
  if (next) activeStep = next.id;
  render();
});

render();
