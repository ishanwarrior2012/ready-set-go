import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import {
  Plane,
  Ship,
  Mountain,
  Flame,
  Cloud,
  Radio,
  Activity,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import { Link } from "react-router-dom";

const quickAccessItems = [
  {
    label: "Flight Radar",
    description: "Track flights worldwide",
    icon: Plane,
    path: "/flights",
    color: "bg-blue-500",
  },
  {
    label: "Marine Traffic",
    description: "Monitor ships & vessels",
    icon: Ship,
    path: "/marine",
    color: "bg-cyan-500",
  },
  {
    label: "Earthquakes",
    description: "Seismic activity monitor",
    icon: Mountain,
    path: "/earthquakes",
    color: "bg-amber-500",
  },
  {
    label: "Volcanoes",
    description: "Volcanic activity tracker",
    icon: Flame,
    path: "/volcanoes",
    color: "bg-red-500",
  },
  {
    label: "Weather",
    description: "Global weather maps",
    icon: Cloud,
    path: "/weather",
    color: "bg-sky-500",
  },
  {
    label: "Global Radio",
    description: "Listen to stations worldwide",
    icon: Radio,
    path: "/radio",
    color: "bg-purple-500",
  },
];

const statsCards = [
  { label: "Active Flights", value: "12,847", icon: Plane, trend: "+2.3%" },
  { label: "Ships Tracked", value: "8,432", icon: Ship, trend: "+1.8%" },
  { label: "Recent Quakes", value: "23", icon: Activity, trend: "4.5+ mag" },
];

const recentActivity = [
  {
    type: "earthquake",
    title: "M5.2 Earthquake",
    location: "Near Tokyo, Japan",
    time: "12 min ago",
    icon: Mountain,
  },
  {
    type: "volcano",
    title: "Increased Activity",
    location: "Mount Etna, Italy",
    time: "1 hour ago",
    icon: Flame,
  },
  {
    type: "weather",
    title: "Storm Warning",
    location: "Gulf of Mexico",
    time: "2 hours ago",
    icon: AlertTriangle,
  },
];

export default function Dashboard() {
  return (
    <Layout>
      <div className="p-4 space-y-6">
        {/* Welcome Section */}
        <section>
          <h1 className="font-heading text-2xl font-bold">Welcome back</h1>
          <p className="text-muted-foreground">
            Here's what's happening around the world
          </p>
        </section>

        {/* Stats Cards */}
        <section className="grid grid-cols-3 gap-3">
          {statsCards.map((stat) => (
            <Card key={stat.label} className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className="h-4 w-4 text-primary" />
              </div>
              <p className="text-xl font-bold tabular-nums">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="text-xs text-success flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" />
                {stat.trend}
              </p>
            </Card>
          ))}
        </section>

        {/* Quick Access Grid */}
        <section>
          <h2 className="font-heading text-lg font-semibold mb-3">
            Quick Access
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {quickAccessItems.map((item) => (
              <Link key={item.path} to={item.path}>
                <Card className="p-4 hover:bg-accent/50 transition-colors h-full">
                  <div
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${item.color} mb-3`}
                  >
                    <item.icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-medium">{item.label}</h3>
                  <p className="text-xs text-muted-foreground">
                    {item.description}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Recent Activity */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading text-lg font-semibold">
              Recent Activity
            </h2>
            <Link
              to="/notifications"
              className="text-sm text-primary flex items-center gap-1"
            >
              View all
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <Card className="divide-y">
            {recentActivity.map((item, index) => (
              <div key={index} className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <item.icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.title}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {item.location}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {item.time}
                </span>
              </div>
            ))}
          </Card>
        </section>
      </div>
    </Layout>
  );
}
