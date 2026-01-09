import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Ship, Filter, Layers, Search, Anchor } from "lucide-react";

export default function Marine() {
  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        {/* Map Placeholder */}
        <div className="flex-1 relative bg-muted">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Ship className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="font-heading text-xl font-semibold mb-2">
                Marine Traffic
              </h2>
              <p className="text-muted-foreground">
                Interactive map will be displayed here
              </p>
            </div>
          </div>

          {/* Map Controls */}
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            <Button size="icon" variant="secondary" className="shadow-lg">
              <Layers className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="secondary" className="shadow-lg">
              <Filter className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="secondary" className="shadow-lg">
              <Anchor className="h-4 w-4" />
            </Button>
          </div>

          {/* Search Bar */}
          <div className="absolute top-4 left-4 right-16">
            <Card className="flex items-center gap-2 px-3 py-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search vessels, ports..."
                className="flex-1 bg-transparent outline-none text-sm"
              />
            </Card>
          </div>
        </div>

        {/* Bottom Panel */}
        <Card className="mx-4 -mt-4 relative z-10 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Tracking</p>
              <p className="text-2xl font-bold">8,432 vessels</p>
            </div>
            <Button>View List</Button>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
