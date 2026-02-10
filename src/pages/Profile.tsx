import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  User, Mail, Calendar, Edit, LogOut, Camera, Shield, Bell, Star,
  Activity, Save, X, Loader2, KeyRound, Clock, Globe, Smartphone,
  Monitor, ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useAuthorization } from "@/hooks/useAuthorization";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useFavorites } from "@/contexts/AppContext";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const { user, signOut, updatePassword } = useAuth();
  const { roles, isAdmin } = useAuthorization();
  const { toast } = useToast();
  const { favorites } = useFavorites();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [profile, setProfile] = useState({
    display_name: "",
    email: "",
    bio: "",
    avatar_url: "",
  });
  const [editForm, setEditForm] = useState(profile);

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (data) {
      const p = {
        display_name: data.display_name || user.email?.split("@")[0] || "",
        email: data.email || user.email || "",
        bio: data.bio || "",
        avatar_url: data.avatar_url || "",
      };
      setProfile(p);
      setEditForm(p);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: editForm.display_name,
        bio: editForm.bio,
        avatar_url: editForm.avatar_url,
      })
      .eq("id", user.id);

    if (error) {
      toast({ title: "Error", description: "Failed to update profile", variant: "destructive" });
    } else {
      setProfile(editForm);
      setIsEditing(false);
      toast({ title: "Profile Updated" });
    }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
      toast({ title: "Error", description: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Passwords don't match", variant: "destructive" });
      return;
    }
    setChangingPassword(true);
    const { error } = await updatePassword(newPassword);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password Changed", description: "Your password has been updated." });
      setShowChangePassword(false);
      setNewPassword("");
      setConfirmPassword("");
    }
    setChangingPassword(false);
  };

  const handleSignOut = async () => {
    await signOut();
    toast({ title: "Signed Out" });
  };

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "Unknown";

  const lastSignIn = user?.last_sign_in_at
    ? new Date(user.last_sign_in_at).toLocaleString()
    : "Unknown";

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const stats = [
    { label: "Favorites", value: favorites.length, icon: Star },
    { label: "Member Since", value: memberSince.split(" ")[0], icon: Calendar },
    { label: "Tracking", value: "Active", icon: Activity },
  ];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 space-y-6 animate-fade-in">
        {/* Profile Header */}
        <Card className="p-6 bg-gradient-to-br from-primary/10 to-accent/10">
          <div className="flex items-start gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20 border-4 border-background">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                  {profile.display_name?.split(" ").map((n) => n[0]).join("").toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                variant="secondary"
                className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full"
                onClick={() => setIsEditing(true)}
              >
                <Camera className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-heading text-xl font-bold truncate">{profile.display_name || "User"}</h1>
                {roles.map((role) => (
                  <Badge key={role} variant="secondary" className="shrink-0 text-xs">
                    {role === "admin" && <Shield className="h-3 w-3 mr-1" />}
                    {role}
                  </Badge>
                ))}
              </div>
              <p className="text-muted-foreground truncate">{profile.email}</p>
              {profile.bio && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{profile.bio}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <stat.icon className="h-5 w-5 mx-auto text-primary mb-1" />
                <p className="text-lg font-bold">{stat.value}</p>
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
              <DialogDescription>Update your profile information.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <Input id="name" value={editForm.display_name} onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea id="bio" value={editForm.bio} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} placeholder="Tell us about yourself..." rows={3} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="avatar">Avatar URL</Label>
                <Input id="avatar" value={editForm.avatar_url} onChange={(e) => setEditForm({ ...editForm, avatar_url: e.target.value })} placeholder="https://example.com/avatar.jpg" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setEditForm(profile); setIsEditing(false); }}>
                <X className="h-4 w-4 mr-2" /> Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Change Password Dialog */}
        <Dialog open={showChangePassword} onOpenChange={setShowChangePassword}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Password</DialogTitle>
              <DialogDescription>Enter your new password below.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>New Password</Label>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" />
                <PasswordStrengthMeter password={newPassword} />
              </div>
              <div className="space-y-2">
                <Label>Confirm Password</Label>
                <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-destructive">Passwords don't match</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowChangePassword(false)}>Cancel</Button>
              <Button onClick={handleChangePassword} disabled={changingPassword || !newPassword || newPassword !== confirmPassword}>
                {changingPassword ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <KeyRound className="h-4 w-4 mr-2" />}
                Update Password
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Profile Info */}
        <Card className="divide-y">
          <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setIsEditing(true)}>
            <User className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{profile.display_name || "Not set"}</p>
            </div>
            <Edit className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex items-center gap-3 p-4">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{profile.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Member since</p>
              <p className="font-medium">{memberSince}</p>
            </div>
          </div>
        </Card>

        {/* Security & Session */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2 px-1">Security</h2>
          <Card className="divide-y">
            <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setShowChangePassword(true)}>
              <KeyRound className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium">Change Password</p>
                <p className="text-sm text-muted-foreground">Update your account password</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-3 p-4">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium">Last Sign In</p>
                <p className="text-sm text-muted-foreground">{lastSignIn}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4">
              <Globe className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium">Time Zone</p>
                <p className="text-sm text-muted-foreground">{timezone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4">
              <Monitor className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium">Current Device</p>
                <p className="text-sm text-muted-foreground truncate">{navigator.userAgent.split("(")[1]?.split(")")[0] || "Unknown"}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Admin Link */}
        {isAdmin && (
          <Card className="p-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate("/admin")}>
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-amber-500" />
              <div className="flex-1">
                <p className="font-medium">Admin Panel</p>
                <p className="text-sm text-muted-foreground">Manage users and roles</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </Card>
        )}

        {/* Sign Out */}
        <Button variant="outline" className="w-full" size="lg" onClick={handleSignOut}>
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </Layout>
  );
}
