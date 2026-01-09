import { Card } from "@/components/ui/card";
import { Plane, Ship, Activity, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCard {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  trend: string;
  trendDirection?: "up" | "down" | "neutral";
  color: string;
}

const statsData: StatCard[] = [
  {
    label: "Active Flights",
    value: "12,847",
    icon: Plane,
    trend: "+2.3%",
    trendDirection: "up",
    color: "text-electric",
  },
  {
    label: "Ships Tracked",
    value: "8,432",
    icon: Ship,
    trend: "+1.8%",
    trendDirection: "up",
    color: "text-cyan-500",
  },
  {
    label: "Recent Quakes",
    value: "23",
    icon: Activity,
    trend: "4.5+ mag",
    trendDirection: "neutral",
    color: "text-amber-500",
  },
];

interface StatsCardsProps {
  className?: string;
}

export function StatsCards({ className }: StatsCardsProps) {
  return (
    <div className={cn("grid grid-cols-3 gap-3", className)}>
      {statsData.map((stat) => (
        <Card key={stat.label} className="p-3 hover-scale cursor-pointer">
          <div className="flex items-center gap-2 mb-2">
            <stat.icon className={cn("h-4 w-4", stat.color)} />
          </div>
          <p className="text-xl font-bold tabular-nums">{stat.value}</p>
          <p className="text-xs text-muted-foreground">{stat.label}</p>
          <p
            className={cn(
              "text-xs flex items-center gap-1 mt-1",
              stat.trendDirection === "up" && "text-success",
              stat.trendDirection === "down" && "text-destructive",
              stat.trendDirection === "neutral" && "text-muted-foreground"
            )}
          >
            {stat.trendDirection === "up" && <TrendingUp className="h-3 w-3" />}
            {stat.trendDirection === "down" && <TrendingDown className="h-3 w-3" />}
            {stat.trend}
          </p>
        </Card>
      ))}
    </div>
  );
}
