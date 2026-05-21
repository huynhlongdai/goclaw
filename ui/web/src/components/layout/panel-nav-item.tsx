import { Link, useLocation } from "react-router";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PanelNavGroupProps {
  label: string;
  children: React.ReactNode;
}

export function PanelNavGroup({ label, children }: PanelNavGroupProps) {
  return (
    <div className="space-y-0.5">
      <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
        {label}
      </p>
      <div className="space-y-px">{children}</div>
    </div>
  );
}

interface PanelNavItemProps {
  to: string;
  icon: LucideIcon;
  label: string;
  badge?: number;
}

export function PanelNavItem({ to, icon: Icon, label, badge }: PanelNavItemProps) {
  const location = useLocation();
  const active =
    location.pathname === to || location.pathname.startsWith(to + "/");

  return (
    <Link
      to={to}
      className={cn(
        "group relative flex h-9 items-center gap-2.5 rounded-lg px-3 text-sm transition-all duration-100",
        active
          ? "bg-sidebar-accent text-sidebar-primary font-medium"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
      )}
    >
      {/* Active left bar */}
      {active && (
        <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-sidebar-primary" />
      )}
      <Icon
        className={cn(
          "h-4 w-4 shrink-0 transition-colors",
          active ? "text-sidebar-primary" : "text-sidebar-foreground/40 group-hover:text-sidebar-foreground/70",
        )}
      />
      <span className="flex-1 truncate">{label}</span>
      {badge != null && badge > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-semibold text-destructive-foreground">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}
