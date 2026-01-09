import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mountain, Filter, Clock, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const recentQuakes = [
  { magnitude: 5.2, location: "Near Tokyo, Japan", time: "12 min ago", depth: "32 km" },
  { magnitude: 4.8, location: "Sumatra, Indonesia", time: "1 hour ago", depth: "45 km" },
  { magnitude: 4.5, location: "California, USA", time: "2 hours ago", depth: "12 km" },
  { magnitude: 6.1, location: "Chile", time: "4 hours ago", depth: "78 km" },
];

function getMagnitudeColor(mag: number) {
  if (mag >= 6) return "bg-red-500";
  if (mag >= 5) return "bg-orange-500";
  if (mag >= 4) return "bg-amber-500";
  return "bg-yellow-500";
}

export default function Earthquakes() {
  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        {/* Map Placeholder */}
        <div className="flex-1 relative bg-muted">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Mountain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="font-heading text-xl font-semibold mb-2">
                Earthquake Monitor
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
              <Clock className="h-4 w-4" />
            </Button>
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 left-4">
            <Card className="p-3">
              <p className="text-xs font-medium mb-2">Magnitude</p>
              <div className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded-full bg-yellow-500" /> 3-4
                </span>
                <span className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded-full bg-amber-500" /> 4-5
                </span>
                <span className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded-full bg-orange-500" /> 5-6
                </span>
                <span className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded-full bg-red-500" /> 6+
                </span>
              </div>
            </Card>
          </div>
        </div>

        {/* Bottom Panel */}
        <div className="p-4 space-y-4">
          <Tabs defaultValue="recent">
            <TabsList className="w-full">
              <TabsTrigger value="recent" className="flex-1">Recent</TabsTrigger>
              <TabsTrigger value="significant" className="flex-1">Significant</TabsTrigger>
            </TabsList>
            <TabsContent value="recent" className="mt-3">
              <Card className="divide-y">
                {recentQuakes.map((quake, index) => (
                  <div key={index} className="flex items-center gap-3 p-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${getMagnitudeColor(
                        quake.magnitude
                      )}`}
                    >
                      <span className="text-sm font-bold text-white">
                        {quake.magnitude}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{quake.location}</p>
                      <p className="text-xs text-muted-foreground">
                        Depth: {quake.depth}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {quake.time}
                    </span>
                  </div>
                ))}
              </Card>
            </TabsContent>
            <TabsContent value="significant" className="mt-3">
              <Card className="p-8 text-center">
                <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No significant earthquakes in the last 24h</p>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}
