import { cn } from "@/lib/utils";
import { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({ label, error, className, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-[#374151]">{label}</label>
      )}
      <input
        className={cn(
          "w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-sm",
          "focus:outline-none focus:ring-2 focus:ring-[#0D1117] focus:border-transparent",
          "transition-all duration-200 placeholder:text-[#9CA3AF] text-[#0D1117]",
          error && "border-[#EF4444] focus:ring-[#EF4444]",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-[#EF4444]">{error}</p>}
    </div>
  );
}
