import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Navigation,
  Cloud,
  Radio,
  MoreHorizontal,
  Plane,
  Ship,
  Mountain,
  Activity,
  Orbit,
  Waves,
  Film,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/",
  },
  {
    label: "Tracking",
    icon: Navigation,
    path: "/flights",
    hasSubmenu: true,
  },
  {
    label: "Weather",
    icon: Cloud,
    path: "/weather",
  },
  {
    label: "Radio",
    icon: Radio,
    path: "/radio",
  },
  {
    label: "More",
    icon: MoreHorizontal,
    path: "#more",
    hasMoreMenu: true,
  },
];

const trackingSubmenu = [
  { label: "Flights", icon: Plane, path: "/flights" },
  { label: "Marine", icon: Ship, path: "/marine" },
  { label: "Earthquakes", icon: Activity, path: "/earthquakes" },
  { label: "Volcanoes", icon: Mountain, path: "/volcanoes" },
  { label: "Tsunami", icon: Waves, path: "/tsunami" },
  { label: "ISS", icon: Orbit, path: "/iss" },
];

const moreMenuItems = [
  { label: "Chill", icon: Film, path: "/chill", gradient: "from-pink-500 to-purple-600" },
  { label: "Settings", icon: Settings, path: "/settings", gradient: "from-slate-500 to-slate-700" },
];

export function BottomNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showTrackingMenu, setShowTrackingMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  const isTrackingActive = () => {
    return ["/flights", "/marine", "/earthquakes", "/volcanoes", "/tsunami", "/iss"].some(p => 
      location.pathname.startsWith(p)
    );
  };

  const isMoreActive = () => {
    return ["/chill", "/settings"].some(p => location.pathname.startsWith(p));
  };

  const handleTrackingClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowMoreMenu(false);
    setShowTrackingMenu(!showTrackingMenu);
  };

  const handleMoreClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowTrackingMenu(false);
    setShowMoreMenu(!showMoreMenu);
  };

  const handleSubmenuClick = (path: string) => {
    navigate(path);
    setShowTrackingMenu(false);
    setShowMoreMenu(false);
  };

  const closeAllMenus = () => {
    setShowTrackingMenu(false);
    setShowMoreMenu(false);
  };

  return (
    <>
      {/* Tracking Submenu Popup */}
      {showTrackingMenu && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={closeAllMenus} 
          />
          <div className="fixed bottom-20 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-50 bg-card border rounded-xl shadow-xl p-2 animate-fade-in">
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1">
              {trackingSubmenu.map((item) => (
                <button
                  key={item.path}
                  onClick={() => handleSubmenuClick(item.path)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 p-3 rounded-lg transition-colors tv-focus",
                    location.pathname === item.path 
                      ? "bg-primary/10 text-primary" 
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  <item.icon className="h-6 w-6" />
                  <span className="text-xs font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* More Submenu Popup */}
      {showMoreMenu && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={closeAllMenus} 
          />
          <div className="fixed bottom-20 right-4 left-auto sm:right-4 z-50 bg-card border rounded-xl shadow-xl p-3 animate-fade-in min-w-[160px]">
            <div className="flex flex-col gap-1.5">
              {moreMenuItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => handleSubmenuClick(item.path)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors tv-focus",
                    location.pathname === item.path
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br shrink-0",
                    item.gradient
                  )}>
                    <item.icon className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-nav safe-bottom">
        <div className="flex h-16 items-center justify-around">
          {navItems.map((item) => {
            const active = item.hasSubmenu
              ? isTrackingActive()
              : item.hasMoreMenu
              ? isMoreActive()
              : isActive(item.path);

            if (item.hasSubmenu) {
              return (
                <button
                  key={item.path}
                  onClick={handleTrackingClick}
                  className={cn(
                    "flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors tv-focus",
                    active ? "text-nav-active" : "text-nav-foreground"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-5 w-5 transition-all",
                      active && "scale-110"
                    )}
                  />
                  <span className="text-xs font-medium">{item.label}</span>
                  {active && (
                    <span className="absolute -bottom-0 h-0.5 w-10 rounded-full bg-nav-active" />
                  )}
                </button>
              );
            }

            if (item.hasMoreMenu) {
              return (
                <button
                  key={item.path}
                  onClick={handleMoreClick}
                  className={cn(
                    "flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors tv-focus",
                    active ? "text-nav-active" : "text-nav-foreground"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-5 w-5 transition-all",
                      active && "scale-110"
                    )}
                  />
                  <span className="text-xs font-medium">{item.label}</span>
                  {active && (
                    <span className="absolute -bottom-0 h-0.5 w-10 rounded-full bg-nav-active" />
                  )}
                </button>
              );
            }

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={closeAllMenus}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors tv-focus",
                  active ? "text-nav-active" : "text-nav-foreground"
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 transition-all",
                    active && "scale-110"
                  )}
                />
                <span className="text-xs font-medium">{item.label}</span>
                {active && (
                  <span className="absolute -bottom-0 h-0.5 w-10 rounded-full bg-nav-active" />
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </>
  );
}
