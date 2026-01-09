import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type AlertType = "info" | "success" | "warning" | "error";

interface AlertBannerProps {
  type: AlertType;
  title?: string;
  message: string;
  onDismiss?: () => void;
  className?: string;
}

const alertConfig = {
  info: {
    icon: Info,
    bgClass: "bg-info/10 border-info/20",
    textClass: "text-info",
  },
  success: {
    icon: CheckCircle,
    bgClass: "bg-success/10 border-success/20",
    textClass: "text-success",
  },
  warning: {
    icon: AlertTriangle,
    bgClass: "bg-warning/10 border-warning/20",
    textClass: "text-warning",
  },
  error: {
    icon: AlertCircle,
    bgClass: "bg-destructive/10 border-destructive/20",
    textClass: "text-destructive",
  },
};

export function AlertBanner({
  type,
  title,
  message,
  onDismiss,
  className,
}: AlertBannerProps) {
  const config = alertConfig[type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border p-4",
        config.bgClass,
        className
      )}
      role="alert"
    >
      <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", config.textClass)} />
      <div className="flex-1">
        {title && (
          <h4 className={cn("font-medium", config.textClass)}>{title}</h4>
        )}
        <p className="text-sm text-foreground/80">{message}</p>
      </div>
      {onDismiss && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={onDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
