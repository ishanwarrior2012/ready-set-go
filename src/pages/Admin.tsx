import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Shield, Users, Search, Crown, UserCog, User, Loader2, RefreshCw,
  ChevronDown, Calendar, AtSign, Code, Camera, Briefcase, Star, UserCheck,
  Trash2, Mail, Info, MessageSquare, BarChart3,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { useAuthorization } from "@/hooks/useAuthorization";
import { LoadingPage } from "@/components/ui/LoadingSpinner";
import { useIntlFormat } from "@/hooks/useIntlFormat";

interface AdminUser {
  id: string;
  display_name: string | null;
  email: string | null;
  auth_email: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  roles: string[];
}

const ALL_ROLES = ["owner", "admin", "moderator", "developer", "media", "staff", "pro_member", "member", "user"] as const;

const roleConfig: Record<string, { icon: typeof Crown; color: string; bg: string }> = {
  owner: { icon: Crown, color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/30" },
  admin: { icon: Shield, color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/30" },
  moderator: { icon: UserCog, color: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/30" },
  developer: { icon: Code, color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/30" },
  media: { icon: Camera, color: "text-pink-500", bg: "bg-pink-500/10 border-pink-500/30" },
  staff: { icon: Briefcase, color: "text-indigo-500", bg: "bg-indigo-500/10 border-indigo-500/30" },
  pro_member: { icon: Star, color: "text-orange-500", bg: "bg-orange-500/10 border-orange-500/30" },
  member: { icon: UserCheck, color: "text-teal-500", bg: "bg-teal-500/10 border-teal-500/30" },
  user: { icon: User, color: "text-muted-foreground", bg: "bg-muted border-border" },
};

const rolePriority: Record<string, number> = {
  owner: 0, admin: 1, moderator: 2, developer: 3, media: 4, staff: 5, pro_member: 6, member: 7, user: 8,
};

function UserDetailSheet({ u, open, onClose, onRoleChange, onDelete, updatingRole, currentUserId, formatDate }: {
  u: AdminUser | null;
  open: boolean;
  onClose: () => void;
  onRoleChange: (userId: string, role: string, op: "add" | "remove") => void;
  onDelete: (userId: string, name: string) => void;
  updatingRole: string | null;
  currentUserId?: string;
  formatDate: (d: string) => string;
}) {
  if (!u) return null;
  const isMe = u.id === currentUserId;
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2"><Info className="w-4 h-4 text-primary" /> User Details</SheetTitle>
          <SheetDescription>Full profile and role management</SheetDescription>
        </SheetHeader>
        <div className="space-y-5">
          {/* Avatar + name */}
          <div className="flex flex-col items-center gap-3 py-4 bg-muted/30 rounded-xl">
            <Avatar className="h-20 w-20 border-4 border-background shadow-lg">
              <AvatarImage src={u.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                {(u.display_name || u.auth_email || "U")[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <p className="font-bold text-lg">{u.display_name || "Unnamed"}</p>
              {u.bio && <p className="text-sm text-muted-foreground mt-1 max-w-xs">{u.bio}</p>}
            </div>
          </div>

          {/* Info rows */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
              <Mail className="h-4 w-4 text-primary shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-medium text-sm break-all">{u.auth_email || "No email"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Member Since</p>
                <p className="font-medium text-sm">{formatDate(u.created_at)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
              <AtSign className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">User ID</p>
                <p className="font-mono text-xs text-muted-foreground break-all">{u.id}</p>
              </div>
            </div>
          </div>

          {/* Roles */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Assigned Roles</p>
            <div className="flex flex-wrap gap-2">
              {u.roles.length > 0 ? u.roles.map(role => {
                const rc = roleConfig[role] || roleConfig.user;
                const Icon = rc.icon;
                return (
                  <Badge key={role} variant="outline" className={`${rc.bg}`}>
                    <Icon className={`h-3 w-3 me-1 ${rc.color}`} />
                    {role.replace("_", " ")}
                  </Badge>
                );
              }) : <p className="text-sm text-muted-foreground">No roles assigned</p>}
            </div>
          </div>

          {/* Role management */}
          {!isMe && (
            <>
              <Separator />
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Role Management</p>
                <div className="grid grid-cols-3 gap-2">
                  {ALL_ROLES.map(role => {
                    const has = u.roles.includes(role);
                    const rc = roleConfig[role];
                    const Icon = rc.icon;
                    return (
                      <button key={role}
                        onClick={() => onRoleChange(u.id, role, has ? "remove" : "add")}
                        disabled={updatingRole === u.id}
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs font-medium transition-colors ${
                          has ? `${rc.bg} border-current` : "bg-muted/50 border-border hover:border-primary hover:bg-primary/5"
                        }`}
                      >
                        <Icon className={`h-4 w-4 ${has ? rc.color : "text-muted-foreground"}`} />
                        <span className={has ? rc.color : "text-muted-foreground"}>{role.replace("_", " ")}</span>
                        {has && <span className="text-[10px] text-primary">Active</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              <Separator />
              {/* Delete */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full" disabled={updatingRole === u.id || u.roles.includes("owner")}>
                    <Trash2 className="h-4 w-4 mr-2" /> Remove User Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove User</AlertDialogTitle>
                    <AlertDialogDescription>
                      Permanently remove <strong>{u.display_name || u.auth_email || "this user"}</strong>? This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => { onDelete(u.id, u.display_name || u.auth_email || ""); onClose(); }}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >Remove</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
          {isMe && <p className="text-xs text-center text-muted-foreground">This is your account — self-modification is disabled.</p>}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function Admin() {
  const { user } = useAuth();
  const { isAdmin, loading: rolesLoading } = useAuthorization();
  const { formatDate } = useIntlFormat();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => { if (isAdmin) fetchUsers(); }, [isAdmin]);

  const fetchUsers = async () => {
    setLoading(true); setProgress(20);
    try {
      setProgress(50);
      const res = await supabase.functions.invoke("admin-users", { body: { action: "list_users" } });
      setProgress(80);
      if (res.error) throw res.error;
      setUsers(res.data?.users || []);
      setProgress(100);
    } catch (err: any) {
      toast.error("Failed to load users: " + (err.message || "Unknown error"));
    }
    setTimeout(() => setLoading(false), 300);
  };

  const handleRoleChange = async (userId: string, role: string, operation: "add" | "remove") => {
    setUpdatingRole(userId);
    try {
      const res = await supabase.functions.invoke("admin-users", { body: { action: "update_role", user_id: userId, role, operation } });
      if (res.error) throw res.error;
      toast.success(operation === "add" ? `Added ${role} role` : `Removed ${role} role`);
      await fetchUsers();
      // Update selected user in sheet if open
      if (selectedUser?.id === userId) {
        setSelectedUser(prev => {
          if (!prev) return prev;
          const roles = operation === "add" ? [...prev.roles, role] : prev.roles.filter(r => r !== role);
          return { ...prev, roles };
        });
      }
    } catch (err: any) {
      toast.error("Failed to update role: " + (err.message || "Unknown error"));
    }
    setUpdatingRole(null);
  };

  const handleDeleteUser = async (userId: string, displayName: string) => {
    setUpdatingRole(userId);
    try {
      const res = await supabase.functions.invoke("admin-users", { body: { action: "delete_user", user_id: userId } });
      if (res.error) throw res.error;
      if (res.data?.error) throw new Error(res.data.error);
      toast.success(`User "${displayName || "Unnamed"}" has been removed`);
      await fetchUsers();
    } catch (err: any) {
      toast.error("Failed to delete user: " + (err.message || "Unknown error"));
    }
    setUpdatingRole(null);
  };

  const openUserSheet = (u: AdminUser) => { setSelectedUser(u); setSheetOpen(true); };

  if (rolesLoading) return <LoadingPage />;
  if (!isAdmin) return <Navigate to="/" replace />;

  const filtered = users.filter(u => {
    const q = searchQuery.toLowerCase();
    return (u.display_name || "").toLowerCase().includes(q) ||
      (u.auth_email || "").toLowerCase().includes(q) ||
      u.roles.some(r => r.toLowerCase().includes(q));
  });

  const getHighestRole = (roles: string[]) => {
    let best = "user", bestPri = 99;
    for (const r of roles) { if ((rolePriority[r] ?? 99) < bestPri) { best = r; bestPri = rolePriority[r] ?? 99; } }
    return best;
  };

  return (
    <Layout>
      <div className="p-4 space-y-6 animate-fade-in">
        <UserDetailSheet
          u={selectedUser} open={sheetOpen} onClose={() => setSheetOpen(false)}
          onRoleChange={handleRoleChange} onDelete={handleDeleteUser}
          updatingRole={updatingRole} currentUserId={user?.id} formatDate={formatDate}
        />
        <RegistrationToggle />

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
            <Shield className="h-6 w-6 text-amber-500" />
          </div>
          <div className="flex-1">
            <h1 className="font-heading text-xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Manage users & roles</p>
          </div>
          <Button variant="outline" size="icon" onClick={fetchUsers} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-3 gap-3">
          <Link to="/admin/analytics">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 hover:bg-amber-500/10 transition-colors cursor-pointer">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">
                <BarChart3 className="h-4 w-4 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">Analytics</p>
                <p className="text-xs text-muted-foreground">Stats & trends</p>
              </div>
            </div>
          </Link>
          <Link to="/admin/reports">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors cursor-pointer">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <MessageSquare className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">Reports</p>
                <p className="text-xs text-muted-foreground">Feedback & bugs</p>
              </div>
            </div>
          </Link>
          <Link to="/domains">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 hover:bg-blue-500/10 transition-colors cursor-pointer">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
                <Globe className="h-4 w-4 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">Domains</p>
                <p className="text-xs text-muted-foreground">Live previews</p>
              </div>
            </div>
          </Link>
        </div>

        {loading && <Progress value={progress} className="h-1" />}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total", value: users.length, icon: Users },
            { label: "Admins", value: users.filter(u => u.roles.includes("admin") || u.roles.includes("owner")).length, icon: Crown },
            { label: "Staff", value: users.filter(u => u.roles.includes("moderator") || u.roles.includes("staff") || u.roles.includes("developer")).length, icon: UserCog },
          ].map((s, i) => (
            <Card key={i} className="p-3 text-center transition-all hover:shadow-md">
              <s.icon className="h-5 w-5 mx-auto mb-1 text-primary" />
              <p className="text-xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </Card>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users by name, email, or role..."
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="ps-10"
          />
        </div>

        {/* User List */}
        {loading ? (
          <div className="flex items-center justify-center h-40"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-3">
            {filtered.map(u => {
              const highestRole = getHighestRole(u.roles);
              const config = roleConfig[highestRole] || roleConfig.user;
              return (
                <Card key={u.id} className="p-4 transition-all duration-200 hover:shadow-md">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={u.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {(u.display_name || u.auth_email || "U")[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold truncate">{u.display_name || "Unnamed"}</p>
                        {u.roles.slice(0, 2).map(role => {
                          const rc = roleConfig[role] || roleConfig.user;
                          const Icon = rc.icon;
                          return (
                            <Badge key={role} variant="outline" className={`text-xs ${rc.bg}`}>
                              <Icon className={`h-3 w-3 me-1 ${rc.color}`} />
                              {role.replace("_", " ")}
                            </Badge>
                          );
                        })}
                        {u.roles.length > 2 && <Badge variant="secondary" className="text-xs">+{u.roles.length - 2}</Badge>}
                      </div>
                      {/* Clickable email */}
                      <button
                        onClick={() => openUserSheet(u)}
                        className="flex items-center gap-1 mt-1 group hover:text-primary transition-colors"
                      >
                        <AtSign className="h-3 w-3 text-primary" />
                        <p className="text-sm font-medium text-primary truncate group-hover:underline">
                          {u.auth_email || "No auth email"}
                        </p>
                        <Info className="h-3 w-3 opacity-0 group-hover:opacity-100 text-primary transition-opacity" />
                      </button>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">Joined {formatDate(u.created_at)}</p>
                      </div>
                    </div>

                    {/* Quick actions */}
                    {u.id !== user?.id && (
                      <div className="flex items-center gap-1">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" disabled={updatingRole === u.id}>
                              {updatingRole === u.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <>Roles <ChevronDown className="h-3 w-3 ms-1" /></>}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 max-h-64 overflow-y-auto">
                            {ALL_ROLES.map(role => {
                              const has = u.roles.includes(role);
                              const rc = roleConfig[role];
                              const Icon = rc.icon;
                              return (
                                <DropdownMenuItem key={role} onClick={() => handleRoleChange(u.id, role, has ? "remove" : "add")} className="flex items-center gap-2">
                                  <Icon className={`h-3.5 w-3.5 ${rc.color}`} />
                                  <span className="flex-1 capitalize">{role.replace("_", " ")}</span>
                                  {has && <Badge variant="secondary" className="text-[10px] px-1">Active</Badge>}
                                </DropdownMenuItem>
                              );
                            })}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button variant="ghost" size="icon" onClick={() => openUserSheet(u)} className="text-muted-foreground hover:text-primary">
                          <Info className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    {u.id === user?.id && (
                      <Badge variant="secondary" className="text-xs shrink-0">You</Badge>
                    )}
                  </div>
                </Card>
              );
            })}
            {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">No users found</p>}
          </div>
        )}
      </div>
    </Layout>
  );
}
