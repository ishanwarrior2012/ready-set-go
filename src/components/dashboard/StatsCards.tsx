import { Card } from "@/components/ui/card";
import { Plane, Ship, Activity, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLiveStats } from "@/hooks/useLiveStats";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";

interface StatsCardsProps {
  className?: string;
}

function formatNumber(num: number): string {
  if (num >= 1000) {
    return num.toLocaleString();
  }
  return num.toString();
}

export function StatsCards({ className }: StatsCardsProps) {
  const { activeFlights, shipsTracked, recentQuakes, strongestQuakeMagnitude, isLoading } = useLiveStats();

  const statsData = [
    {
      label: "Active Flights",
      value: formatNumber(activeFlights),
      icon: Plane,
      trend: "Live from OpenSky",
      color: "text-electric",
      href: "/flights",
    },
    {
      label: "Ships Tracked",
      value: formatNumber(shipsTracked),
      icon: Ship,
      trend: "Global AIS data",
      color: "text-cyan-500",
      href: "/marine",
    },
    {
      label: "Recent Quakes",
      value: recentQuakes.toString(),
      icon: Activity,
      trend: strongestQuakeMagnitude ? `Max ${strongestQuakeMagnitude.toFixed(1)} mag` : "Last 24h, M2.5+",
      color: "text-amber-500",
      href: "/earthquakes",
    },
  ];

  if (isLoading) {
    return (
      <div className={cn("grid grid-cols-3 gap-3", className)}>
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-3">
            <Skeleton className="h-4 w-4 mb-2" />
            <Skeleton className="h-6 w-16 mb-1" />
            <Skeleton className="h-3 w-20 mb-1" />
            <Skeleton className="h-3 w-24" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-3 gap-3", className)}>
      {statsData.map((stat) => (
        <Link key={stat.label} to={stat.href}>
          <Card className="p-3 hover-scale cursor-pointer transition-all hover:shadow-lg hover:border-primary/50">
            <div className="flex items-center justify-between mb-2">
              <stat.icon className={cn("h-4 w-4", stat.color)} />
              <RefreshCw className="h-3 w-3 text-muted-foreground/50 animate-pulse" />
            </div>
            <p className="text-xl font-bold tabular-nums">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className="text-xs text-muted-foreground/70 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              {stat.trend}
            </p>
          </Card>
        </Link>
      ))}
    </div>
  );
}
