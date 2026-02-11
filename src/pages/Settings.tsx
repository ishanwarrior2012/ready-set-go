import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Settings as SettingsIcon, Bell, Ruler, Shield, ChevronRight, MapPin,
  Download, Trash2, Mail, MessageSquare, Smartphone, Volume2, RefreshCw,
  Map, Wifi, Heart, Globe, Type, DollarSign, Clock,
} from "lucide-react";
import { usePreferences } from "@/contexts/AppContext";
import { useToast } from "@/hooks/use-toast";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader,
  DialogTitle, DialogTrigger, DialogClose,
} from "@/components/ui/dialog";
import { ThemeSelector } from "@/components/settings/ThemeSelector";
import { LanguageSelector } from "@/components/settings/LanguageSelector";
import { HelpFAQ } from "@/components/settings/HelpFAQ";
import { AboutDialog } from "@/components/settings/AboutDialog";
import { Slider } from "@/components/ui/slider";
import { useTranslation } from "react-i18next";

export default function Settings() {
  const { preferences, updatePreferences } = usePreferences();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();

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
    toast({ title: t("settings.clearAllData"), description: t("settings.clearDataDescription") });
    window.location.reload();
  };

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    updatePreferences({ language: lang });
    // Auto-detect RTL for known RTL languages
    const rtlLangs = ["ar", "he", "fa", "ur", "ps", "sd", "yi", "ku"];
    const isRtl = rtlLangs.includes(lang);
    updatePreferences({ rtl: isRtl });
  };

  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <Layout>
      <div className="p-4 space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <SettingsIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-heading text-xl font-bold">{t("settings.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("settings.customize")}</p>
          </div>
        </div>

        {/* Theme Selectors */}
        <ThemeSelector />

        {/* Language, Units, RTL, Currency, Timezone */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2 px-1">{t("settings.regional")}</h2>
          <Card className="divide-y">
            <LanguageSelector />
            <div className="flex items-center gap-3 p-4">
              <Ruler className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium">{t("settings.units")}</p>
                <p className="text-sm text-muted-foreground">Measurement system</p>
              </div>
              <Select value={preferences.units} onValueChange={(val: "metric" | "imperial") => { updatePreferences({ units: val }); toast({ title: `Units: ${val}` }); }}>
                <SelectTrigger className="w-32 tv-focus"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="metric">{t("settings.metric")}</SelectItem>
                  <SelectItem value="imperial">{t("settings.imperial")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* RTL Toggle */}
            <div className="flex items-center gap-3 p-4">
              <Type className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium">{t("settings.rtlMode")}</p>
                <p className="text-sm text-muted-foreground">{t("settings.rtlDescription")}</p>
              </div>
              <Switch checked={preferences.rtl} onCheckedChange={(val) => { updatePreferences({ rtl: val }); toast({ title: val ? "RTL Enabled" : "LTR Enabled" }); }} className="tv-focus" />
            </div>
            {/* Currency */}
            <div className="flex items-center gap-3 p-4">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium">{t("settings.currency")}</p>
                <p className="text-sm text-muted-foreground">Price display format</p>
              </div>
              <Select value={preferences.currency} onValueChange={(val) => { updatePreferences({ currency: val }); toast({ title: `Currency: ${val}` }); }}>
                <SelectTrigger className="w-32 tv-focus"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["USD", "EUR", "GBP", "INR", "JPY", "CNY", "AUD", "CAD", "CHF", "KRW", "BRL", "MXN", "SAR", "AED", "RUB"].map(c => (
                    <SelectItem key={c} value={c}>{c} ({new Intl.NumberFormat(undefined, { style: "currency", currency: c }).format(0).replace(/[\d.,\s]/g, "").trim()})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Date Format */}
            <div className="flex items-center gap-3 p-4">
              <Globe className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium">{t("settings.dateFormat")}</p>
                <p className="text-sm text-muted-foreground">How dates are displayed</p>
              </div>
              <Select value={preferences.dateFormat} onValueChange={(val: "short" | "long" | "datetime") => { updatePreferences({ dateFormat: val }); toast({ title: `Date: ${val}` }); }}>
                <SelectTrigger className="w-32 tv-focus"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Short</SelectItem>
                  <SelectItem value="long">Long</SelectItem>
                  <SelectItem value="datetime">Date & Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Timezone */}
            <div className="flex items-center gap-3 p-4">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium">{t("settings.timezone")}</p>
                <p className="text-sm text-muted-foreground">{userTimezone}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Map Settings */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2 px-1">{t("settings.map")}</h2>
          <Card className="divide-y">
            <div className="flex items-center gap-3 p-4">
              <Map className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium">{t("settings.defaultMapView")}</p>
                <p className="text-sm text-muted-foreground">Map layer style</p>
              </div>
              <Select value={preferences.defaultMapView} onValueChange={(val: "satellite" | "terrain" | "standard") => { updatePreferences({ defaultMapView: val }); toast({ title: `Map: ${val}` }); }}>
                <SelectTrigger className="w-32 tv-focus"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">{t("settings.standard")}</SelectItem>
                  <SelectItem value="satellite">{t("settings.satellite")}</SelectItem>
                  <SelectItem value="terrain">{t("settings.terrain")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>
        </div>

        {/* Auto Refresh */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2 px-1">{t("settings.dataRefresh")}</h2>
          <Card className="divide-y">
            <div className="flex items-center gap-3 p-4">
              <RefreshCw className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium">{t("settings.autoRefresh")}</p>
                <p className="text-sm text-muted-foreground">Automatically update live data</p>
              </div>
              <Switch checked={preferences.autoRefresh ?? true} onCheckedChange={(val) => { updatePreferences({ autoRefresh: val }); toast({ title: val ? "Auto Refresh On" : "Auto Refresh Off" }); }} className="tv-focus" />
            </div>
            {preferences.autoRefresh && (
              <div className="flex items-center gap-3 p-4">
                <Wifi className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium">{t("settings.refreshInterval")}</p>
                  <p className="text-sm text-muted-foreground">{preferences.refreshInterval}s</p>
                </div>
                <div className="w-32">
                  <Slider value={[preferences.refreshInterval]} min={10} max={120} step={5} onValueChange={([val]) => updatePreferences({ refreshInterval: val })} />
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Notifications */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2 px-1">{t("settings.notifications")}</h2>
          <Card className="divide-y">
            <div className="flex items-center gap-3 p-4">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium">{t("settings.pushNotifications")}</p>
                <p className="text-sm text-muted-foreground">Receive alerts on your device</p>
              </div>
              <Switch checked={preferences.pushNotifications ?? true} onCheckedChange={handlePushNotifications} className="tv-focus" />
            </div>
            <div className="flex items-center gap-3 p-4">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium">{t("settings.emailNotifications")}</p>
                <p className="text-sm text-muted-foreground">Receive email updates</p>
              </div>
              <Switch checked={preferences.emailNotifications ?? false} onCheckedChange={(val) => { updatePreferences({ emailNotifications: val }); }} className="tv-focus" />
            </div>
            <div className="flex items-center gap-3 p-4">
              <Volume2 className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium">{t("settings.sound")}</p>
                <p className="text-sm text-muted-foreground">Play sound for alerts</p>
              </div>
              <Switch checked={preferences.soundEnabled ?? true} onCheckedChange={(val) => { updatePreferences({ soundEnabled: val }); }} className="tv-focus" />
            </div>
            <div className="flex items-center gap-3 p-4">
              <Smartphone className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium">{t("settings.vibration")}</p>
                <p className="text-sm text-muted-foreground">Vibrate for alerts</p>
              </div>
              <Switch checked={preferences.vibrationEnabled ?? true} onCheckedChange={(val) => { updatePreferences({ vibrationEnabled: val }); }} className="tv-focus" />
            </div>
          </Card>
        </div>

        {/* Alert Categories */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2 px-1">{t("settings.alertCategories")}</h2>
          <Card className="divide-y">
            {[
              { key: "earthquakes" as const, label: t("settings.earthquakeAlerts"), desc: "Seismic activity" },
              { key: "volcanoes" as const, label: t("settings.volcanoAlerts"), desc: "Volcanic activity" },
              { key: "weather" as const, label: t("settings.weatherAlerts"), desc: "Severe weather" },
              { key: "flights" as const, label: t("settings.flightAlerts"), desc: "Flight status" },
            ].map((item) => (
              <div key={item.key} className="flex items-center gap-3 p-4">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
                <Switch checked={preferences.notifications?.[item.key] ?? true} onCheckedChange={(val) => { updatePreferences({ notifications: { ...preferences.notifications, [item.key]: val } }); }} className="tv-focus" />
              </div>
            ))}
          </Card>
        </div>

        {/* Data & Privacy */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2 px-1">{t("settings.dataPrivacy")}</h2>
          <Card className="divide-y">
            <div className="flex items-center gap-3 p-4">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium">{t("settings.locationAccess")}</p>
                <p className="text-sm text-muted-foreground">Allow location for local data</p>
              </div>
              <Switch checked={preferences.locationAccess ?? true} onCheckedChange={handleLocationToggle} className="tv-focus" />
            </div>
            <div className="flex items-center gap-3 p-4">
              <Download className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium">{t("settings.offlineMode")}</p>
                <p className="text-sm text-muted-foreground">Download data for offline use</p>
              </div>
              <Switch checked={preferences.offlineMode ?? false} onCheckedChange={(val) => { updatePreferences({ offlineMode: val }); }} className="tv-focus" />
            </div>
            <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium">{t("settings.privacyPolicy")}</p>
                <p className="text-sm text-muted-foreground">View our privacy policy</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </Card>
        </div>

        {/* Support */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2 px-1">{t("settings.support")}</h2>
          <Card className="divide-y">
            <HelpFAQ />
            <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium">{t("settings.contactSupport")}</p>
                <p className="text-sm text-muted-foreground">Send us a message</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
            <AboutDialog />
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center py-4 space-y-2">
          <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
            Made with <Heart className="h-3 w-3 text-destructive fill-destructive" /> by <span className="font-semibold text-foreground">Shrot Singh</span>
          </div>
          <p className="text-xs text-muted-foreground">SafeTrack PWA v1.0.0 • © {new Date().getFullYear()}</p>
        </div>

        {/* Danger Zone */}
        <div>
          <h2 className="text-sm font-semibold text-destructive mb-2 px-1">{t("settings.dangerZone")}</h2>
          <Card className="border-destructive/50">
            <Dialog>
              <DialogTrigger asChild>
                <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-destructive/10 transition-colors">
                  <Trash2 className="h-5 w-5 text-destructive" />
                  <div className="flex-1">
                    <p className="font-medium text-destructive">{t("settings.clearAllData")}</p>
                    <p className="text-sm text-muted-foreground">{t("settings.clearDataDescription")}</p>
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("settings.clearAllData")}?</DialogTitle>
                  <DialogDescription>{t("settings.clearDataConfirm")}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">{t("settings.cancel")}</Button>
                  </DialogClose>
                  <Button variant="destructive" onClick={handleClearData}>{t("settings.deleteAll")}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
