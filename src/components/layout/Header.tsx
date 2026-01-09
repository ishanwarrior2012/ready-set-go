import { Menu, Search, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 safe-top">
      <div className="flex h-14 items-center justify-between px-4">
        {/* Left: Menu button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="shrink-0"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Center: Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
            <div className="h-3 w-3 rounded-full border-2 border-primary-foreground" />
          </div>
          <span className="font-heading text-lg font-semibold">SafeTrack</span>
        </Link>

        {/* Right: Search and Notifications */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            asChild
            aria-label="Search"
          >
            <Link to="/search">
              <Search className="h-5 w-5" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="relative"
            aria-label="Notifications"
          >
            <Link to="/notifications">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
