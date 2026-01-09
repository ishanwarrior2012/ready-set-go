import { Layout } from "@/components/layout/Layout";
import { Plane } from "lucide-react";

export default function Flights() {
  return (
    <Layout>
      <div className="h-full flex flex-col">
        {/* Header */}
        <section className="px-4 py-3">
          <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
            <Plane className="h-6 w-6 text-electric" />
            Flight Radar
          </h1>
        </section>

        {/* Full Map */}
        <div className="flex-1 relative">
          <iframe
            src="https://embed.flightaware.com/commercial/integrated/web/delay_map_fullpage.rvt"
            className="w-full h-full border-0 absolute inset-0"
            title="FlightAware Live Map"
            allow="geolocation"
          />
        </div>
      </div>
    </Layout>
  );
}
