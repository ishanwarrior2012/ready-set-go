import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell,
  Mountain,
  Plane,
  Ship,
  Cloud,
  AlertTriangle,
  Trash2,
  Settings,
} from "lucide-react";

const notifications = [
  {
    id: 1,
    type: "earthquake",
    icon: Mountain,
    title: "M5.2 Earthquake Detected",
    message: "A magnitude 5.2 earthquake occurred near Tokyo, Japan",
    time: "12 min ago",
    unread: true,
  },
  {
    id: 2,
    type: "volcano",
    icon: AlertTriangle,
    title: "Volcanic Activity Alert",
    message: "Mount Etna showing increased activity levels",
    time: "1 hour ago",
    unread: true,
  },
  {
    id: 3,
    type: "flight",
    icon: Plane,
    title: "Flight Status Update",
    message: "Flight AA123 has departed from LAX on time",
    time: "2 hours ago",
    unread: false,
  },
  {
    id: 4,
    type: "weather",
    icon: Cloud,
    title: "Weather Alert",
    message: "Storm warning issued for Gulf of Mexico region",
    time: "3 hours ago",
    unread: false,
  },
];

const alertSettings = [
  { id: "earthquakes", label: "Earthquakes", description: "Magnitude 4.0+", enabled: true },
  { id: "volcanoes", label: "Volcanic Activity", description: "All alerts", enabled: true },
  { id: "flights", label: "Flight Tracking", description: "Favorited flights", enabled: true },
  { id: "weather", label: "Weather Alerts", description: "Severe weather only", enabled: false },
];

export default function Notifications() {
  return (
    <Layout>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-heading text-xl font-bold">Notifications</h1>
              <p className="text-sm text-muted-foreground">
                Alerts and updates
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all">
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">
              All
            </TabsTrigger>
            <TabsTrigger value="unread" className="flex-1">
              Unread
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex-1">
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            <Card className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-3 p-4 ${
                    notification.unread ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted shrink-0">
                    <notification.icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">
                        {notification.title}
                      </p>
                      {notification.unread && (
                        <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {notification.time}
                    </p>
                  </div>
                  <Button size="icon" variant="ghost" className="shrink-0">
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </Card>
          </TabsContent>

          <TabsContent value="unread" className="mt-4">
            <Card className="divide-y">
              {notifications
                .filter((n) => n.unread)
                .map((notification) => (
                  <div
                    key={notification.id}
                    className="flex items-start gap-3 p-4 bg-primary/5"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted shrink-0">
                      <notification.icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">
                          {notification.title}
                        </p>
                        <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {notification.time}
                      </p>
                    </div>
                    <Button size="icon" variant="ghost" className="shrink-0">
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                ))}
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="mt-4">
            <Card className="divide-y">
              {alertSettings.map((setting) => (
                <div key={setting.id} className="flex items-center gap-3 p-4">
                  <div className="flex-1">
                    <p className="font-medium">{setting.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {setting.description}
                    </p>
                  </div>
                  <Switch defaultChecked={setting.enabled} />
                </div>
              ))}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
