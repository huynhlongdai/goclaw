import { ChevronRight } from "lucide-react";
import { Link } from "react-router";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav aria-label="breadcrumb" className={cn("flex items-center gap-1 text-xs text-muted-foreground", className)}>
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/50" />}
            {item.href && !isLast ? (
              <Link to={item.href} className="hover:text-foreground transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className={cn(isLast ? "font-medium text-foreground/80 truncate max-w-[200px]" : "")}>
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
