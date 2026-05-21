import { ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";
import { springTransition } from "@/lib/animations";
import { cn } from "@/lib/utils";

const PANEL_WIDTH = 240;

interface SidePanelProps {
  title: string;
  children: React.ReactNode;
  onCollapse: () => void;
  className?: string;
}

export function SidePanel({ title, children, onCollapse, className }: SidePanelProps) {
  return (
    <motion.div
      key="side-panel"
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: PANEL_WIDTH, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={springTransition}
      style={{ overflow: "hidden", flexShrink: 0 }}
    >
      <div
        style={{ width: PANEL_WIDTH }}
        className={cn(
          "flex h-full flex-col border-r bg-sidebar text-sidebar-foreground",
          className,
        )}
      >
        {/* Panel header */}
        <div className="flex h-12 shrink-0 items-center justify-between border-b px-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </span>
          <button
            onClick={onCollapse}
            className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer"
            title="Collapse panel"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto scrollbar-none">
          {children}
        </div>
      </div>
    </motion.div>
  );
}
