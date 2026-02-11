import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Shield, Users, Search, Crown, UserCog, User, Loader2, RefreshCw,
  ChevronDown, Mail, Calendar, AtSign,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { useAuthorization } from "@/hooks/useAuthorization";
import { LoadingPage } from "@/components/ui/LoadingSpinner";
import { useTranslation } from "react-i18next";
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

const roleConfig = {
  admin: { icon: Crown, color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/30" },
  moderator: { icon: UserCog, color: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/30" },
  user: { icon: User, color: "text-muted-foreground", bg: "bg-muted border-border" },
};

export default function Admin() {
  const { user } = useAuth();
  const { isAdmin, loading: rolesLoading } = useAuthorization();
  const { t } = useTranslation();
  const { formatDate } = useIntlFormat();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);

  useEffect(() => {
    if (isAdmin) fetchUsers();
  }, [isAdmin]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await supabase.functions.invoke("admin-users", {
        body: { action: "list_users" },
      });
      if (res.error) throw res.error;
      setUsers(res.data.users || []);
    } catch (err: any) {
      toast.error("Failed to load users: " + (err.message || "Unknown error"));
    }
    setLoading(false);
  };

  const handleRoleChange = async (userId: string, role: string, operation: "add" | "remove") => {
    setUpdatingRole(userId);
    try {
      const res = await supabase.functions.invoke("admin-users", {
        body: { action: "update_role", user_id: userId, role, operation },
      });
      if (res.error) throw res.error;
      toast.success(t(operation === "add" ? "admin.roleAdded" : "admin.roleRemoved"));
      await fetchUsers();
    } catch (err: any) {
      toast.error("Failed to update role: " + (err.message || "Unknown error"));
    }
    setUpdatingRole(null);
  };

  if (rolesLoading) return <LoadingPage />;
  if (!isAdmin) return <Navigate to="/" replace />;

  const filtered = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      (u.display_name || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      (u.auth_email || "").toLowerCase().includes(q)
    );
  });

  return (
    <Layout>
      <div className="p-4 space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
            <Shield className="h-6 w-6 text-amber-500" />
          </div>
          <div className="flex-1">
            <h1 className="font-heading text-xl font-bold">{t("admin.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("admin.manageUsers")}</p>
          </div>
          <Button variant="outline" size="icon" onClick={fetchUsers} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: t("admin.totalUsers"), value: users.length, icon: Users },
            { label: t("admin.admins"), value: users.filter(u => u.roles.includes("admin")).length, icon: Crown },
            { label: t("admin.moderators"), value: users.filter(u => u.roles.includes("moderator")).length, icon: UserCog },
          ].map((s, i) => (
            <Card key={i} className="p-3 text-center">
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
            placeholder={t("admin.searchUsers")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-10"
          />
        </div>

        {/* User List */}
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((u) => {
              const highestRole = u.roles.includes("admin")
                ? "admin"
                : u.roles.includes("moderator")
                ? "moderator"
                : "user";
              const config = roleConfig[highestRole as keyof typeof roleConfig];

              return (
                <Card key={u.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={u.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {(u.display_name || u.auth_email || "U")[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold truncate">{u.display_name || t("admin.unnamed")}</p>
                        {u.roles.map((role) => {
                          const rc = roleConfig[role as keyof typeof roleConfig] || roleConfig.user;
                          return (
                            <Badge key={role} variant="outline" className={`text-xs ${rc.bg}`}>
                              <rc.icon className={`h-3 w-3 me-1 ${rc.color}`} />
                              {role}
                            </Badge>
                          );
                        })}
                      </div>
                      {/* Auth signup email */}
                      <div className="flex items-center gap-1 mt-1">
                        <AtSign className="h-3 w-3 text-primary" />
                        <p className="text-sm font-medium text-primary truncate">
                          {u.auth_email || "No auth email"}
                        </p>
                      </div>
                      {/* Profile email */}
                      {u.email && u.email !== u.auth_email && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground truncate">{u.email}</p>
                        </div>
                      )}
                      <div className="flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">
                          {t("admin.joined")} {formatDate(u.created_at)}
                        </p>
                      </div>
                    </div>

                    {/* Role Actions */}
                    {u.id !== user?.id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" disabled={updatingRole === u.id}>
                            {updatingRole === u.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <>
                                {t("admin.roles")} <ChevronDown className="h-3 w-3 ms-1" />
                              </>
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {(["admin", "moderator", "user"] as const).map((role) => {
                            const has = u.roles.includes(role);
                            return (
                              <DropdownMenuItem
                                key={role}
                                onClick={() => handleRoleChange(u.id, role, has ? "remove" : "add")}
                              >
                                {has ? t("admin.removeRole", { role }) : t("admin.addRole", { role })}
                              </DropdownMenuItem>
                            );
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </Card>
              );
            })}
            {filtered.length === 0 && (
              <p className="text-center text-muted-foreground py-8">{t("admin.noUsers")}</p>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
