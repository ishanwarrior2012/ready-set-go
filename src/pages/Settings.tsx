import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Settings as SettingsIcon,
  Bell,
  Ruler,
  Shield,
  ChevronRight,
  MapPin,
  Download,
  Trash2,
  Mail,
  MessageSquare,
  Smartphone,
  Volume2,
  RefreshCw,
  Map,
  Wifi,
  Heart,
} from "lucide-react";
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
import { ThemeSelector } from "@/components/settings/ThemeSelector";
import { LanguageSelector } from "@/components/settings/LanguageSelector";
import { HelpFAQ } from "@/components/settings/HelpFAQ";
import { AboutDialog } from "@/components/settings/AboutDialog";
import { Slider } from "@/components/ui/slider";

export default function Settings() {
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

        {/* Theme Selectors */}
        <ThemeSelector />

        {/* Language & Units */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2 px-1">Regional</h2>
          <Card className="divide-y">
            <LanguageSelector />
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

        {/* Map Settings */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2 px-1">Map</h2>
          <Card className="divide-y">
            <div className="flex items-center gap-3 p-4">
              <Map className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium">Default Map View</p>
                <p className="text-sm text-muted-foreground">Map layer style</p>
              </div>
              <Select
                value={preferences.defaultMapView}
                onValueChange={(val: "satellite" | "terrain" | "standard") => {
                  updatePreferences({ defaultMapView: val });
                  toast({ title: `Map: ${val}` });
                }}
              >
                <SelectTrigger className="w-32 tv-focus">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="satellite">Satellite</SelectItem>
                  <SelectItem value="terrain">Terrain</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>
        </div>

        {/* Auto Refresh */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2 px-1">Data Refresh</h2>
          <Card className="divide-y">
            <div className="flex items-center gap-3 p-4">
              <RefreshCw className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium">Auto Refresh</p>
                <p className="text-sm text-muted-foreground">Automatically update live data</p>
              </div>
              <Switch checked={preferences.autoRefresh ?? true} onCheckedChange={(val) => { updatePreferences({ autoRefresh: val }); toast({ title: val ? "Auto Refresh On" : "Auto Refresh Off" }); }} className="tv-focus" />
            </div>
            {preferences.autoRefresh && (
              <div className="flex items-center gap-3 p-4">
                <Wifi className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium">Refresh Interval</p>
                  <p className="text-sm text-muted-foreground">{preferences.refreshInterval}s</p>
                </div>
                <div className="w-32">
                  <Slider
                    value={[preferences.refreshInterval]}
                    min={10}
                    max={120}
                    step={5}
                    onValueChange={([val]) => updatePreferences({ refreshInterval: val })}
                  />
                </div>
              </div>
            )}
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

        {/* Notification Categories */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2 px-1">Alert Categories</h2>
          <Card className="divide-y">
            {[
              { key: "earthquakes" as const, label: "Earthquake Alerts", desc: "Seismic activity notifications" },
              { key: "volcanoes" as const, label: "Volcano Alerts", desc: "Volcanic activity updates" },
              { key: "weather" as const, label: "Weather Alerts", desc: "Severe weather warnings" },
              { key: "flights" as const, label: "Flight Alerts", desc: "Flight status updates" },
            ].map((item) => (
              <div key={item.key} className="flex items-center gap-3 p-4">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
                <Switch
                  checked={preferences.notifications?.[item.key] ?? true}
                  onCheckedChange={(val) => {
                    updatePreferences({
                      notifications: { ...preferences.notifications, [item.key]: val },
                    });
                    toast({ title: `${item.label}: ${val ? "On" : "Off"}` });
                  }}
                  className="tv-focus"
                />
              </div>
            ))}
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
            <HelpFAQ />
            <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium">Contact Support</p>
                <p className="text-sm text-muted-foreground">Send us a message</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
            <AboutDialog />
          </Card>
        </div>

        {/* Created By Footer */}
        <div className="text-center py-4 space-y-2">
          <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
            Made with <Heart className="h-3 w-3 text-destructive fill-destructive" /> by <span className="font-semibold text-foreground">Shrot Singh</span>
          </div>
          <p className="text-xs text-muted-foreground">SafeTrack PWA v1.0.0 • © {new Date().getFullYear()}</p>
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
