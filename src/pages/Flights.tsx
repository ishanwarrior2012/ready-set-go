import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ExternalLink, 
  Plane, 
  MapPin, 
  Clock, 
  ArrowRight,
  Search,
  Star,
  TrendingUp
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const popularAirports = [
  { code: "JFK", name: "New York JFK", city: "New York" },
  { code: "LAX", name: "Los Angeles Intl", city: "Los Angeles" },
  { code: "LHR", name: "London Heathrow", city: "London" },
  { code: "DXB", name: "Dubai Intl", city: "Dubai" },
  { code: "SIN", name: "Singapore Changi", city: "Singapore" },
  { code: "CDG", name: "Paris CDG", city: "Paris" },
];

const recentFlights = [
  { flight: "UA 237", route: "JFK → LAX", status: "On Time", time: "2h 15m" },
  { flight: "BA 178", route: "LHR → JFK", status: "Delayed", time: "5h 30m" },
  { flight: "EK 203", route: "DXB → LHR", status: "In Flight", time: "3h 45m" },
];

export default function Flights() {
  const [searchQuery, setSearchQuery] = useState("");

  const openFlightradar = () => {
    window.open("https://www.flightradar24.com/40.64,-73.78/10", "_blank", "noopener,noreferrer");
  };

  const searchFlight = () => {
    if (searchQuery.trim()) {
      window.open(
        `https://www.flightradar24.com/${searchQuery.trim().toUpperCase()}`,
        "_blank",
        "noopener,noreferrer"
      );
    }
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <section className="px-4 pt-4">
          <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
            <Plane className="h-6 w-6 text-electric" />
            Flight Radar
          </h1>
          <p className="text-muted-foreground">
            Track flights worldwide in real-time
          </p>
        </section>

        {/* Embedded Flightradar24 Map */}
        <section className="w-full">
          <div className="relative w-full h-[400px] sm:h-[500px] bg-muted rounded-lg overflow-hidden">
            <iframe
              src="https://embed.flightaware.com/commercial/integrated/web/delay_map_fullpage.rvt"
              className="w-full h-full border-0"
              title="FlightAware Live Map"
              allow="geolocation"
            />
            <button
              onClick={() =>
                window.open(
                  "https://www.flightradar24.com/40.64,-73.78/10",
                  "_blank",
                  "noopener,noreferrer"
                )
              }
              className="absolute top-3 right-3 px-4 py-2 bg-electric hover:bg-electric/90 text-white font-medium rounded-lg shadow-lg transition-colors"
            >
              Open Live Radar on Flightradar24
            </button>
          </div>
        </section>

        {/* Search */}
        <section className="px-4">
          <h2 className="font-heading text-lg font-semibold mb-3 flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Search Flight
          </h2>
          <Card className="p-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter flight number (e.g., UA237, BA178)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchFlight()}
                className="flex-1"
              />
              <Button onClick={searchFlight} disabled={!searchQuery.trim()}>
                Track
              </Button>
            </div>
          </Card>
        </section>

        {/* Popular Airports */}
        <section className="px-4">
          <h2 className="font-heading text-lg font-semibold mb-3 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Popular Airports
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {popularAirports.map((airport) => (
              <Card
                key={airport.code}
                className="p-4 cursor-pointer hover:bg-accent/50 transition-colors group"
                onClick={() => window.open(`https://www.flightradar24.com/${airport.code.toLowerCase()}`, "_blank", "noopener,noreferrer")}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-lg">{airport.code}</p>
                    <p className="text-xs text-muted-foreground">{airport.city}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Recent Activity */}
        <section className="px-4 pb-4">
          <h2 className="font-heading text-lg font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Sample Flights
          </h2>
          <Card className="divide-y">
            {recentFlights.map((flight, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => {
                  window.open(
                    `https://www.flightradar24.com/${flight.flight.replace(" ", "")}`,
                    "_blank"
                  );
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-electric/10">
                    <Plane className="h-5 w-5 text-electric" />
                  </div>
                  <div>
                    <p className="font-medium">{flight.flight}</p>
                    <p className="text-sm text-muted-foreground">{flight.route}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${
                    flight.status === "On Time" ? "text-success" :
                    flight.status === "Delayed" ? "text-destructive" :
                    "text-electric"
                  }`}>
                    {flight.status}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                    <Clock className="h-3 w-3" />
                    {flight.time}
                  </p>
                </div>
              </div>
            ))}
          </Card>
        </section>
      </div>
    </Layout>
  );
}
