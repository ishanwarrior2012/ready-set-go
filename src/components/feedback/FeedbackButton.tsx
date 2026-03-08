import { useState, useEffect, useRef } from "react";
import { MessageSquare, Bug, Lightbulb, Star, X } from "lucide-react";
import { FeedbackDialog } from "./FeedbackDialog";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

export function FeedbackButton() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [dialogTab, setDialogTab] = useState<"bug" | "feature" | "survey">("bug");
  const [menuOpen, setMenuOpen] = useState(false);
  const [shakeDetected, setShakeDetected] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Shake-to-report
  useEffect(() => {
    if (!user || typeof DeviceMotionEvent === "undefined") return;

    let lastX = 0, lastY = 0, lastZ = 0;
    let shakeCount = 0;
    let shakeTimer: ReturnType<typeof setTimeout>;

    const handleMotion = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity;
      if (!acc) return;

      const { x = 0, y = 0, z = 0 } = acc;
      const dx = Math.abs((x ?? 0) - lastX);
      const dy = Math.abs((y ?? 0) - lastY);
      const dz = Math.abs((z ?? 0) - lastZ);

      if (dx + dy + dz > 30) {
        shakeCount++;
        clearTimeout(shakeTimer);
        shakeTimer = setTimeout(() => { shakeCount = 0; }, 1000);

        if (shakeCount >= 3 && !open) {
          setShakeDetected(true);
          setTimeout(() => setShakeDetected(false), 3000);
          setDialogTab("bug");
          setOpen(true);
          shakeCount = 0;
        }
      }

      lastX = x ?? 0; lastY = y ?? 0; lastZ = z ?? 0;
    };

    window.addEventListener("devicemotion", handleMotion);
    return () => {
      window.removeEventListener("devicemotion", handleMotion);
      clearTimeout(shakeTimer);
    };
  }, [user, open]);

  // Close menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!user) return null;

  const openWith = (tab: "bug" | "feature" | "survey") => {
    setDialogTab(tab);
    setOpen(true);
    setMenuOpen(false);
  };

  const menuItems = [
    { tab: "bug" as const, icon: Bug, label: "Report a Bug", color: "text-destructive", bg: "hover:bg-destructive/10" },
    { tab: "feature" as const, icon: Lightbulb, label: "Suggest Feature", color: "text-primary", bg: "hover:bg-primary/10" },
    { tab: "survey" as const, icon: Star, label: "Rate the App", color: "text-yellow-500", bg: "hover:bg-yellow-500/10" },
  ];

  return (
    <>
      {/* Shake hint */}
      {shakeDetected && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-card border border-border rounded-full px-4 py-2 text-sm font-medium shadow-lg animate-bounce">
          📳 Shake detected — opening bug report
        </div>
      )}

      {/* Feedback FAB */}
      <div ref={menuRef} className="fixed bottom-24 right-4 z-40 flex flex-col items-end gap-2">
        {/* Mini menu */}
        {menuOpen && (
          <div className="flex flex-col gap-2 mb-1 animate-in fade-in slide-in-from-bottom-2 duration-200">
            {menuItems.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.tab}
                  onClick={() => openWith(item.tab)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-full bg-card border border-border shadow-md text-sm font-medium transition-all",
                    item.bg
                  )}
                >
                  <Icon className={cn("h-4 w-4", item.color)} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Main button */}
        <button
          onClick={() => setMenuOpen(prev => !prev)}
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full shadow-lg border border-border transition-all duration-200",
            menuOpen ? "bg-muted rotate-45" : "bg-card hover:bg-primary/5 hover:scale-110"
          )}
          title="Feedback"
          aria-label="Open feedback menu"
        >
          {menuOpen
            ? <X className="h-5 w-5 text-foreground" />
            : <MessageSquare className="h-5 w-5 text-primary" />
          }
        </button>

        {/* Pulse indicator - shows on first render */}
        {!menuOpen && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-50" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
          </span>
        )}
      </div>

      <FeedbackDialog
        open={open}
        onClose={() => setOpen(false)}
        defaultTab={dialogTab}
      />
    </>
  );
}
