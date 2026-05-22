import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import CapabilityExplorer from "@/components/landing/CapabilityExplorer";
import Logo from "@/components/ui/Logo";

const workflow = [
  "Ask the right customers for feedback at the right moment",
  "Separate praise, complaints, silence, and public-review risk",
  "Create the next best action for the owner",
  "Follow up until the issue is closed or escalated",
  "Turn repeated issues into a weekly improvement plan",
];

export default async function LandingPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#070A12",
        color: "#FFFFFF",
        fontFamily: "var(--font-geist), -apple-system, sans-serif",
      }}
    >
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          height: 68,
          background: "rgba(7,10,18,0.9)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-5 sm:px-8">
          <Logo variant="dark" height={30} />
          <div className="flex items-center gap-3 sm:gap-5">
            <Link href="/auth/login" className="hidden text-sm transition-colors hover:text-white sm:block" style={{ color: "#A7B0C4" }}>
              Log in
            </Link>
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-transform hover:-translate-y-0.5"
              style={{ background: "#FFFFFF", color: "#07142F" }}
            >
              Start free
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </nav>

      <main>
        <section className="relative overflow-hidden">
          <div className="mx-auto grid min-h-[calc(100svh-68px)] max-w-7xl grid-cols-1 items-center gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:py-8">
            <div>
              <h1
                className="max-w-3xl font-extrabold"
                style={{
                  fontSize: "clamp(2.85rem, 5.25vw, 4.9rem)",
                  lineHeight: 0.98,
                  letterSpacing: 0,
                }}
              >
                We turn unhappy customers into retained revenue.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 sm:text-lg sm:leading-8" style={{ color: "#A7B0C4" }}>
                StarLoop finds why customers leave, recovers them before they post, and tracks every dollar saved.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/auth/register"
                  className="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3.5 text-base font-semibold transition-transform hover:-translate-y-0.5"
                  style={{ background: "#FFFFFF", color: "#07142F" }}
                >
                  Start free
                  <ArrowRight size={18} />
                </Link>
                <a
                  href="#product"
                  className="inline-flex items-center justify-center rounded-lg px-6 py-3.5 text-base font-semibold transition-colors hover:text-white"
                  style={{ border: "1px solid rgba(255,255,255,0.14)", color: "#A7B0C4" }}
                >
                  See how it works
                </a>
              </div>
            </div>

            <div
              className="relative mx-auto w-full max-w-[620px] rounded-[26px] p-3 sm:p-4"
              style={{
                background: "linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.04))",
                border: "1px solid rgba(255,255,255,0.12)",
                boxShadow: "0 28px 90px rgba(0,0,0,0.36)",
              }}
            >
              <div className="rounded-[20px] bg-white p-4 text-[#07142F] sm:p-5">
                <div className="flex items-center justify-between border-b border-[#E8ECF3] pb-3">
                  <Logo height={25} />
                  <span className="rounded-full bg-[#EAFBF8] px-3 py-1 text-xs font-semibold text-[#087C6D]">
                    Today
                  </span>
                </div>
                <div className="mt-4 grid gap-3">
                  <div className="rounded-xl border border-[#E8ECF3] p-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">3 customers need action</p>
                        <p className="mt-1 text-sm leading-5 text-[#536079]">
                          One low rating, one silent follow-up, and one new promoter ready for a public review request.
                        </p>
                      </div>
                      <span className="rounded-full bg-[#FFF4E5] px-2.5 py-1 text-xs font-semibold text-[#B76200]">Priority</span>
                    </div>
                  </div>
                  <div className="rounded-xl border border-[#E8ECF3] bg-[#F8FAFC] p-3.5">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7F8AA3]">Next best actions</p>
                    <div className="mt-3 grid gap-2">
                      {[
                        "Send recovery message before the customer posts publicly",
                        "Ask happy customer for a review while the visit is fresh",
                        "Show wait-time complaints in this week's action report",
                      ].map((action) => (
                        <div key={action} className="flex gap-2 text-sm leading-5 text-[#28354D]">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#18D6C6]" />
                          <span>{action}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      ["18", "requests sent"],
                      ["5", "risks sorted"],
                      ["3", "actions due"],
                    ].map(([value, label]) => (
                      <div key={label} className="rounded-xl border border-[#E8ECF3] p-2.5 text-center">
                        <div className="text-lg font-bold">{value}</div>
                        <div className="mt-1 text-xs text-[#7F8AA3]">{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <CapabilityExplorer />

        <section className="border-t border-white/10 bg-[#070A12] py-20">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-5 sm:px-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
            <div>
              <h2 className="max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">
                The value is not the sentence. The value is the saved customer.
              </h2>
              <p className="mt-5 max-w-xl text-base leading-8" style={{ color: "#A7B0C4" }}>
                A reply is easy to copy from AI. What the owner needs is knowing which customer matters, what action to take, whether it was handled, and what pattern is hurting the business.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["Find", "Spot the customer who is likely to complain, churn, or praise publicly."],
                ["Act", "Create the recovery task, review request, follow-up, or owner approval item."],
                ["Learn", "Remember the pattern so repeated service issues become visible."],
              ].map(([title, body]) => (
                <div
                  key={title}
                  className="rounded-2xl p-5"
                  style={{
                    background: "rgba(255,255,255,0.045)",
                    border: "1px solid rgba(255,255,255,0.10)",
                  }}
                >
                  <p className="text-sm font-semibold" style={{ color: "#18D6C6" }}>{title}</p>
                  <p className="mt-4 text-base leading-7" style={{ color: "#D9E0EF" }}>{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="workflow" className="border-y border-white/10 bg-[#0B1020] py-24">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-5 sm:px-8 lg:grid-cols-[0.88fr_1.12fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: "#18D6C6" }}>
                How it works
              </p>
              <h2 className="mt-4 text-4xl font-bold leading-tight sm:text-5xl">
                More than a reply box.
              </h2>
              <p className="mt-5 text-base leading-8" style={{ color: "#A7B0C4" }}>
                ChatGPT can write a sentence. StarLoop runs the daily loop around that sentence: customer requests, risk triage, recovery follow-up, approval, and owner-ready reporting.
              </p>
            </div>
            <div className="grid gap-3">
              {workflow.map((step, index) => (
                <div
                  key={step}
                  className="flex items-center gap-4 rounded-xl p-4"
                  style={{ background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.10)" }}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold" style={{ background: "#FFFFFF", color: "#07142F" }}>
                    {index + 1}
                  </div>
                  <span style={{ color: "#D9E0EF" }}>{step}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-white/10 py-20">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-5 sm:px-8 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-4xl font-bold">Start free. Upgrade only when the system is useful.</h2>
              <p className="mt-3 text-base" style={{ color: "#A7B0C4" }}>
                Start with the workflow, then upgrade inside the product when reputation work becomes part of daily operations.
              </p>
            </div>
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 rounded-lg px-6 py-3.5 text-base font-bold transition-transform hover:-translate-y-0.5"
              style={{ background: "#FFFFFF", color: "#07142F" }}
            >
              Start free
              <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 py-10">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 px-5 sm:flex-row sm:items-center sm:px-8">
          <Logo variant="dark" height={26} showTagline />
          <div className="flex flex-wrap gap-5 text-sm" style={{ color: "#7F8AA3" }}>
            <a href="#product" className="hover:text-white">Product</a>
            <a href="#workflow" className="hover:text-white">Workflow</a>
            <span>© 2026 StarLoop</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
