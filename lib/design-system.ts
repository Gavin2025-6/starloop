export const ds = {
  colors: {
    bg: {
      dark: "#0A0A0A",
      darkCard: "#111111",
      darkSubtle: "#050505",
      light: "#FFFFFF",
      lightSubtle: "#F9FAFB",
      lightCard: "#F3F4F6",
    },
    text: {
      primary: "#FFFFFF",
      secondary: "#A1A1AA",
      tertiary: "#6B7280",
      muted: "#4F4F4F",
      dark: "#0D1117",
      darkSecondary: "#374151",
      darkTertiary: "#6B7280",
    },
    border: {
      dark: "#1F1F1F",
      darkSubtle: "#2F2F2F",
      light: "#E5E7EB",
      lightSubtle: "#F3F4F6",
    },
    accent: {
      teal: "#00C9A7",
      blue: "#4A6FFF",
      green: "#10B981",
      red: "#EF4444",
      purple: "#6366F1",
    },
    gradient: {
      primary: "linear-gradient(135deg, #00C9A7, #4A6FFF)",
    },
  },
  radius: {
    sm: "6px",
    md: "8px",
    lg: "12px",
    xl: "16px",
    "2xl": "20px",
    full: "9999px",
  },
  shadow: {
    sm: "0 1px 2px rgba(0,0,0,0.05)",
    md: "0 1px 3px rgba(0,0,0,0.1)",
    lg: "0 4px 16px rgba(0,0,0,0.15)",
  },
} as const;
