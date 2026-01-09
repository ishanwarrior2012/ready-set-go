import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import {
  Plane,
  Ship,
  Mountain,
  Flame,
  Cloud,
  Radio,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickAccessItem {
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  gradient: string;
}

const quickAccessItems: QuickAccessItem[] = [
  {
    label: "Flight Radar",
    description: "Track flights worldwide",
    icon: Plane,
    path: "/flights",
    gradient: "from-electric to-blue-600",
  },
  {
    label: "Marine Traffic",
    description: "Monitor ships & vessels",
    icon: Ship,
    path: "/marine",
    gradient: "from-cyan-500 to-teal-600",
  },
  {
    label: "Earthquakes",
    description: "Seismic activity monitor",
    icon: Mountain,
    path: "/earthquakes",
    gradient: "from-amber-500 to-orange-600",
  },
  {
    label: "Volcanoes",
    description: "Volcanic activity tracker",
    icon: Flame,
    path: "/volcanoes",
    gradient: "from-red-500 to-rose-600",
  },
  {
    label: "Weather",
    description: "Global weather maps",
    icon: Cloud,
    path: "/weather",
    gradient: "from-sky-500 to-indigo-600",
  },
  {
    label: "Global Radio",
    description: "Listen to stations worldwide",
    icon: Radio,
    path: "/radio",
    gradient: "from-purple-500 to-violet-600",
  },
];

interface QuickAccessGridProps {
  className?: string;
}

export function QuickAccessGrid({ className }: QuickAccessGridProps) {
  return (
    <section className={className}>
      <h2 className="font-heading text-lg font-semibold mb-3">Quick Access</h2>
      <div className="grid grid-cols-2 gap-3">
        {quickAccessItems.map((item) => (
          <Link key={item.path} to={item.path} className="group">
            <Card className="p-4 h-full transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 border-transparent hover:border-primary/20">
              <div
                className={cn(
                  "inline-flex h-10 w-10 items-center justify-center rounded-lg mb-3 bg-gradient-to-br transition-transform group-hover:scale-110",
                  item.gradient
                )}
              >
                <item.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-medium">{item.label}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {item.description}
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
