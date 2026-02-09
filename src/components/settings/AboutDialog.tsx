import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Info, Globe, Shield, Zap, Heart, Github, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export function AboutDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors">
          <Info className="h-5 w-5 text-muted-foreground" />
          <div className="flex-1">
            <p className="font-medium">About</p>
            <p className="text-sm text-muted-foreground">SafeTrack PWA v1.0.0</p>
          </div>
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
              <div className="h-4 w-4 rounded-full border-2 border-primary-foreground" />
            </div>
            SafeTrack
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">v1.0.0</Badge>
            <Badge variant="outline">PWA</Badge>
            <Badge variant="outline">Open Source</Badge>
          </div>

          <p className="text-sm text-muted-foreground">
            SafeTrack is a real-time global monitoring Progressive Web App that brings together flight tracking, marine traffic, earthquake & volcano monitoring, weather visualization, ISS tracking, and more — all in a single, beautiful interface.
          </p>

          <Separator />

          <div className="space-y-3">
            <h4 className="font-medium text-sm">Features</h4>
            <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Zap className="h-3 w-3 text-primary" />
                Real-time tracking
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-3 w-3 text-primary" />
                180+ languages
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-3 w-3 text-primary" />
                Secure & private
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-3 w-3 text-primary" />
                12+ color themes
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="font-medium text-sm">Created by</h4>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Heart className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Shrot Singh</p>
                <p className="text-xs text-muted-foreground">Developer & Creator</p>
              </div>
            </div>
          </div>

          <Separator />

          <p className="text-xs text-center text-muted-foreground">
            Made with ❤️ by Shrot Singh • © {new Date().getFullYear()} SafeTrack
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
