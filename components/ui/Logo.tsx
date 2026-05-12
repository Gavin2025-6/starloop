export default function Logo({ variant = 'light', height = 32 }: { variant?: 'dark' | 'light'; height?: number }) {
  const iconSize = height * 1.1;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: height * 0.3 }}>
      <svg width={iconSize} height={iconSize} viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="logo-star" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00C9A7" />
            <stop offset="100%" stopColor="#4A6FFF" />
          </linearGradient>
          <linearGradient id="logo-orbit" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00C9A7" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#4A6FFF" stopOpacity="0.85" />
          </linearGradient>
          <marker id="logo-arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="url(#logo-orbit)" />
          </marker>
        </defs>
        <ellipse
          cx="22"
          cy="22"
          rx="18"
          ry="9"
          stroke="url(#logo-orbit)"
          strokeWidth="2"
          fill="none"
          strokeDasharray="56 56"
          strokeDashoffset="28"
          transform="rotate(-25 22 22)"
          markerEnd="url(#logo-arrow)"
        />
        <polygon
          points="22,4 24.1,15 35.1,15 26.4,21.5 29.5,32.5 22,26.1 14.5,32.5 17.6,21.5 8.9,15 19.9,15"
          stroke="url(#logo-star)"
          strokeWidth="2.5"
          fill="none"
          strokeLinejoin="round"
        />
        <path d="M38 2 L39 5 L42 6 L39 7 L38 10 L37 7 L34 6 L37 5Z" fill="#00C9A7" />
      </svg>
      <span style={{ fontWeight: 700, fontSize: height * 0.7, lineHeight: 1 }}>
        <span style={{ color: variant === 'dark' ? '#FFFFFF' : '#0D1117' }}>star</span>
        <span style={{ color: '#00C9A7' }}>loop</span>
      </span>
    </div>
  );
}
