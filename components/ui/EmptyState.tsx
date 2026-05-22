"use client";

interface EmptyStateProps {
  type: "reviews" | "requests" | "reports" | "customers";
  title: string;
  description?: string;
  action?: React.ReactNode;
}

const starSvg = (
  <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Decorative small stars */}
    <circle cx="24" cy="30" r="3" fill="#D1D5DB" />
    <circle cx="96" cy="24" r="2.5" fill="#E5E7EB" />
    <circle cx="34" cy="90" r="3" fill="#E5E7EB" />
    <circle cx="90" cy="92" r="2" fill="#D1D5DB" />
    <circle cx="18" cy="60" r="2" fill="#E5E7EB" />
    <circle cx="104" cy="60" r="3" fill="#D1D5DB" />
    {/* Main star outline */}
    <path
      d="M60 14L69.52 43.64H100.82L74.65 62.36L84.17 92L60 73.28L35.83 92L45.35 62.36L19.18 43.64H50.48L60 14Z"
      fill="#E5E7EB"
      stroke="#D1D5DB"
      strokeWidth="1.5"
    />
    {/* Filled points at top-left and bottom */}
    <path
      d="M60 14L69.52 43.64H100.82L74.65 62.36L60 73.28L45.35 62.36L19.18 43.64H50.48L60 14Z"
      fill="#00C9A7"
      fillOpacity="0.25"
    />
    {/* Accent filled star points */}
    <path
      d="M60 14L69.52 43.64H100.82L74.65 62.36"
      fill="#00C9A7"
      fillOpacity="0.4"
    />
    <circle cx="60" cy="73.28" r="8" fill="#00C9A7" fillOpacity="0.35" />
    {/* Center dot */}
    <circle cx="60" cy="52" r="3" fill="#00C9A7" />
  </svg>
);

const envelopeSvg = (
  <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Envelope body */}
    <rect x="18" y="36" width="84" height="56" rx="6" fill="#E5E7EB" stroke="#D1D5DB" strokeWidth="1.5" />
    {/* Envelope flap */}
    <path
      d="M18 42L60 68L102 42"
      stroke="#D1D5DB"
      strokeWidth="1.5"
      fill="#F3F4F6"
    />
    {/* Accent send arrow coming out of envelope */}
    <path
      d="M60 68L72 52"
      stroke="#00C9A7"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <path
      d="M62 58L72 52L66 62"
      stroke="#00C9A7"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Arrow accent */}
    <circle cx="76" cy="46" r="3" fill="#00C9A7" />
  </svg>
);

const barChartSvg = (
  <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Background grid line */}
    <line x1="20" y1="30" x2="100" y2="30" stroke="#F3F4F6" strokeWidth="1" strokeDasharray="4 4" />
    <line x1="20" y1="50" x2="100" y2="50" stroke="#F3F4F6" strokeWidth="1" strokeDasharray="4 4" />
    <line x1="20" y1="70" x2="100" y2="70" stroke="#F3F4F6" strokeWidth="1" strokeDasharray="4 4" />
    {/* Y-axis */}
    <line x1="20" y1="20" x2="20" y2="95" stroke="#D1D5DB" strokeWidth="1.5" />
    {/* X-axis */}
    <line x1="20" y1="95" x2="100" y2="95" stroke="#D1D5DB" strokeWidth="1.5" />
    {/* Bar 1 - muted */}
    <rect x="30" y="58" width="14" height="37" rx="3" fill="#E5E7EB" />
    {/* Bar 2 - accent */}
    <rect x="50" y="36" width="14" height="59" rx="3" fill="#00C9A7" fillOpacity="0.6" />
    {/* Bar 3 - muted */}
    <rect x="70" y="52" width="14" height="43" rx="3" fill="#E5E7EB" />
    {/* Trend arrow on accent bar */}
    <path
      d="M68 32L56 38"
      stroke="#00C9A7"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const customersSvg = (
  <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Person 1 - left */}
    <circle cx="40" cy="36" r="12" fill="#E5E7EB" stroke="#D1D5DB" strokeWidth="1.5" />
    <path
      d="M16 92C16 72 26 58 40 58C54 58 64 72 64 92"
      fill="#E5E7EB"
      stroke="#D1D5DB"
      strokeWidth="1.5"
    />
    {/* Person 2 - right */}
    <circle cx="80" cy="32" r="11" fill="#E5E7EB" stroke="#D1D5DB" strokeWidth="1.5" />
    <path
      d="M58 88C58 70 67 56 80 56C93 56 102 70 102 88"
      fill="#E5E7EB"
      stroke="#D1D5DB"
      strokeWidth="1.5"
    />
    {/* Accent overlapping node / connection */}
    <circle cx="60" cy="48" r="6" fill="#00C9A7" fillOpacity="0.3" stroke="#00C9A7" strokeWidth="1.5" />
    <line
      x1="43"
      y1="42"
      x2="57"
      y2="48"
      stroke="#00C9A7"
      strokeWidth="1.5"
      strokeDasharray="3 3"
    />
    <line
      x1="63"
      y1="48"
      x2="77"
      y2="38"
      stroke="#00C9A7"
      strokeWidth="1.5"
      strokeDasharray="3 3"
    />
  </svg>
);

export default function EmptyState({ type, title, description, action }: EmptyStateProps) {
  const illustrations: Record<string, React.ReactNode> = {
    reviews: starSvg,
    requests: envelopeSvg,
    reports: barChartSvg,
    customers: customersSvg,
  };

  return (
    <div
      className="bg-white rounded-xl p-12 text-center"
      style={{
        border: "1px solid #E5E7EB",
        animation: "pageFadeIn 200ms ease-out",
      }}
    >
      <div style={{ marginBottom: "20px", opacity: 0.6, display: "flex", justifyContent: "center" }}>
        {illustrations[type]}
      </div>
      <h3 className="text-base font-semibold" style={{ color: "#0D1117", marginBottom: "4px" }}>
        {title}
      </h3>
      {description && (
        <p className="text-sm" style={{ color: "#6B7280", marginBottom: "16px", maxWidth: "320px", marginLeft: "auto", marginRight: "auto" }}>
          {description}
        </p>
      )}
      {action && <div style={{ marginTop: "8px" }}>{action}</div>}
    </div>
  );
}
