import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "dark" | "light";
}

export default function Card({ children, className, variant = "light" }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl",
        variant === "dark"
          ? "bg-[#111111] border border-[#1F1F1F]"
          : "bg-white border border-[#E5E7EB]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("px-6 py-4 border-b border-gray-100", className)}>
      {children}
    </div>
  );
}

export function CardBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("px-6 py-4", className)}>{children}</div>;
}
