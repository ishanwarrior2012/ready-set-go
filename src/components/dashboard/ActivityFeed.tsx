import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import {
  Mountain,
  Flame,
  AlertTriangle,
  ChevronRight,
  Plane,
  Ship,
  Cloud,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityItem {
  id: string;
  type: "earthquake" | "volcano" | "weather" | "flight" | "marine";
  title: string;
  location: string;
  time: string;
  severity?: "low" | "medium" | "high";
}

const activityData: ActivityItem[] = [
  {
    id: "1",
    type: "earthquake",
    title: "M5.2 Earthquake",
    location: "Near Tokyo, Japan",
    time: "12 min ago",
    severity: "medium",
  },
  {
    id: "2",
    type: "volcano",
    title: "Increased Activity",
    location: "Mount Etna, Italy",
    time: "1 hour ago",
    severity: "high",
  },
  {
    id: "3",
    type: "weather",
    title: "Storm Warning",
    location: "Gulf of Mexico",
    time: "2 hours ago",
    severity: "high",
  },
  {
    id: "4",
    type: "flight",
    title: "Delayed: UA 237",
    location: "JFK → LAX",
    time: "3 hours ago",
    severity: "low",
  },
];

const iconMap = {
  earthquake: Mountain,
  volcano: Flame,
  weather: AlertTriangle,
  flight: Plane,
  marine: Ship,
};

const colorMap = {
  earthquake: "bg-amber-500/10 text-amber-500",
  volcano: "bg-red-500/10 text-red-500",
  weather: "bg-sky-500/10 text-sky-500",
  flight: "bg-electric/10 text-electric",
  marine: "bg-cyan-500/10 text-cyan-500",
};

interface ActivityFeedProps {
  className?: string;
  maxItems?: number;
}

export function ActivityFeed({ className, maxItems = 4 }: ActivityFeedProps) {
  const items = activityData.slice(0, maxItems);

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
      <Card className="divide-y divide-border overflow-hidden">
        {items.map((item) => {
          const Icon = iconMap[item.type] || Cloud;
          return (
            <div
              key={item.id}
              className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors cursor-pointer"
            >
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
                {item.severity === "high" && (
                  <span className="text-xs text-destructive font-medium">
                    Alert
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </Card>
    </section>
  );
}
