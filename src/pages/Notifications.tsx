import { useState } from "react";
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
  Check,
  CheckCheck,
  Flame,
  Clock,
  MoreVertical,
  BellOff,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Slider } from "@/components/ui/slider";

interface Notification {
  id: number;
  type: string;
  icon: React.ElementType;
  title: string;
  message: string;
  time: string;
  unread: boolean;
  priority: "high" | "medium" | "low";
}

const initialNotifications: Notification[] = [
  {
    id: 1,
    type: "earthquake",
    icon: Mountain,
    title: "M5.2 Earthquake Detected",
    message: "A magnitude 5.2 earthquake occurred near Tokyo, Japan. No tsunami warning issued.",
    time: "12 min ago",
    unread: true,
    priority: "high",
  },
  {
    id: 2,
    type: "volcano",
    icon: Flame,
    title: "Volcanic Activity Alert",
    message: "Mount Etna showing increased activity levels. Advisory level raised to orange.",
    time: "1 hour ago",
    unread: true,
    priority: "high",
  },
  {
    id: 3,
    type: "flight",
    icon: Plane,
    title: "Flight Status Update",
    message: "Flight AA123 has departed from LAX on time. Expected arrival at JFK: 8:45 PM.",
    time: "2 hours ago",
    unread: false,
    priority: "medium",
  },
  {
    id: 4,
    type: "weather",
    icon: Cloud,
    title: "Weather Alert",
    message: "Storm warning issued for Gulf of Mexico region. Expect heavy rainfall.",
    time: "3 hours ago",
    unread: false,
    priority: "medium",
  },
  {
    id: 5,
    type: "marine",
    icon: Ship,
    title: "Vessel Arrival",
    message: "MSC Oscar has arrived at Port of Los Angeles.",
    time: "5 hours ago",
    unread: false,
    priority: "low",
  },
];

const alertSettings = [
  { id: "earthquakes", label: "Earthquakes", description: "Seismic activity alerts", icon: Mountain, enabled: true, minMagnitude: 4.0 },
  { id: "volcanoes", label: "Volcanic Activity", description: "Eruption and activity alerts", icon: Flame, enabled: true },
  { id: "flights", label: "Flight Tracking", description: "Status updates for favorites", icon: Plane, enabled: true },
  { id: "weather", label: "Weather Alerts", description: "Severe weather warnings", icon: Cloud, enabled: false },
  { id: "marine", label: "Marine Traffic", description: "Vessel tracking alerts", icon: Ship, enabled: false },
];

function getPriorityColor(priority: string) {
  switch (priority) {
    case "high":
      return "border-l-red-500";
    case "medium":
      return "border-l-yellow-500";
    default:
      return "border-l-blue-500";
  }
}

function getTypeColor(type: string) {
  switch (type) {
    case "earthquake":
      return "bg-orange-500/10 text-orange-500";
    case "volcano":
      return "bg-red-500/10 text-red-500";
    case "flight":
      return "bg-blue-500/10 text-blue-500";
    case "weather":
      return "bg-sky-500/10 text-sky-500";
    case "marine":
      return "bg-cyan-500/10 text-cyan-500";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export default function Notifications() {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [settings, setSettings] = useState(alertSettings);
  const [earthquakeMagnitude, setEarthquakeMagnitude] = useState([4.0]);

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAsRead = (id: number) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, unread: false } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const deleteNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const toggleSetting = (id: string) => {
    setSettings(prev => 
      prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s)
    );
  };

  return (
    <Layout>
      <div className="p-4 space-y-4 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Bell className="h-6 w-6 text-primary" />
              </div>
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 justify-center">
                  {unreadCount}
                </Badge>
              )}
            </div>
            <div>
              <h1 className="font-heading text-xl font-bold">Notifications</h1>
              <p className="text-sm text-muted-foreground">
                {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
              </p>
            </div>
          </div>
          {notifications.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={markAllAsRead}>
                  <CheckCheck className="h-4 w-4 mr-2" />
                  Mark all as read
                </DropdownMenuItem>
                <DropdownMenuItem onClick={clearAll} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear all
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all">
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">
              All
              {notifications.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 justify-center">
                  {notifications.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="unread" className="flex-1">
              Unread
              {unreadCount > 0 && (
                <Badge className="ml-2 h-5 w-5 p-0 justify-center">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex-1">
              <Settings className="h-4 w-4 mr-1" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            {notifications.length > 0 ? (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <Card
                    key={notification.id}
                    className={`border-l-4 ${getPriorityColor(notification.priority)} ${
                      notification.unread ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3 p-4">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full shrink-0 ${getTypeColor(notification.type)}`}>
                        <notification.icon className="h-5 w-5" />
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
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {notification.time}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" className="shrink-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {notification.unread && (
                            <DropdownMenuItem onClick={() => markAsRead(notification.id)}>
                              <Check className="h-4 w-4 mr-2" />
                              Mark as read
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            onClick={() => deleteNotification(notification.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <BellOff className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium mb-1">No notifications</p>
                <p className="text-sm text-muted-foreground">
                  You're all caught up! Check back later for updates.
                </p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="unread" className="mt-4">
            {notifications.filter(n => n.unread).length > 0 ? (
              <div className="space-y-3">
                {notifications
                  .filter((n) => n.unread)
                  .map((notification) => (
                    <Card
                      key={notification.id}
                      className={`border-l-4 ${getPriorityColor(notification.priority)} bg-primary/5`}
                    >
                      <div className="flex items-start gap-3 p-4">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full shrink-0 ${getTypeColor(notification.type)}`}>
                          <notification.icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">
                              {notification.title}
                            </p>
                            <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {notification.time}
                          </p>
                        </div>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="shrink-0"
                          onClick={() => markAsRead(notification.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <CheckCheck className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <p className="font-medium mb-1">All caught up!</p>
                <p className="text-sm text-muted-foreground">
                  No unread notifications
                </p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="settings" className="mt-4 space-y-4">
            <Card className="divide-y">
              {settings.map((setting) => (
                <div key={setting.id} className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      setting.enabled ? getTypeColor(setting.id) : "bg-muted text-muted-foreground"
                    }`}>
                      <setting.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{setting.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {setting.description}
                      </p>
                    </div>
                    <Switch 
                      checked={setting.enabled} 
                      onCheckedChange={() => toggleSetting(setting.id)} 
                    />
                  </div>
                  
                  {/* Earthquake Magnitude Slider */}
                  {setting.id === "earthquakes" && setting.enabled && (
                    <div className="mt-4 pl-13 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Minimum magnitude</span>
                        <Badge variant="secondary">{earthquakeMagnitude[0].toFixed(1)}+</Badge>
                      </div>
                      <Slider
                        value={earthquakeMagnitude}
                        onValueChange={setEarthquakeMagnitude}
                        min={2.0}
                        max={7.0}
                        step={0.5}
                        className="mt-2"
                      />
                    </div>
                  )}
                </div>
              ))}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
