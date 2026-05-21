import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function CardSkeleton() {
  return (
    <div className="rounded-xl border p-4 space-y-3">
      {/* Avatar + name row */}
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-muted ring-2 ring-card" />
        </div>
        <div className="flex-1 space-y-1.5 pt-0.5">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      {/* Excerpt */}
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
      {/* Badges */}
      <div className="flex gap-1.5">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-4 w-2/3" />
      <div className="space-y-2 pt-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}

/** Skeleton matching detail page layout (header + tabs card) to prevent layout shift on load. */
export function DetailPageSkeleton({ tabs = 4 }: { tabs?: number }) {
  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6 flex items-start gap-4">
        <Skeleton className="h-9 w-9 shrink-0 rounded-md" />
        <Skeleton className="h-12 w-12 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="max-w-4xl rounded-xl border bg-card p-3 shadow-sm sm:p-4">
        <div className="flex gap-2 border-b pb-2">
          {Array.from({ length: tabs }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-md" />
          ))}
        </div>
        <div className="mt-4 space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}

/** Spinner that only appears after a delay (default 500ms) to avoid flicker on fast loads. */
export function DeferredSpinner({ delay = 500 }: { delay?: number }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  if (!show) return null;

  return (
    <div className="flex items-center justify-center py-12">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
    </div>
  );
}
