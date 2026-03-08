/**
 * LocationPicker – compact button shown in the Header that opens a Dialog
 * where the user can either request GPS or pick a country from the full list.
 * Uses Dialog (not Sheet) for better PWA / web-app-converter compatibility.
 */
import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Globe,
  Clock,
} from "lucide-react";
import { useLocation, COUNTRIES, AppLocation } from "@/contexts/LocationContext";
import { cn } from "@/lib/utils";

export function LocationPicker() {
  const { location, isLocating, locationError, requestGPS, setManualLocation, clearError } =
    useLocation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () =>
      COUNTRIES.filter((c) =>
        c.label.toLowerCase().includes(query.toLowerCase()) ||
        c.timezone.toLowerCase().includes(query.toLowerCase())
      ),
    [query]
  );

  const handleGPS = async () => {
    await requestGPS();
    // Only close if we succeeded (no error)
  };

  const handleCountry = (c: (typeof COUNTRIES)[0]) => {
    const loc: AppLocation = {
      lat: c.lat,
      lon: c.lon,
      label: c.label,
      source: "manual",
      timezone: c.timezone,
    };
    setManualLocation(loc);
    setOpen(false);
    setQuery("");
  };

  const handleOpenChange = (val: boolean) => {
    setOpen(val);
    if (!val) {
      setQuery("");
      clearError();
    }
  };

  // Group countries by region for display
  const regions = useMemo(() => {
    if (query) return { "Search Results": filtered };
    return {
      "Asia": filtered.filter(c => ["Asia", "Asia/"].some(r => c.timezone.startsWith(r))),
      "Europe": filtered.filter(c => c.timezone.startsWith("Europe")),
      "Americas": filtered.filter(c => c.timezone.startsWith("America")),
      "Africa": filtered.filter(c => c.timezone.startsWith("Africa") || c.timezone.startsWith("Indian")),
      "Oceania": filtered.filter(c => c.timezone.startsWith("Pacific") || c.timezone.startsWith("Australia")),
    };
  }, [filtered, query]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
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
      </DialogTrigger>

      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-4 pt-4 pb-3 border-b">
          <DialogTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            Choose Your Location
          </DialogTitle>
        </DialogHeader>

        <div className="px-4 py-3 space-y-3">
          {/* GPS Button */}
          <Button
            className="w-full gap-2"
            variant={location.source === "gps" ? "default" : "outline"}
            onClick={handleGPS}
            disabled={isLocating}
          >
            {isLocating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4" />
            )}
            {isLocating
              ? "Detecting your location…"
              : location.source === "gps"
              ? `GPS Active — ${location.label}`
              : "Use My Current Location (GPS)"}
          </Button>

          {/* Error message */}
          {locationError && (
            <div className="flex items-start gap-2 rounded-lg bg-destructive/10 text-destructive text-xs p-3">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{locationError}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex-1 h-px bg-border" />
            <span>or select a country</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search country or timezone…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
            />
          </div>
        </div>

        {/* Country list */}
        <ScrollArea className="flex-1 min-h-0 max-h-[380px] px-4">
          <div className="space-y-4 pb-4">
            {Object.entries(regions).map(([region, countries]) => {
              if (countries.length === 0) return null;
              return (
                <div key={region}>
                  {!query && (
                    <div className="sticky top-0 bg-background/95 backdrop-blur py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {region}
                    </div>
                  )}
                  <div className="space-y-0.5">
                    {countries.map((c) => {
                      const isActive =
                        location.label === c.label && location.source === "manual";
                      return (
                        <button
                          key={c.label}
                          onClick={() => handleCountry(c)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-left",
                            isActive
                              ? "bg-primary/10 text-primary font-medium"
                              : "hover:bg-muted text-foreground"
                          )}
                        >
                          <span className="text-lg leading-none w-6 shrink-0 text-center">{c.flag}</span>
                          <span className="flex-1 min-w-0 truncate">{c.label}</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                            <Clock className="h-3 w-3" />
                            {c.timezone.split("/").pop()?.replace(/_/g, " ")}
                          </span>
                          {isActive && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No countries match "{query}"
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer status */}
        {location.source !== "default" && (
          <div className="px-4 py-3 border-t flex items-center justify-center">
            <Badge variant="secondary" className="text-xs gap-1.5">
              {location.source === "gps" ? (
                <Navigation className="h-3 w-3 text-primary" />
              ) : (
                <MapPin className="h-3 w-3 text-primary" />
              )}
              Current: {location.label}
              {location.timezone && (
                <span className="text-muted-foreground ml-1">· {location.timezone.split("/").pop()?.replace(/_/g, " ")}</span>
              )}
            </Badge>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
