import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

const settingsGroups = [
  {
    title: "Preferences",
    items: [
      {
        icon: Bell,
        label: "Notifications",
        description: "Push notifications and alerts",
        type: "link" as const,
        path: "/notifications",
      },
      {
        icon: Globe,
        label: "Language",
        description: "English (US)",
        type: "link" as const,
      },
      {
        icon: Ruler,
        label: "Units",
        description: "Metric (km, °C)",
        type: "link" as const,
      },
    ],
  },
  {
    title: "Data & Privacy",
    items: [
      {
        icon: Shield,
        label: "Privacy",
        description: "Data and location settings",
        type: "link" as const,
      },
      {
        icon: Globe,
        label: "Offline Mode",
        description: "Download data for offline use",
        type: "toggle" as const,
        defaultValue: false,
      },
    ],
  },
  {
    title: "Support",
    items: [
      {
        icon: HelpCircle,
        label: "Help & FAQ",
        description: "Get help and answers",
        type: "link" as const,
      },
      {
        icon: Info,
        label: "About",
        description: "Version 1.0.0",
        type: "link" as const,
      },
    ],
  },
];

export default function Settings() {
  const { theme, setTheme } = useTheme();

  const themeOptions = [
    { value: "light" as const, icon: Sun, label: "Light" },
    { value: "dark" as const, icon: Moon, label: "Dark" },
    { value: "system" as const, icon: Monitor, label: "System" },
  ];

  return (
    <Layout>
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <SettingsIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-heading text-xl font-bold">Settings</h1>
            <p className="text-sm text-muted-foreground">
              Customize your experience
            </p>
          </div>
        </div>

        {/* Theme Selector */}
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <Palette className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Appearance</p>
              <p className="text-sm text-muted-foreground">
                Choose your preferred theme
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {themeOptions.map((option) => (
              <Button
                key={option.value}
                variant={theme === option.value ? "default" : "outline"}
                className="flex-1"
                onClick={() => setTheme(option.value)}
              >
                <option.icon className="h-4 w-4 mr-2" />
                {option.label}
              </Button>
            ))}
          </div>
        </Card>

        {/* Settings Groups */}
        {settingsGroups.map((group) => (
          <div key={group.title}>
            <h2 className="text-sm font-semibold text-muted-foreground mb-2 px-1">
              {group.title}
            </h2>
            <Card className="divide-y">
              {group.items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-4"
                >
                  <item.icon className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="font-medium">{item.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                  {item.type === "toggle" ? (
                    <Switch defaultChecked={item.defaultValue} />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              ))}
            </Card>
          </div>
        ))}
      </div>
    </Layout>
  );
}
