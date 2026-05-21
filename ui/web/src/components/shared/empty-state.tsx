import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  size = "md",
}: EmptyStateProps) {
  const iconSize = size === "sm" ? "h-8 w-8" : size === "lg" ? "h-14 w-14" : "h-10 w-10";
  const iconInner = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-7 w-7" : "h-5 w-5";
  const py = size === "sm" ? "py-10" : size === "lg" ? "py-24" : "py-16";

  return (
    <div className={cn("flex flex-col items-center justify-center text-center", py, className)}>
      {Icon && (
        <div className={cn(
          "mb-5 flex items-center justify-center rounded-2xl",
          "bg-gradient-to-b from-muted to-muted/60",
          "border border-border/50 shadow-sm",
          iconSize,
        )}>
          <Icon className={cn(iconInner, "text-muted-foreground/70")} />
        </div>
      )}
      <h3 className={cn(
        "font-semibold text-foreground/80",
        size === "sm" ? "text-sm" : "text-base",
      )}>
        {title}
      </h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
