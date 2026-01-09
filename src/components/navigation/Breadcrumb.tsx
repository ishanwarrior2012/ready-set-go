import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  path: string;
}

const routeLabels: Record<string, string> = {
  "": "Dashboard",
  flights: "Flight Radar",
  marine: "Marine Traffic",
  earthquakes: "Earthquakes",
  volcanoes: "Volcanoes",
  weather: "Weather",
  radio: "Global Radio",
  search: "AI Assistant",
  favorites: "Favorites",
  settings: "Settings",
  profile: "Profile",
  notifications: "Notifications",
};

interface BreadcrumbProps {
  className?: string;
  items?: BreadcrumbItem[];
}

export function Breadcrumb({ className, items }: BreadcrumbProps) {
  const location = useLocation();

  // Auto-generate breadcrumbs from current path if items not provided
  const breadcrumbs: BreadcrumbItem[] = items || (() => {
    const pathSegments = location.pathname.split("/").filter(Boolean);
    
    if (pathSegments.length === 0) {
      return [{ label: "Dashboard", path: "/" }];
    }

    const crumbs: BreadcrumbItem[] = [{ label: "Dashboard", path: "/" }];
    let currentPath = "";

    pathSegments.forEach((segment) => {
      currentPath += `/${segment}`;
      const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
      crumbs.push({ label, path: currentPath });
    });

    return crumbs;
  })();

  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav className={cn("flex items-center gap-1 text-sm", className)} aria-label="Breadcrumb">
      {breadcrumbs.map((item, index) => {
        const isLast = index === breadcrumbs.length - 1;
        
        return (
          <div key={item.path} className="flex items-center gap-1">
            {index === 0 ? (
              <Link
                to={item.path}
                className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Home className="h-3.5 w-3.5" />
                <span className="sr-only">{item.label}</span>
              </Link>
            ) : isLast ? (
              <span className="font-medium text-foreground">{item.label}</span>
            ) : (
              <Link
                to={item.path}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            )}
            {!isLast && (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </div>
        );
      })}
    </nav>
  );
}
