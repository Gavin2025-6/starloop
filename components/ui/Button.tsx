"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

const variants = {
  primary: "bg-[#0D1117] text-white hover:bg-[#1a1a1a]",
  secondary: "border border-[#E5E7EB] text-[#374151] hover:bg-[#F9FAFB]",
  ghost: "text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#0D1117]",
  danger: "bg-[#EF4444] text-white hover:bg-[#DC2626]",
};

const sizes = {
  sm: "px-3 py-1.5 text-xs rounded-lg",
  md: "px-4 py-2.5 text-sm rounded-lg",
  lg: "px-6 py-3 text-base rounded-lg",
};

export default function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  onMouseEnter,
  onMouseLeave,
  ...props
}: ButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const disabled = props.disabled;

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
      style={{
        transform: isHovered && !disabled ? "scale(1.02)" : "scale(1)",
        boxShadow: isHovered && !disabled ? "0 2px 8px rgba(0,0,0,0.1)" : undefined,
      }}
      onMouseEnter={(e) => {
        if (!disabled) setIsHovered(true);
        onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        setIsHovered(false);
        onMouseLeave?.(e);
      }}
      {...props}
    >
      {children}
    </button>
  );
}
