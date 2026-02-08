import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Palette,
  Sun,
  Moon,
  Monitor,
  Check,
  Droplets,
  TreePine,
  Sunset,
  Stars,
  Flower2,
  Gem,
  Flame,
  Snowflake,
  Zap,
  Cherry,
  Citrus,
  Waves,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ThemeMode = "light" | "dark" | "system";

const themeOptions: { value: ThemeMode; icon: typeof Sun; label: string }[] = [
  { value: "light", icon: Sun, label: "Light" },
  { value: "dark", icon: Moon, label: "Dark" },
  { value: "system", icon: Monitor, label: "System" },
];

export type ColorTheme =
  | "default"
  | "ocean"
  | "forest"
  | "sunset"
  | "midnight"
  | "rose"
  | "amber"
  | "emerald"
  | "crimson"
  | "arctic"
  | "lavender"
  | "coral";

export const colorThemes: {
  value: ColorTheme;
  label: string;
  preview: string;
  desc: string;
  icon: typeof Droplets;
}[] = [
  { value: "default", label: "Electric Blue", preview: "bg-[hsl(199,89%,48%)]", desc: "Default SafeTrack", icon: Zap },
  { value: "ocean", label: "Ocean", preview: "bg-[hsl(210,100%,45%)]", desc: "Deep blue seas", icon: Droplets },
  { value: "forest", label: "Forest", preview: "bg-[hsl(150,60%,40%)]", desc: "Nature green", icon: TreePine },
  { value: "sunset", label: "Sunset", preview: "bg-[hsl(25,95%,55%)]", desc: "Warm orange", icon: Sunset },
  { value: "midnight", label: "Midnight", preview: "bg-[hsl(260,60%,50%)]", desc: "Purple night", icon: Stars },
  { value: "rose", label: "Rose", preview: "bg-[hsl(340,80%,55%)]", desc: "Elegant pink", icon: Flower2 },
  { value: "amber", label: "Amber", preview: "bg-[hsl(38,92%,50%)]", desc: "Golden warmth", icon: Citrus },
  { value: "emerald", label: "Emerald", preview: "bg-[hsl(160,84%,39%)]", desc: "Rich jewel", icon: Gem },
  { value: "crimson", label: "Crimson", preview: "bg-[hsl(0,84%,50%)]", desc: "Bold red", icon: Flame },
  { value: "arctic", label: "Arctic", preview: "bg-[hsl(195,80%,60%)]", desc: "Icy cool", icon: Snowflake },
  { value: "lavender", label: "Lavender", preview: "bg-[hsl(270,60%,65%)]", desc: "Soft purple", icon: Cherry },
  { value: "coral", label: "Coral", preview: "bg-[hsl(16,85%,60%)]", desc: "Warm reef", icon: Waves },
];

export function ThemeSelector() {
  const { theme, setTheme, colorTheme, setColorTheme } = useTheme();
  const { toast } = useToast();

  return (
    <>
      {/* Mode Selector */}
      <Card className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <Palette className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="font-medium">Appearance Mode</p>
            <p className="text-sm text-muted-foreground">Light, dark, or system default</p>
          </div>
        </div>
        <div className="flex gap-2">
          {themeOptions.map((option) => (
            <Button
              key={option.value}
              variant={theme === option.value ? "default" : "outline"}
              className="flex-1 tv-focus"
              onClick={() => setTheme(option.value)}
            >
              <option.icon className="h-4 w-4 mr-2" />
              {option.label}
            </Button>
          ))}
        </div>
      </Card>

      {/* Color Theme Selector */}
      <Card className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <Palette className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="font-medium">Color Theme</p>
            <p className="text-sm text-muted-foreground">Choose your accent color palette</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {colorThemes.map((ct) => {
            const Icon = ct.icon;
            return (
              <button
                key={ct.value}
                onClick={() => {
                  setColorTheme(ct.value);
                  toast({ title: `Theme: ${ct.label}` });
                }}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border-2 transition-all tv-focus text-left",
                  colorTheme === ct.value
                    ? "border-primary bg-primary/5"
                    : "border-transparent bg-muted/50 hover:bg-muted"
                )}
              >
                <div
                  className={cn(
                    "h-8 w-8 rounded-full shrink-0 flex items-center justify-center",
                    ct.preview
                  )}
                >
                  {colorTheme === ct.value ? (
                    <Check className="h-4 w-4 text-white" />
                  ) : (
                    <Icon className="h-4 w-4 text-white" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{ct.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{ct.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </Card>
    </>
  );
}
