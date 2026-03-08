import { useState, useEffect, useRef } from "react";
import { WifiOff, Wifi, RefreshCw, CloudOff, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);
  const [offlineSince, setOfflineSince] = useState<Date | null>(null);
  const [syncing, setSyncing] = useState(false);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setOfflineSince(null);
      setShowReconnected(true);
      setSyncing(true);

      // Trigger background sync via service worker
      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: "REGISTER_SYNC" });
      }

      // Notify app to process offline queue
      window.dispatchEvent(new CustomEvent("safetrack:reconnected"));

      setTimeout(() => setSyncing(false), 2000);
      reconnectTimer.current = setTimeout(() => setShowReconnected(false), 4000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
      setOfflineSince(new Date());
      clearTimeout(reconnectTimer.current);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearTimeout(reconnectTimer.current);
    };
  }, []);

  const getOfflineDuration = () => {
    if (!offlineSince) return "";
    const secs = Math.floor((Date.now() - offlineSince.getTime()) / 1000);
    if (secs < 60) return `${secs}s`;
    if (secs < 3600) return `${Math.floor(secs / 60)}m`;
    return `${Math.floor(secs / 3600)}h`;
  };

  if (isOnline && !showReconnected) return null;

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-[100] flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium transition-all duration-500 safe-top animate-in slide-in-from-top-1",
        isOnline
          ? "bg-emerald-500 text-primary-foreground"
          : "bg-destructive text-destructive-foreground"
      )}
    >
      {isOnline ? (
        <>
          {syncing
            ? <RefreshCw className="h-4 w-4 animate-spin" />
            : <Wifi className="h-4 w-4" />
          }
          <span>{syncing ? "Back online — syncing your data…" : "✓ All data synced"}</span>
        </>
      ) : (
        <>
          <CloudOff className="h-4 w-4" />
          <span>Offline mode — data is cached</span>
          {offlineSince && (
            <span className="flex items-center gap-1 ml-2 opacity-80 text-xs border-l border-white/30 pl-2">
              <Clock className="h-3 w-3" />
              {getOfflineDuration()}
            </span>
          )}
        </>
      )}
    </div>
  );
}
