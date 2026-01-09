import { Link } from "react-router-dom";
import { MessageCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface FloatingActionButtonProps {
  className?: string;
}

export function FloatingActionButton({ className }: FloatingActionButtonProps) {
  return (
    <Link
      to="/search"
      className={cn(
        "fixed z-40 right-4 bottom-20 flex h-14 w-14 items-center justify-center",
        "rounded-full bg-gradient-to-br from-electric to-primary shadow-lg",
        "transition-all duration-200 hover:scale-110 hover:shadow-xl",
        "active:scale-95",
        className
      )}
      aria-label="Open AI Assistant"
    >
      <div className="relative">
        <MessageCircle className="h-6 w-6 text-white" />
        <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-yellow-300" />
      </div>
    </Link>
  );
}
