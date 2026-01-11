import { useEffect, useRef, useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Layers, LocateFixed, Minus, Plus, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";

interface MapLayer {
  id: string;
  name: string;
  url: string;
  attribution: string;
}

export const mapLayers: MapLayer[] = [
  {
    id: "standard",
    name: "Standard",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  {
    id: "satellite",
    name: "Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "&copy; Esri",
  },
  {
    id: "terrain",
    name: "Terrain",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
  },
  {
    id: "dark",
    name: "Dark",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
  },
];

interface InteractiveMapProps {
  center?: [number, number];
  zoom?: number;
  className?: string;
  children?: React.ReactNode;
  onMapReady?: (map: L.Map) => void;
}

export function InteractiveMap({
  center = [20, 0],
  zoom = 2,
  className,
  children,
  onMapReady,
}: InteractiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [currentLayer, setCurrentLayer] = useState("standard");
  const [showLayerPicker, setShowLayerPicker] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [locating, setLocating] = useState(false);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  useEffect(() => {
    let L: typeof import("leaflet");
    
    const initMap = async () => {
      try {
        // Dynamically import Leaflet
        L = await import("leaflet");
        await import("leaflet/dist/leaflet.css");
        
        if (!mapContainerRef.current || mapInstanceRef.current) return;

        // Fix Leaflet default icon issue
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
          iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
        });

        const map = L.map(mapContainerRef.current, {
          center: center,
          zoom: zoom,
          zoomControl: false,
        });

        const activeLayer = mapLayers.find((l) => l.id === currentLayer) || mapLayers[0];
        tileLayerRef.current = L.tileLayer(activeLayer.url, {
          attribution: activeLayer.attribution,
        }).addTo(map);

        mapInstanceRef.current = map;
        setIsLoaded(true);
        onMapReady?.(map);
      } catch (error) {
        logger.error("Failed to load map:", error);
      }
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update tile layer when currentLayer changes
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded) return;

    const activeLayer = mapLayers.find((l) => l.id === currentLayer) || mapLayers[0];
    
    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
    }

    import("leaflet").then((L) => {
      tileLayerRef.current = L.tileLayer(activeLayer.url, {
        attribution: activeLayer.attribution,
      }).addTo(mapInstanceRef.current!);
    });
  }, [currentLayer, isLoaded]);

  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();

  const handleLocate = () => {
    if (!navigator.geolocation || !mapInstanceRef.current) return;

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        mapInstanceRef.current?.flyTo(
          [position.coords.latitude, position.coords.longitude],
          12,
          { duration: 1.5 }
        );
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className={cn("relative w-full h-full", className)}>
      <div ref={mapContainerRef} className="h-full w-full" />

      {/* Loading state */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <Globe className="h-8 w-8 text-muted-foreground animate-pulse" />
        </div>
      )}

      {/* Map Controls */}
      {isLoaded && (
        <div className="absolute right-3 top-3 z-[1000] flex flex-col gap-2">
          {/* Zoom Controls */}
          <div className="flex flex-col rounded-lg bg-card shadow-lg overflow-hidden">
            <Button
              size="icon"
              variant="ghost"
              className="rounded-none h-9 w-9"
              onClick={handleZoomIn}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <div className="h-px bg-border" />
            <Button
              size="icon"
              variant="ghost"
              className="rounded-none h-9 w-9"
              onClick={handleZoomOut}
            >
              <Minus className="h-4 w-4" />
            </Button>
          </div>

          {/* Locate Button */}
          <Button
            size="icon"
            variant="secondary"
            className="shadow-lg h-9 w-9"
            onClick={handleLocate}
            disabled={locating}
          >
            <LocateFixed className={cn("h-4 w-4", locating && "animate-pulse")} />
          </Button>

          {/* Layer Picker */}
          <div className="relative">
            <Button
              size="icon"
              variant="secondary"
              className="shadow-lg h-9 w-9"
              onClick={() => setShowLayerPicker(!showLayerPicker)}
            >
              <Layers className="h-4 w-4" />
            </Button>

            {showLayerPicker && (
              <div className="absolute right-full mr-2 top-0 bg-card rounded-lg shadow-lg p-2 min-w-[120px] animate-scale-in">
                {mapLayers.map((layer) => (
                  <button
                    key={layer.id}
                    onClick={() => {
                      setCurrentLayer(layer.id);
                      setShowLayerPicker(false);
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm rounded-md transition-colors",
                      currentLayer === layer.id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    )}
                  >
                    {layer.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {children}
    </div>
  );
}
