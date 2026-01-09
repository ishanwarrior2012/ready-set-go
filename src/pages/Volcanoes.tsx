import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Flame, Filter, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const volcanoes = [
  { name: "Mount Etna", location: "Sicily, Italy", status: "active", alert: "orange" },
  { name: "Kilauea", location: "Hawaii, USA", status: "active", alert: "yellow" },
  { name: "Mount Fuji", location: "Honshu, Japan", status: "dormant", alert: "green" },
  { name: "Stromboli", location: "Italy", status: "active", alert: "orange" },
  { name: "Popocatépetl", location: "Mexico", status: "active", alert: "yellow" },
];

function getAlertColor(alert: string) {
  switch (alert) {
    case "red":
      return "bg-red-500 text-white";
    case "orange":
      return "bg-orange-500 text-white";
    case "yellow":
      return "bg-yellow-500 text-black";
    default:
      return "bg-green-500 text-white";
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "active":
      return <Badge variant="destructive">Active</Badge>;
    case "dormant":
      return <Badge variant="secondary">Dormant</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default function Volcanoes() {
  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        {/* Map Placeholder */}
        <div className="flex-1 relative bg-muted">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Flame className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="font-heading text-xl font-semibold mb-2">
                Volcanic Activity
              </h2>
              <p className="text-muted-foreground">
                Interactive map will be displayed here
              </p>
            </div>
          </div>

          {/* Map Controls */}
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            <Button size="icon" variant="secondary" className="shadow-lg">
              <Filter className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="secondary" className="shadow-lg">
              <Info className="h-4 w-4" />
            </Button>
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 left-4">
            <Card className="p-3">
              <p className="text-xs font-medium mb-2">Alert Level</p>
              <div className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded-full bg-green-500" /> Normal
                </span>
                <span className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded-full bg-yellow-500" /> Advisory
                </span>
                <span className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded-full bg-orange-500" /> Watch
                </span>
                <span className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded-full bg-red-500" /> Warning
                </span>
              </div>
            </Card>
          </div>
        </div>

        {/* Volcano List */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading text-lg font-semibold">
              Monitored Volcanoes
            </h2>
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </div>
          <Card className="divide-y">
            {volcanoes.map((volcano, index) => (
              <div key={index} className="flex items-center gap-3 p-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${getAlertColor(
                    volcano.alert
                  )}`}
                >
                  <Flame className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{volcano.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {volcano.location}
                  </p>
                </div>
                {getStatusBadge(volcano.status)}
              </div>
            ))}
          </Card>
        </div>
      </div>
    </Layout>
  );
}
