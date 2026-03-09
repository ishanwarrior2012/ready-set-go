import { useState, useEffect, useCallback } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Users, TrendingUp, Activity, Shield, Bug, Lightbulb, Star,
  RefreshCw, ArrowLeft, BarChart3, UserCheck, UserX, Globe,
  MessageSquare, AlertTriangle, CheckCircle, Clock, Zap,
  Calendar, Crown, Code, Camera, Briefcase, UserCog, User,
  Database, Server, Lock, Eye, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuthorization } from "@/hooks/useAuthorization";
import { Navigate, useNavigate, Link } from "react-router-dom";
import { LoadingPage } from "@/components/ui/LoadingSpinner";
import { cn } from "@/lib/utils";

interface AnalyticsData {
  totalUsers: number;
  newToday: number;
  newThisWeek: number;
  newThisMonth: number;
  activeToday: number;
  activeWeek: number;
  activeMonth: number;
  confirmedUsers: number;
  signupTrend: { date: string; signups: number }[];
  roleDistribution: { role: string; count: number; color: string }[];
  feedbackStats: {
    total: number;
    open: number;
    bugs: number;
    features: number;
    critical: number;
    resolved: number;
  };
  recentSignups: { email: string; created_at: string; confirmed: boolean }[];
  notifications: { total: number; unread: number };
}

const ROLE_COLORS: Record<string, string> = {
  owner: "hsl(45 93% 47%)",
  admin: "hsl(38 92% 50%)",
  moderator: "hsl(217 91% 60%)",
  developer: "hsl(142 71% 45%)",
  media: "hsl(330 81% 60%)",
  staff: "hsl(245 58% 51%)",
  pro_member: "hsl(25 95% 53%)",
  member: "hsl(172 66% 50%)",
  user: "hsl(215 20% 65%)",
};

const roleIcons: Record<string, typeof Crown> = {
  owner: Crown,
  admin: Shield,
  moderator: UserCog,
  developer: Code,
  media: Camera,
  staff: Briefcase,
  pro_member: Star,
  member: UserCheck,
  user: User,
};

function StatCard({
  label, value, sub, icon: Icon, color, trend, trendUp,
}: {
  label: string;
  value: number | string;
  sub?: string;
  icon: typeof Users;
  color: string;
  trend?: string;
  trendUp?: boolean;
}) {
  return (
    <Card className="p-4 transition-all hover:shadow-md hover:border-primary/20">
      <div className="flex items-start justify-between gap-2">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl shrink-0", color)}>
          <Icon className="h-5 w-5" />
        </div>
        {trend && (
          <div className={cn("flex items-center gap-1 text-xs font-medium", trendUp ? "text-emerald-500" : "text-destructive")}>
            {trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {trend}
          </div>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm font-medium text-foreground mt-0.5">{label}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </Card>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-sm">
        <p className="font-semibold text-foreground mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }} className="text-xs">
            {p.name}: <span className="font-bold">{p.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AdminAnalytics() {
  const { isAdmin, roles, loading: rolesLoading } = useAuthorization();
  const navigate = useNavigate();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all data in parallel
      const [usersRes, signupTrendRes, rolesRes, feedbackRes, notifRes, recentRes] = await Promise.all([
        // Overall user stats via admin-users edge function
        supabase.functions.invoke("admin-users", { body: { action: "list_users" } }),
        // Feedback stats
        (supabase as any).from("feedback_reports").select("status, type, priority, created_at"),
        // Role distribution
        (supabase as any).from("user_roles").select("role"),
        // Notifications stats
        (supabase as any).from("notifications").select("read, created_at"),
        // Recent signups (last 5)
        supabase.functions.invoke("admin-users", { body: { action: "list_users" } }),
        // placeholder — reuse usersRes
        Promise.resolve(null),
      ]);

      const allUsers: any[] = usersRes.data?.users || [];
      const now = new Date();
      const dayMs = 86400000;

      // Build signup trend for last 14 days
      const trendMap: Record<string, number> = {};
      for (let i = 13; i >= 0; i--) {
        const d = new Date(now.getTime() - i * dayMs);
        trendMap[d.toISOString().slice(0, 10)] = 0;
      }
      allUsers.forEach((u) => {
        const day = (u.created_at || "").slice(0, 10);
        if (trendMap[day] !== undefined) trendMap[day]++;
      });
      const signupTrend = Object.entries(trendMap).map(([date, signups]) => ({
        date: new Date(date).toLocaleDateString("en", { month: "short", day: "numeric" }),
        signups,
      }));

      // Active users (last sign-in)
      const activeToday = allUsers.filter(
        (u) => u.last_sign_in_at && now.getTime() - new Date(u.last_sign_in_at).getTime() < dayMs,
      ).length;
      const activeWeek = allUsers.filter(
        (u) => u.last_sign_in_at && now.getTime() - new Date(u.last_sign_in_at).getTime() < 7 * dayMs,
      ).length;
      const activeMonth = allUsers.filter(
        (u) => u.last_sign_in_at && now.getTime() - new Date(u.last_sign_in_at).getTime() < 30 * dayMs,
      ).length;

      // New users
      const newToday = allUsers.filter(
        (u) => now.getTime() - new Date(u.created_at).getTime() < dayMs,
      ).length;
      const newThisWeek = allUsers.filter(
        (u) => now.getTime() - new Date(u.created_at).getTime() < 7 * dayMs,
      ).length;
      const newThisMonth = allUsers.filter(
        (u) => now.getTime() - new Date(u.created_at).getTime() < 30 * dayMs,
      ).length;

      // Role distribution from user_roles table
      const roleCounts: Record<string, number> = {};
      if (!rolesRes.error && rolesRes.data) {
        (rolesRes.data as any[]).forEach((r) => {
          roleCounts[r.role] = (roleCounts[r.role] || 0) + 1;
        });
      }
      const roleDistribution = Object.entries(roleCounts)
        .map(([role, count]) => ({ role, count, color: ROLE_COLORS[role] || "hsl(215 20% 65%)" }))
        .sort((a, b) => b.count - a.count);

      // Feedback stats
      const feedbackData: any[] = feedbackRes.data || [];
      const feedbackStats = {
        total: feedbackData.length,
        open: feedbackData.filter((r) => r.status === "open").length,
        bugs: feedbackData.filter((r) => r.type === "bug").length,
        features: feedbackData.filter((r) => r.type === "feature").length,
        critical: feedbackData.filter((r) => r.priority === "critical").length,
        resolved: feedbackData.filter((r) => r.status === "resolved").length,
      };

      // Notification stats
      const notifData: any[] = notifRes.data || [];
      const notifications = {
        total: notifData.length,
        unread: notifData.filter((n) => !n.read).length,
      };

      // Recent signups sorted newest first
      const recentSignups = [...allUsers]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 8)
        .map((u) => ({
          email: u.auth_email || u.email || "Unknown",
          created_at: u.created_at,
          confirmed: !!u.confirmed_at,
        }));

      setData({
        totalUsers: allUsers.length,
        newToday,
        newThisWeek,
        newThisMonth,
        activeToday,
        activeWeek,
        activeMonth,
        confirmedUsers: allUsers.filter((u) => u.confirmed_at).length,
        signupTrend,
        roleDistribution,
        feedbackStats,
        recentSignups,
        notifications,
      });
      setLastRefresh(new Date());
    } catch (err: any) {
      toast.error("Failed to load analytics: " + (err.message || "Unknown error"));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isAdmin) fetchAnalytics();
  }, [isAdmin, fetchAnalytics]);

  if (rolesLoading) return <LoadingPage />;
  if (!isAdmin) return <Navigate to="/" replace />;

  const engagementRate = data
    ? Math.round((data.activeMonth / Math.max(data.totalUsers, 1)) * 100)
    : 0;
  const verificationRate = data
    ? Math.round((data.confirmedUsers / Math.max(data.totalUsers, 1)) * 100)
    : 0;

  return (
    <Layout>
      <div className="p-4 space-y-6 animate-fade-in max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")} className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 shrink-0">
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="font-heading text-xl font-bold">Analytics Dashboard</h1>
            <p className="text-xs text-muted-foreground">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </p>
          </div>
          <Button variant="outline" size="icon" onClick={fetchAnalytics} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : data ? (
          <Tabs defaultValue="overview">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
              <TabsTrigger value="users" className="text-xs">Users</TabsTrigger>
              <TabsTrigger value="engagement" className="text-xs">Engagement</TabsTrigger>
              <TabsTrigger value="reports" className="text-xs">Reports</TabsTrigger>
            </TabsList>

            {/* ===== OVERVIEW TAB ===== */}
            <TabsContent value="overview" className="space-y-5 mt-4">
              {/* Key metrics */}
              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  label="Total Users"
                  value={data.totalUsers}
                  sub="All registered accounts"
                  icon={Users}
                  color="bg-primary/10 text-primary"
                  trend={data.newThisWeek > 0 ? `+${data.newThisWeek} this week` : undefined}
                  trendUp={data.newThisWeek > 0}
                />
                <StatCard
                  label="Active Today"
                  value={data.activeToday}
                  sub="Logged in last 24h"
                  icon={Activity}
                  color="bg-emerald-500/10 text-emerald-500"
                />
                <StatCard
                  label="New This Month"
                  value={data.newThisMonth}
                  sub="Joined last 30 days"
                  icon={TrendingUp}
                  color="bg-blue-500/10 text-blue-500"
                  trend={data.newToday > 0 ? `+${data.newToday} today` : "None today"}
                  trendUp={data.newToday > 0}
                />
                <StatCard
                  label="Verified Users"
                  value={`${verificationRate}%`}
                  sub={`${data.confirmedUsers} confirmed emails`}
                  icon={UserCheck}
                  color="bg-teal-500/10 text-teal-500"
                />
              </div>

              {/* Signup Trend Chart */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Signups — Last 14 Days
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <ResponsiveContainer width="100%" height={160}>
                    <AreaChart data={data.signupTrend}>
                      <defs>
                        <linearGradient id="signupGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} interval={2} />
                      <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="signups"
                        name="Signups"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        fill="url(#signupGrad)"
                        dot={{ fill: "hsl(var(--primary))", r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Quick Links */}
              <div className="grid grid-cols-2 gap-3">
                <Link to="/admin">
                  <div className="flex items-center gap-2 p-3 rounded-xl border bg-card hover:bg-muted/50 transition-colors">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                      <Shield className="h-4 w-4 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">User Mgmt</p>
                      <p className="text-xs text-muted-foreground">{data.totalUsers} users</p>
                    </div>
                  </div>
                </Link>
                <Link to="/admin/reports">
                  <div className="flex items-center gap-2 p-3 rounded-xl border bg-card hover:bg-muted/50 transition-colors">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                      <MessageSquare className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Reports</p>
                      <p className="text-xs text-muted-foreground">{data.feedbackStats.open} open</p>
                    </div>
                  </div>
                </Link>
              </div>

              {/* System Health */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Server className="h-4 w-4 text-primary" /> System Health
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  {[
                    { label: "User Engagement (30d)", value: engagementRate, color: "bg-primary" },
                    { label: "Email Verification Rate", value: verificationRate, color: "bg-emerald-500" },
                    { label: "Reports Resolved", value: data.feedbackStats.total > 0 ? Math.round((data.feedbackStats.resolved / data.feedbackStats.total) * 100) : 100, color: "bg-teal-500" },
                  ].map((item) => (
                    <div key={item.label} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className="font-semibold">{item.value}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all", item.color)}
                          style={{ width: `${item.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ===== USERS TAB ===== */}
            <TabsContent value="users" className="space-y-5 mt-4">
              {/* User breakdown */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Today", value: data.newToday, icon: Calendar, color: "text-primary" },
                  { label: "This Week", value: data.newThisWeek, icon: TrendingUp, color: "text-blue-500" },
                  { label: "This Month", value: data.newThisMonth, icon: Users, color: "text-emerald-500" },
                ].map((s) => (
                  <Card key={s.label} className="p-3 text-center">
                    <s.icon className={cn("h-4 w-4 mx-auto mb-1", s.color)} />
                    <p className="text-xl font-bold">{s.value}</p>
                    <p className="text-[10px] text-muted-foreground">New {s.label}</p>
                  </Card>
                ))}
              </div>

              {/* Role Distribution Chart */}
              {data.roleDistribution.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" /> Role Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={data.roleDistribution} layout="vertical" margin={{ left: 8, right: 16 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} allowDecimals={false} />
                        <YAxis
                          dataKey="role"
                          type="category"
                          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                          tickLine={false}
                          axisLine={false}
                          width={70}
                          tickFormatter={(v) => v.replace("_", " ")}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="count" name="Users" radius={[0, 4, 4, 0]}>
                          {data.roleDistribution.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Role Summary Badges */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Role Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-2">
                    {data.roleDistribution.map(({ role, count }) => {
                      const Icon = roleIcons[role] || User;
                      return (
                        <div
                          key={role}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border bg-card text-xs font-medium"
                          style={{ borderColor: ROLE_COLORS[role] + "50" }}
                        >
                          <Icon className="h-3 w-3" style={{ color: ROLE_COLORS[role] }} />
                          <span className="capitalize">{role.replace("_", " ")}</span>
                          <span
                            className="font-bold ml-1 px-1.5 py-0.5 rounded-full text-[10px]"
                            style={{ backgroundColor: ROLE_COLORS[role] + "25", color: ROLE_COLORS[role] }}
                          >
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Signups */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-primary" /> Recent Signups
                    </span>
                    <Link to="/admin">
                      <Button variant="ghost" size="sm" className="h-6 text-xs text-primary">
                        Manage →
                      </Button>
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  {data.recentSignups.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No users yet</p>
                  ) : (
                    data.recentSignups.map((u, i) => (
                      <div key={i} className="flex items-center gap-3 py-1.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                          {u.email[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{u.email}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(u.created_at).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}
                          </p>
                        </div>
                        <Badge variant="outline" className={cn("text-[10px] shrink-0", u.confirmed ? "border-emerald-500/30 text-emerald-600" : "border-yellow-500/30 text-yellow-600")}>
                          {u.confirmed ? "✓ Verified" : "Pending"}
                        </Badge>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Unverified alert */}
              {data.totalUsers - data.confirmedUsers > 0 && (
                <div className="flex items-start gap-3 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-400">
                      {data.totalUsers - data.confirmedUsers} Unverified Account{data.totalUsers - data.confirmedUsers > 1 ? "s" : ""}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      These users haven't confirmed their email address yet.
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* ===== ENGAGEMENT TAB ===== */}
            <TabsContent value="engagement" className="space-y-5 mt-4">
              {/* DAU / WAU / MAU */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "DAU", full: "Daily Active", value: data.activeToday, color: "text-primary" },
                  { label: "WAU", full: "Weekly Active", value: data.activeWeek, color: "text-blue-500" },
                  { label: "MAU", full: "Monthly Active", value: data.activeMonth, color: "text-emerald-500" },
                ].map((s) => (
                  <Card key={s.label} className="p-3 text-center">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{s.label}</p>
                    <p className={cn("text-2xl font-bold mt-1", s.color)}>{s.value}</p>
                    <p className="text-[10px] text-muted-foreground">{s.full}</p>
                  </Card>
                ))}
              </div>

              {/* DAU/MAU Ratio */}
              <Card>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold">Stickiness (DAU/MAU)</p>
                      <p className="text-xs text-muted-foreground">How often monthly users return daily</p>
                    </div>
                    <p className="text-2xl font-bold text-primary">
                      {data.activeMonth > 0 ? Math.round((data.activeToday / data.activeMonth) * 100) : 0}%
                    </p>
                  </div>
                  <Progress
                    value={data.activeMonth > 0 ? (data.activeToday / data.activeMonth) * 100 : 0}
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Industry avg: ~20% for healthy apps</p>
                </CardContent>
              </Card>

              {/* Engagement bar chart */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" /> Active Users Comparison
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <ResponsiveContainer width="100%" height={140}>
                    <BarChart
                      data={[
                        { period: "Today", active: data.activeToday, total: data.totalUsers },
                        { period: "7 Days", active: data.activeWeek, total: data.totalUsers },
                        { period: "30 Days", active: data.activeMonth, total: data.totalUsers },
                      ]}
                      margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="period" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="total" name="Total Users" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="active" name="Active Users" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Notification stats */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" /> Notification Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 rounded-xl bg-muted/50">
                      <p className="text-2xl font-bold">{data.notifications.total}</p>
                      <p className="text-xs text-muted-foreground">Total Sent</p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-muted/50">
                      <p className="text-2xl font-bold text-yellow-600">{data.notifications.unread}</p>
                      <p className="text-xs text-muted-foreground">Unread</p>
                    </div>
                  </div>
                  {data.notifications.total > 0 && (
                    <div className="mt-3 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Read Rate</span>
                        <span className="font-semibold">
                          {Math.round(((data.notifications.total - data.notifications.unread) / data.notifications.total) * 100)}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${((data.notifications.total - data.notifications.unread) / data.notifications.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ===== REPORTS TAB ===== */}
            <TabsContent value="reports" className="space-y-5 mt-4">
              {/* Feedback stats */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Total", value: data.feedbackStats.total, icon: MessageSquare, color: "text-foreground" },
                  { label: "Open", value: data.feedbackStats.open, icon: Clock, color: "text-yellow-600" },
                  { label: "Resolved", value: data.feedbackStats.resolved, icon: CheckCircle, color: "text-emerald-500" },
                  { label: "Bugs", value: data.feedbackStats.bugs, icon: Bug, color: "text-destructive" },
                  { label: "Features", value: data.feedbackStats.features, icon: Lightbulb, color: "text-primary" },
                  { label: "Critical", value: data.feedbackStats.critical, icon: AlertTriangle, color: "text-red-600" },
                ].map((s) => (
                  <Card key={s.label} className="p-2 text-center">
                    <s.icon className={cn("h-4 w-4 mx-auto mb-1", s.color)} />
                    <p className="text-lg font-bold">{s.value}</p>
                    <p className="text-[10px] text-muted-foreground">{s.label}</p>
                  </Card>
                ))}
              </div>

              {/* Report Type Pie */}
              {data.feedbackStats.total > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Report Types</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: "Bugs", value: data.feedbackStats.bugs, color: "hsl(var(--destructive))" },
                            { name: "Features", value: data.feedbackStats.features, color: "hsl(var(--primary))" },
                            { name: "Other", value: Math.max(0, data.feedbackStats.total - data.feedbackStats.bugs - data.feedbackStats.features), color: "hsl(var(--muted-foreground))" },
                          ].filter((d) => d.value > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {[
                            { color: "hsl(var(--destructive))" },
                            { color: "hsl(var(--primary))" },
                            { color: "hsl(var(--muted-foreground))" },
                          ].map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Pie>
                        <Legend
                          iconSize={8}
                          formatter={(value) => <span className="text-xs text-foreground">{value}</span>}
                        />
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Resolution progress */}
              {data.feedbackStats.total > 0 && (
                <Card>
                  <CardContent className="pt-4 pb-4 space-y-3">
                    <p className="text-sm font-semibold">Resolution Progress</p>
                    {[
                      {
                        label: "Reports Resolved",
                        value: Math.round((data.feedbackStats.resolved / data.feedbackStats.total) * 100),
                        color: "bg-emerald-500",
                        count: `${data.feedbackStats.resolved}/${data.feedbackStats.total}`,
                      },
                      {
                        label: "Critical Addressed",
                        value: data.feedbackStats.critical > 0 ? Math.round(((data.feedbackStats.critical - Math.max(0, data.feedbackStats.critical - data.feedbackStats.resolved)) / data.feedbackStats.critical) * 100) : 100,
                        color: "bg-destructive",
                        count: `${data.feedbackStats.critical} critical`,
                      },
                    ].map((item) => (
                      <div key={item.label} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">{item.label}</span>
                          <span className="font-semibold">{item.count}</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div className={cn("h-full rounded-full", item.color)} style={{ width: `${item.value}%` }} />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {data.feedbackStats.total === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p className="font-medium">No reports yet</p>
                  <p className="text-sm mt-1">User feedback will appear here when submitted</p>
                </div>
              )}

              <Link to="/admin/reports">
                <Button className="w-full" variant="outline">
                  <Eye className="h-4 w-4 mr-2" /> View All Reports
                </Button>
              </Link>
            </TabsContent>
          </Tabs>
        ) : null}

        {/* Security note */}
        {!loading && (
          <div className="flex items-start gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
            <Lock className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-primary">Private Admin View</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                This dashboard is only visible to users with admin or owner roles. All data is protected by role-based access control.
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
