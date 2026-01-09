import { Link, useLocation } from "react-router-dom";
import {
  X,
  LayoutDashboard,
  Plane,
  Ship,
  Mountain,
  Flame,
  Cloud,
  Radio,
  Search,
  Heart,
  Settings,
  User,
  Bell,
  Moon,
  Sun,
  Monitor,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const navigationGroups = [
  {
    label: "Main",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, path: "/" },
      { label: "AI Assistant", icon: Search, path: "/search" },
    ],
  },
  {
    label: "Tracking",
    items: [
      { label: "Flight Radar", icon: Plane, path: "/flights" },
      { label: "Marine Traffic", icon: Ship, path: "/marine" },
      { label: "Earthquakes", icon: Mountain, path: "/earthquakes" },
      { label: "Volcanoes", icon: Flame, path: "/volcanoes" },
    ],
  },
  {
    label: "Other",
    items: [
      { label: "Weather", icon: Cloud, path: "/weather" },
      { label: "Global Radio", icon: Radio, path: "/radio" },
    ],
  },
  {
    label: "Personal",
    items: [
      { label: "Favorites", icon: Heart, path: "/favorites" },
      { label: "Notifications", icon: Bell, path: "/notifications" },
      { label: "Profile", icon: User, path: "/profile" },
      { label: "Settings", icon: Settings, path: "/settings" },
    ],
  },
];

export function Sidebar({ open, onClose }: SidebarProps) {
  const location = useLocation();
  const { theme, setTheme } = useTheme();

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  const themeOptions = [
    { value: "light" as const, icon: Sun, label: "Light" },
    { value: "dark" as const, icon: Moon, label: "Dark" },
    { value: "system" as const, icon: Monitor, label: "System" },
  ];

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-72 bg-sidebar shadow-2xl transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-14 items-center justify-between border-b px-4">
            <Link to="/" className="flex items-center gap-2" onClick={onClose}>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                <div className="h-3 w-3 rounded-full border-2 border-primary-foreground" />
              </div>
              <span className="font-heading text-lg font-semibold">SafeTrack</span>
            </Link>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-3 py-4">
            <nav className="space-y-6">
              {navigationGroups.map((group) => (
                <div key={group.label}>
                  <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {group.label}
                  </h3>
                  <div className="space-y-1">
                    {group.items.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={onClose}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                          isActive(item.path)
                            ? "bg-sidebar-accent text-sidebar-primary"
                            : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </nav>
          </ScrollArea>

          {/* Theme Switcher */}
          <div className="border-t p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Theme
            </p>
            <div className="flex gap-1 rounded-lg bg-muted p-1">
              {themeOptions.map((option) => (
                <Button
                  key={option.value}
                  variant="ghost"
                  size="sm"
                  onClick={() => setTheme(option.value)}
                  className={cn(
                    "flex-1 gap-1.5",
                    theme === option.value && "bg-background shadow-sm"
                  )}
                >
                  <option.icon className="h-4 w-4" />
                  <span className="text-xs">{option.label}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
