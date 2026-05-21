import { useId } from "react";
import { Link } from "react-router";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";

export function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  sparkline,
  trend,
  href,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  sparkline?: number[];
  trend?: number | null;
  href?: string;
}) {
  const uid = useId();
  const gradId = `spark-${uid.replace(/:/g, "")}`;
  const sparkData = sparkline?.map((v) => ({ v }));
  const hasTrend = trend != null && trend !== 0;

  const inner = (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.0, 0.0, 0.2, 1.0] }}
      className="group rounded-xl border bg-card p-5 transition-shadow hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-primary/10 p-2.5 transition-colors group-hover:bg-primary/15">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <div className="mt-1 flex items-end gap-2">
            <p className="text-2xl font-bold leading-none tracking-tight">{value}</p>
            {hasTrend && (
              <span
                className={`mb-0.5 flex items-center gap-0.5 text-xs font-semibold ${
                  trend > 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-500 dark:text-red-400"
                }`}
              >
                {trend > 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {trend > 0 ? `+${trend}%` : `${trend}%`}
              </span>
            )}
          </div>
          {sub && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{sub}</p>
          )}
        </div>
      </div>

      {sparkData && sparkData.length > 1 && (
        <div className="mt-4 h-[36px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke="var(--color-primary)"
                strokeWidth={1.5}
                fill={`url(#${gradId})`}
                dot={false}
                isAnimationActive={true}
                animationDuration={800}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );

  if (href) {
    return <Link to={href} className="block">{inner}</Link>;
  }
  return inner;
}
