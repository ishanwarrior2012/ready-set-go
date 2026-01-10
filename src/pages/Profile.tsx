import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  User,
  Mail,
  MapPin,
  Calendar,
  Edit,
  LogOut,
  ChevronRight,
  Camera,
  Shield,
  Bell,
  Star,
  Activity,
  Save,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const stats = [
  { label: "Tracked Flights", value: 47, icon: Activity },
  { label: "Favorites", value: 12, icon: Star },
  { label: "Alerts Set", value: 8, icon: Bell },
];

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: "John Doe",
    email: "john.doe@example.com",
    location: "San Francisco, CA",
    memberSince: "January 2025",
  });
  const [editForm, setEditForm] = useState(profile);

  const handleSave = () => {
    setProfile(editForm);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditForm(profile);
    setIsEditing(false);
  };

  return (
    <Layout>
      <div className="p-4 space-y-6 animate-fade-in">
        {/* Profile Header */}
        <Card className="p-6 bg-gradient-to-br from-primary/10 to-purple-500/10">
          <div className="flex items-start gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20 border-4 border-background">
                <AvatarImage src="" />
                <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                  {profile.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <Button 
                size="icon" 
                variant="secondary" 
                className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full"
              >
                <Camera className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-heading text-xl font-bold truncate">{profile.name}</h1>
                <Badge variant="secondary" className="shrink-0">
                  <Star className="h-3 w-3 mr-1" />
                  Pro
                </Badge>
              </div>
              <p className="text-muted-foreground truncate">{profile.email}</p>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <MapPin className="h-3 w-3" />
                {profile.location}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <stat.icon className="h-5 w-5 mx-auto text-primary mb-1" />
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Edit Profile Dialog */}
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
              <DialogDescription>
                Make changes to your profile here.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Profile Info */}
        <Card className="divide-y">
          <div 
            className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => setIsEditing(true)}
          >
            <User className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{profile.name}</p>
            </div>
            <Edit className="h-4 w-4 text-muted-foreground" />
          </div>
          <div 
            className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => setIsEditing(true)}
          >
            <Mail className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{profile.email}</p>
            </div>
            <Edit className="h-4 w-4 text-muted-foreground" />
          </div>
          <div 
            className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => setIsEditing(true)}
          >
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Location</p>
              <p className="font-medium">{profile.location}</p>
            </div>
            <Edit className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex items-center gap-3 p-4">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Member since</p>
              <p className="font-medium">{profile.memberSince}</p>
            </div>
          </div>
        </Card>

        {/* Account Actions */}
        <Card className="divide-y">
          <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="font-medium">Security</p>
              <p className="text-sm text-muted-foreground">
                Password and authentication
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="font-medium">Notification Preferences</p>
              <p className="text-sm text-muted-foreground">
                Manage your alerts
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </Card>

        {/* Sign Out */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full" size="lg">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Sign Out</DialogTitle>
              <DialogDescription>
                Are you sure you want to sign out of your account?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline">Cancel</Button>
              <Button variant="destructive">Sign Out</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
