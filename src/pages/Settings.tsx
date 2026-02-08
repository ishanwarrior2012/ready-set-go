import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Settings as SettingsIcon,
  Bell,
  Globe,
  Ruler,
  Palette,
  Shield,
  HelpCircle,
  Info,
  ChevronRight,
  Moon,
  Sun,
  Monitor,
  MapPin,
  Download,
  Trash2,
  Mail,
  MessageSquare,
  Smartphone,
  Volume2,
  Check,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { usePreferences } from "@/contexts/AppContext";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type ThemeMode = "light" | "dark" | "system";
type ColorTheme = "default" | "ocean" | "forest" | "sunset" | "midnight" | "rose";

const themeOptions: { value: ThemeMode; icon: typeof Sun; label: string }[] = [
  { value: "light", icon: Sun, label: "Light" },
  { value: "dark", icon: Moon, label: "Dark" },
  { value: "system", icon: Monitor, label: "System" },
];

const colorThemes: { value: ColorTheme; label: string; preview: string; desc: string }[] = [
  { value: "default", label: "Electric Blue", preview: "bg-[hsl(199,89%,48%)]", desc: "Default SafeTrack theme" },
  { value: "ocean", label: "Ocean", preview: "bg-[hsl(210,100%,45%)]", desc: "Deep blue ocean vibes" },
  { value: "forest", label: "Forest", preview: "bg-[hsl(150,60%,40%)]", desc: "Natural green tones" },
  { value: "sunset", label: "Sunset", preview: "bg-[hsl(25,95%,55%)]", desc: "Warm orange glow" },
  { value: "midnight", label: "Midnight", preview: "bg-[hsl(260,60%,50%)]", desc: "Purple night sky" },
  { value: "rose", label: "Rose", preview: "bg-[hsl(340,80%,55%)]", desc: "Elegant pink accent" },
];

export default function Settings() {
  const { theme, setTheme, colorTheme, setColorTheme } = useTheme();
  const { preferences, updatePreferences } = usePreferences();
  const { toast } = useToast();

  const handleLocationToggle = async (enabled: boolean) => {
    if (enabled) {
      try {
        const permission = await navigator.permissions?.query({ name: "geolocation" });
        if (permission?.state === "denied") {
          toast({ title: "Location Blocked", description: "Please enable location access in your browser settings.", variant: "destructive" });
          return;
        }
      } catch { /* permissions API not supported, proceed */ }
    }
    updatePreferences({ locationAccess: enabled });
    toast({ title: enabled ? "Location Enabled" : "Location Disabled" });
  };

  const handlePushNotifications = async (enabled: boolean) => {
    if (enabled && "Notification" in window) {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        toast({ title: "Notifications Blocked", description: "Please allow notifications in your browser.", variant: "destructive" });
        return;
      }
    }
    updatePreferences({ pushNotifications: enabled });
    toast({ title: enabled ? "Push Notifications On" : "Push Notifications Off" });
  };

  const handleClearData = () => {
    localStorage.removeItem("safetrack_favorites");
    localStorage.removeItem("safetrack_preferences");
    toast({ title: "Data Cleared", description: "All saved data has been removed." });
    window.location.reload();
  };

  return (
    <Layout>
      <div className="p-4 space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <SettingsIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-heading text-xl font-bold">Settings</h1>
            <p className="text-sm text-muted-foreground">Customize your experience</p>
          </div>
        </div>

        {/* Mode Selector (Light/Dark/System) */}
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
            {colorThemes.map((ct) => (
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
                <div className={cn("h-8 w-8 rounded-full shrink-0 flex items-center justify-center", ct.preview)}>
                  {colorTheme === ct.value && <Check className="h-4 w-4 text-white" />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{ct.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{ct.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Language & Units */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2 px-1">Regional</h2>
          <Card className="divide-y">
            <div className="flex items-center gap-3 p-4">
              <Globe className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium">Language</p>
                <p className="text-sm text-muted-foreground">Display language</p>
              </div>
              <Select
                value={preferences.language || "en"}
                onValueChange={(val) => {
                  updatePreferences({ language: val });
                  toast({ title: "Language Updated" });
                }}
              >
                <SelectTrigger className="w-32 tv-focus">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                  <SelectItem value="ja">日本語</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3 p-4">
              <Ruler className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium">Units</p>
                <p className="text-sm text-muted-foreground">Measurement system</p>
              </div>
              <Select
                value={preferences.units}
                onValueChange={(val: "metric" | "imperial") => {
                  updatePreferences({ units: val });
                  toast({ title: `Units: ${val === "metric" ? "Metric" : "Imperial"}` });
                }}
              >
                <SelectTrigger className="w-32 tv-focus">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="metric">Metric (km, °C)</SelectItem>
                  <SelectItem value="imperial">Imperial (mi, °F)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>
        </div>

        {/* Notifications */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2 px-1">Notifications</h2>
          <Card className="divide-y">
            <div className="flex items-center gap-3 p-4">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium">Push Notifications</p>
                <p className="text-sm text-muted-foreground">Receive alerts on your device</p>
              </div>
              <Switch checked={preferences.pushNotifications ?? true} onCheckedChange={handlePushNotifications} className="tv-focus" />
            </div>
            <div className="flex items-center gap-3 p-4">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-muted-foreground">Receive email updates</p>
              </div>
              <Switch checked={preferences.emailNotifications ?? false} onCheckedChange={(val) => { updatePreferences({ emailNotifications: val }); toast({ title: val ? "Email Notifications On" : "Email Notifications Off" }); }} className="tv-focus" />
            </div>
            <div className="flex items-center gap-3 p-4">
              <Volume2 className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium">Sound</p>
                <p className="text-sm text-muted-foreground">Play sound for alerts</p>
              </div>
              <Switch checked={preferences.soundEnabled ?? true} onCheckedChange={(val) => { updatePreferences({ soundEnabled: val }); toast({ title: val ? "Sound On" : "Sound Off" }); }} className="tv-focus" />
            </div>
            <div className="flex items-center gap-3 p-4">
              <Smartphone className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium">Vibration</p>
                <p className="text-sm text-muted-foreground">Vibrate for alerts</p>
              </div>
              <Switch checked={preferences.vibrationEnabled ?? true} onCheckedChange={(val) => { updatePreferences({ vibrationEnabled: val }); toast({ title: val ? "Vibration On" : "Vibration Off" }); }} className="tv-focus" />
            </div>
          </Card>
        </div>

        {/* Data & Privacy */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2 px-1">Data & Privacy</h2>
          <Card className="divide-y">
            <div className="flex items-center gap-3 p-4">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium">Location Access</p>
                <p className="text-sm text-muted-foreground">Allow location for local data</p>
              </div>
              <Switch checked={preferences.locationAccess ?? true} onCheckedChange={handleLocationToggle} className="tv-focus" />
            </div>
            <div className="flex items-center gap-3 p-4">
              <Download className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium">Offline Mode</p>
                <p className="text-sm text-muted-foreground">Download data for offline use</p>
              </div>
              <Switch checked={preferences.offlineMode ?? false} onCheckedChange={(val) => { updatePreferences({ offlineMode: val }); toast({ title: val ? "Offline Mode Enabled" : "Offline Mode Disabled" }); }} className="tv-focus" />
            </div>
            <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium">Privacy Policy</p>
                <p className="text-sm text-muted-foreground">View our privacy policy</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </Card>
        </div>

        {/* Support */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2 px-1">Support</h2>
          <Card className="divide-y">
            <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors">
              <HelpCircle className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium">Help & FAQ</p>
                <p className="text-sm text-muted-foreground">Get help and answers</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium">Contact Support</p>
                <p className="text-sm text-muted-foreground">Send us a message</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-3 p-4">
              <Info className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium">About</p>
                <p className="text-sm text-muted-foreground">SafeTrack PWA v1.0.0</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Danger Zone */}
        <div>
          <h2 className="text-sm font-semibold text-destructive mb-2 px-1">Danger Zone</h2>
          <Card className="border-destructive/50">
            <Dialog>
              <DialogTrigger asChild>
                <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-destructive/10 transition-colors">
                  <Trash2 className="h-5 w-5 text-destructive" />
                  <div className="flex-1">
                    <p className="font-medium text-destructive">Clear All Data</p>
                    <p className="text-sm text-muted-foreground">Delete all saved favorites and preferences</p>
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Clear All Data?</DialogTitle>
                  <DialogDescription>
                    This will permanently delete all your favorites, preferences, and cached data. This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button variant="destructive" onClick={handleClearData}>Delete All</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
