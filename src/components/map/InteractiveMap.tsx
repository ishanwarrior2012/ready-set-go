import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, ZoomControl, useMap } from "react-leaflet";
import { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { Layers, LocateFixed, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserLocation } from "@/contexts/AppContext";

interface MapLayer {
  id: string;
  name: string;
  url: string;
  attribution: string;
}

const mapLayers: MapLayer[] = [
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

interface MapControlsProps {
  onLayerChange: (layerId: string) => void;
  currentLayer: string;
  showLayerPicker: boolean;
  setShowLayerPicker: (show: boolean) => void;
}

function MapControls({ onLayerChange, currentLayer, showLayerPicker, setShowLayerPicker }: MapControlsProps) {
  const map = useMap();
  const { location, requestLocation, loading } = useUserLocation();

  const handleZoomIn = () => map.zoomIn();
  const handleZoomOut = () => map.zoomOut();

  const handleLocate = async () => {
    if (!location) {
      await requestLocation();
    }
    if (location) {
      map.flyTo([location.latitude, location.longitude], 12, { duration: 1.5 });
    }
  };

  useEffect(() => {
    if (location) {
      map.flyTo([location.latitude, location.longitude], 12, { duration: 1.5 });
    }
  }, [location, map]);

  return (
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
        disabled={loading}
      >
        <LocateFixed className={cn("h-4 w-4", loading && "animate-pulse")} />
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
                  onLayerChange(layer.id);
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
  );
}

interface InteractiveMapProps {
  center?: LatLngExpression;
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
  const [currentLayer, setCurrentLayer] = useState("standard");
  const [showLayerPicker, setShowLayerPicker] = useState(false);
  const mapRef = useRef<L.Map | null>(null);

  const activeLayer = mapLayers.find((l) => l.id === currentLayer) || mapLayers[0];

  return (
    <div className={cn("relative w-full h-full", className)}>
      <MapContainer
        center={center}
        zoom={zoom}
        zoomControl={false}
        className="h-full w-full"
        ref={(map) => {
          if (map && !mapRef.current) {
            mapRef.current = map;
            onMapReady?.(map);
          }
        }}
      >
        <TileLayer
          key={currentLayer}
          url={activeLayer.url}
          attribution={activeLayer.attribution}
        />
        <MapControls
          onLayerChange={setCurrentLayer}
          currentLayer={currentLayer}
          showLayerPicker={showLayerPicker}
          setShowLayerPicker={setShowLayerPicker}
        />
        {children}
      </MapContainer>
    </div>
  );
}

export { mapLayers };
