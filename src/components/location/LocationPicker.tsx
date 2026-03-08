/**
 * LocationPicker – compact button shown in the Header that opens a sheet/dialog
 * where the user can either request GPS or pick a country from the list.
 */
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Navigation,
  Search,
  CheckCircle2,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { useLocation, COUNTRIES, AppLocation } from "@/contexts/LocationContext";
import { cn } from "@/lib/utils";

export function LocationPicker() {
  const { location, isLocating, locationError, requestGPS, setManualLocation } =
    useLocation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = COUNTRIES.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase())
  );

  const handleGPS = async () => {
    await requestGPS();
    setOpen(false);
  };

  const handleCountry = (c: (typeof COUNTRIES)[0]) => {
    const loc: AppLocation = {
      lat: c.lat,
      lon: c.lon,
      label: c.label,
      source: "manual",
    };
    setManualLocation(loc);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 px-2 text-xs max-w-[130px]"
          title="Change location"
        >
          {location.source === "gps" ? (
            <Navigation className="h-3.5 w-3.5 shrink-0 text-primary" />
          ) : (
            <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
          )}
          <span className="truncate">{location.label}</span>
        </Button>
      </SheetTrigger>

      <SheetContent side="bottom" className="max-h-[80vh] rounded-t-2xl">
        <SheetHeader className="pb-2">
          <SheetTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            Choose Location
          </SheetTitle>
        </SheetHeader>

        {/* Error */}
        {locationError && (
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 text-destructive text-xs p-3 mb-3">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {locationError}
          </div>
        )}

        {/* GPS option */}
        <Button
          className="w-full mb-4 gap-2"
          onClick={handleGPS}
          disabled={isLocating}
        >
          {isLocating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Navigation className="h-4 w-4" />
          )}
          {isLocating ? "Detecting location…" : "Use My Location (GPS)"}
        </Button>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search country…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <ScrollArea className="h-64">
          <div className="space-y-1 pr-2">
            {filtered.map((c) => {
              const isActive =
                location.label === c.label && location.source === "manual";
              return (
                <button
                  key={c.label}
                  onClick={() => handleCountry(c)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left",
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "hover:bg-muted text-foreground"
                  )}
                >
                  <span className="text-lg leading-none">{c.flag}</span>
                  <span className="flex-1">{c.label}</span>
                  {isActive && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                </button>
              );
            })}
          </div>
        </ScrollArea>

        {location.source === "gps" && (
          <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Badge variant="secondary" className="text-xs gap-1">
              <Navigation className="h-3 w-3 text-primary" />
              GPS Active — {location.label}
            </Badge>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
