import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Navigation,
  Cloud,
  Radio,
  MoreHorizontal,
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
    path: "/settings",
  },
];

export function BottomNavigation() {
  const location = useLocation();

  // Check if current path matches or starts with the nav item path
  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-nav safe-bottom">
      <div className="flex h-16 items-center justify-around">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors",
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
  );
}
