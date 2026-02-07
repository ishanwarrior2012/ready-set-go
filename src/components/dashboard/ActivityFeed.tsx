import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import {
  Mountain,
  Flame,
  AlertTriangle,
  ChevronRight,
  Waves,
  Cloud,
  RefreshCw,
  Newspaper,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLiveActivity, ActivityItem } from "@/hooks/useLiveActivity";
import { Skeleton } from "@/components/ui/skeleton";

const iconMap = {
  earthquake: Mountain,
  volcano: Flame,
  weather: AlertTriangle,
  tsunami: Waves,
  news: Newspaper,
};

const colorMap = {
  earthquake: "bg-amber-500/10 text-amber-500",
  volcano: "bg-red-500/10 text-red-500",
  weather: "bg-sky-500/10 text-sky-500",
  tsunami: "bg-blue-500/10 text-blue-500",
  news: "bg-purple-500/10 text-purple-500",
};

const linkMap = {
  earthquake: "/earthquakes",
  volcano: "/volcanoes",
  weather: "/weather",
  tsunami: "/tsunami",
  news: "/search",
};

const severityStyles = {
  low: "",
  medium: "border-l-2 border-l-amber-500",
  high: "border-l-2 border-l-orange-500",
  critical: "border-l-2 border-l-destructive bg-destructive/5",
};

interface ActivityFeedProps {
  className?: string;
  maxItems?: number;
}

export function ActivityFeed({ className, maxItems = 10 }: ActivityFeedProps) {
  const { data: activities, isLoading, error } = useLiveActivity();

  const items = activities?.slice(0, maxItems) || [];

  if (isLoading) {
    return (
      <section className={className}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-heading text-lg font-semibold flex items-center gap-2">
            Recent Activity
            <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
          </h2>
        </div>
        <Card className="divide-y divide-border overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 p-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </Card>
      </section>
    );
  }

  if (error || items.length === 0) {
    return (
      <section className={className}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-heading text-lg font-semibold">Recent Activity</h2>
          <Link
            to="/notifications"
            className="text-sm text-primary flex items-center gap-1 hover:underline"
          >
            View all
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <Card className="p-8 text-center">
          <Cloud className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">No recent activity</p>
          <p className="text-xs text-muted-foreground/70">Check back later for updates</p>
        </Card>
      </section>
    );
  }

  return (
    <section className={className}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-heading text-lg font-semibold flex items-center gap-2">
          Recent Activity
          <span className="flex items-center gap-1 text-xs font-normal text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            Live
          </span>
        </h2>
        <Link
          to="/notifications"
          className="text-sm text-primary flex items-center gap-1 hover:underline"
        >
          View all
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      <Card className="divide-y divide-border overflow-hidden">
        {items.map((item) => {
          const Icon = iconMap[item.type] || Cloud;
          const isExternal = item.type === "news" && item.link;
          const linkTo = isExternal ? item.link! : (linkMap[item.type] || "/");

          const inner = (
            <>
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full shrink-0",
                  colorMap[item.type]
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{item.title}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {item.location}
                </p>
              </div>
              <div className="flex flex-col items-end shrink-0">
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {item.time}
                </span>
                {(item.severity === "high" || item.severity === "critical") && (
                  <span className={cn(
                    "text-xs font-medium",
                    item.severity === "critical" ? "text-destructive" : "text-orange-500"
                  )}>
                    {item.severity === "critical" ? "Critical" : "Alert"}
                  </span>
                )}
              </div>
            </>
          );

          const itemClassName = cn(
            "flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors cursor-pointer",
            severityStyles[item.severity]
          );

          return isExternal ? (
            <a
              key={item.id}
              href={linkTo}
              target="_blank"
              rel="noopener noreferrer"
              className={itemClassName}
            >
              {inner}
            </a>
          ) : (
            <Link
              key={item.id}
              to={linkTo}
              className={itemClassName}
            >
              {inner}
            </Link>
          );
        })}
      </Card>
    </section>
  );
}
