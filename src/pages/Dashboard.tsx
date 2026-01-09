import { Layout } from "@/components/layout/Layout";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { QuickAccessGrid } from "@/components/dashboard/QuickAccessGrid";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Maximize2, Globe } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const [showFullMap, setShowFullMap] = useState(false);

  return (
    <Layout>
      <div className="p-4 space-y-6 animate-fade-in">
        {/* Welcome Section */}
        <section>
          <h1 className="font-heading text-2xl font-bold">Welcome back</h1>
          <p className="text-muted-foreground">
            Here's what's happening around the world
          </p>
        </section>

        {/* Stats Cards */}
        <StatsCards />

        {/* Mini Map Preview */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading text-lg font-semibold flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Live Map
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFullMap(!showFullMap)}
              className="gap-1"
            >
              <Maximize2 className="h-4 w-4" />
              {showFullMap ? "Collapse" : "Expand"}
            </Button>
          </div>
          <Card className="overflow-hidden">
            <Link
              to="/flights"
              className={`flex flex-col items-center justify-center bg-gradient-to-br from-muted to-muted/50 transition-all duration-300 hover:from-primary/10 hover:to-primary/5 ${
                showFullMap ? "h-80" : "h-48"
              }`}
            >
              <Globe className="h-12 w-12 text-muted-foreground mb-2" />
              <span className="text-muted-foreground font-medium">Open Interactive Map</span>
              <span className="text-xs text-muted-foreground/70 mt-1">
                Click to explore flights, ships & more
              </span>
            </Link>
          </Card>
        </section>

        {/* Quick Access Grid */}
        <QuickAccessGrid />

        {/* Recent Activity */}
        <ActivityFeed />
      </div>
    </Layout>
  );
}
