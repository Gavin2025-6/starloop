"use client";

export default function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ animation: "pageFadeIn 150ms ease-out" }}>
      {children}
    </div>
  );
}
