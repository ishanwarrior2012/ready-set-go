import { useState, useEffect } from "react";
import { MapPin, Navigation, X, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "@/contexts/LocationContext";
import { cn } from "@/lib/utils";

/**
 * LocationPermissionBanner — shown once per session if the user hasn't granted
 * GPS or chosen a manual location. Prompts them to allow location access.
 */
export function LocationPermissionBanner() {
  const { location, isLocating, requestGPS } = useLocation();
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show if location is default (user hasn't chosen yet) and not dismissed
    const wasDismissed = sessionStorage.getItem("location-banner-dismissed");
    if (location.source === "default" && !wasDismissed) {
      // Delay slightly so it doesn't flash on initial load
      const t = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
    }
  }, [location.source]);

  const handleDismiss = () => {
    setDismissed(true);
    setVisible(false);
    sessionStorage.setItem("location-banner-dismissed", "1");
  };

  const handleAllow = async () => {
    await requestGPS();
    handleDismiss();
  };

  if (!visible || dismissed) return null;

  return (
    <div className={cn(
      "fixed bottom-20 left-3 right-3 z-40 rounded-2xl shadow-xl border overflow-hidden",
      "bg-background/95 backdrop-blur-md border-primary/20",
      "animate-in slide-in-from-bottom-4 duration-500"
    )}>
      <div className="flex items-start gap-3 p-4">
        {/* Icon */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <MapPin className="h-5 w-5 text-primary" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">Enable Location</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            Allow location access for live weather, local alerts, and personalised tracking data.
          </p>

          {/* Privacy note */}
          <div className="flex items-center gap-1 mt-1.5 text-[10px] text-muted-foreground/70">
            <Shield className="h-3 w-3" />
            <span>Your location is never stored or shared</span>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              className="flex-1 h-8 gap-1.5 text-xs"
              onClick={handleAllow}
              disabled={isLocating}
            >
              <Navigation className="h-3.5 w-3.5" />
              {isLocating ? "Detecting…" : "Allow Location"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs px-3"
              onClick={handleDismiss}
            >
              Not now
            </Button>
          </div>
        </div>

        {/* Close */}
        <button
          onClick={handleDismiss}
          className="shrink-0 rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
