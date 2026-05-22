import { useId } from "react";

type LogoProps = {
  variant?: "dark" | "light";
  height?: number;
  showTagline?: boolean;
};

export default function Logo({
  variant = "light",
  height = 32,
  showTagline = false,
}: LogoProps) {
  const id = useId().replace(/:/g, "");
  const iconSize = Math.round(height * 1.22);
  const textColor = variant === "dark" ? "#FFFFFF" : "#07142F";
  const subText = variant === "dark" ? "#A7B0C4" : "#536079";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: Math.round(height * 0.34) }}>
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`${id}-mark`} x1="10" y1="8" x2="52" y2="56" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#18D6C6" />
            <stop offset="0.52" stopColor="#1FA4F5" />
            <stop offset="1" stopColor="#5268FF" />
          </linearGradient>
          <linearGradient id={`${id}-shine`} x1="42" y1="7" x2="57" y2="21" gradientUnits="userSpaceOnUse">
            <stop stopColor="#42F2D5" />
            <stop offset="1" stopColor="#1FA4F5" />
          </linearGradient>
          <filter id={`${id}-shadow`} x="-10" y="-8" width="84" height="84" colorInterpolationFilters="sRGB">
            <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#1E6BFF" floodOpacity="0.13" />
          </filter>
        </defs>
        <g filter={`url(#${id}-shadow)`}>
          <path
            d="M32 10.4L37.1 24.4H51.7L40 33.2L44.6 47.6L32 39.1L19.4 47.6L24 33.2L12.3 24.4H26.9L32 10.4Z"
            stroke={`url(#${id}-mark)`}
            strokeWidth="4"
            strokeLinejoin="round"
            fill="rgba(255,255,255,0.02)"
          />
        </g>
        <path d="M49.1 7.2L50.9 12.4L56.1 14.2L50.9 16L49.1 21.2L47.3 16L42.1 14.2L47.3 12.4L49.1 7.2Z" fill={`url(#${id}-shine)`} />
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: Math.max(2, Math.round(height * 0.08)) }}>
        <div
          style={{
            color: textColor,
            fontSize: Math.round(height * 0.92),
            fontWeight: 760,
            lineHeight: 0.9,
            letterSpacing: 0,
          }}
        >
          starl
          <svg
            viewBox="0 0 34 18"
            width={Math.round(height * 0.98)}
            height={Math.round(height * 0.54)}
            style={{ display: "inline-block", verticalAlign: "-0.04em", margin: "0 1px" }}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M17 9C13.7 3.9 10.8 2.6 7.8 3.2C4.7 3.9 3 6.1 3 9C3 11.9 5.1 14.4 8.2 14.7C11.6 15.1 14.3 12.3 17 9ZM17 9C20.3 14.1 23.2 15.4 26.2 14.8C29.3 14.1 31 11.9 31 9C31 6.1 28.9 3.6 25.8 3.3C22.4 2.9 19.7 5.7 17 9Z"
              stroke="#18D6C6"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          p
        </div>
        {showTagline && (
          <div
            style={{
              color: subText,
              fontSize: Math.max(8, Math.round(height * 0.22)),
              fontWeight: 650,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
            }}
          >
            Reviews · Reputation · Growth
          </div>
        )}
      </div>
    </div>
  );
}
