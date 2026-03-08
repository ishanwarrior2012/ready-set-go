import { useState, useEffect, useCallback } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Tabs, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  Bug, Lightbulb, Star, Search, RefreshCw, Filter, MessageSquare,
  Calendar, Globe, Loader2, CheckCircle, Clock, XCircle, Sparkles,
  AlertTriangle, Shield, ChevronRight, Trash2, Eye, ArrowLeft,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuthorization } from "@/hooks/useAuthorization";
import { Navigate, useNavigate } from "react-router-dom";
import { LoadingPage } from "@/components/ui/LoadingSpinner";
import { cn } from "@/lib/utils";

interface FeedbackReport {
  id: string;
  user_id: string;
  type: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string | null;
  page_url: string | null;
  user_agent: string | null;
  votes: number;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

const TYPE_CONFIG: Record<string, { icon: typeof Bug; color: string; bg: string; label: string }> = {
  bug: { icon: Bug, color: "text-destructive", bg: "bg-destructive/10 border-destructive/20", label: "Bug" },
  feature: { icon: Lightbulb, color: "text-primary", bg: "bg-primary/10 border-primary/20", label: "Feature" },
  survey: { icon: Star, color: "text-yellow-500", bg: "bg-yellow-500/10 border-yellow-500/20", label: "Survey" },
  other: { icon: MessageSquare, color: "text-muted-foreground", bg: "bg-muted border-border", label: "Other" },
};

const STATUS_CONFIG: Record<string, { label: string; icon: typeof Clock; color: string }> = {
  open: { label: "Open", icon: Clock, color: "text-yellow-600 bg-yellow-500/10 border-yellow-500/30" },
  in_review: { label: "In Review", icon: Eye, color: "text-blue-600 bg-blue-500/10 border-blue-500/30" },
  planned: { label: "Planned", icon: Sparkles, color: "text-purple-600 bg-purple-500/10 border-purple-500/30" },
  resolved: { label: "Resolved", icon: CheckCircle, color: "text-emerald-600 bg-emerald-500/10 border-emerald-500/30" },
  closed: { label: "Closed", icon: XCircle, color: "text-muted-foreground bg-muted border-border" },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  low: { label: "Low", color: "text-muted-foreground border-border" },
  medium: { label: "Medium", color: "text-yellow-600 border-yellow-500/40" },
  high: { label: "High", color: "text-orange-600 border-orange-500/40" },
  critical: { label: "Critical", color: "text-destructive border-destructive/40" },
};

export default function AdminReports() {
  const { isAdmin, loading: rolesLoading } = useAuthorization();
  const navigate = useNavigate();
  const [reports, setReports] = useState<FeedbackReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selected, setSelected] = useState<FeedbackReport | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("feedback_reports" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setReports((data as FeedbackReport[]) || []);
    } catch (err: any) {
      toast.error("Failed to load reports: " + (err.message || "Unknown error"));
    }
    setLoading(false);
  }, []);

  useEffect(() => { if (isAdmin) fetchReports(); }, [isAdmin, fetchReports]);

  const updateReport = async (id: string, updates: Partial<FeedbackReport>) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("feedback_reports" as any)
        .update(updates)
        .eq("id", id);
      if (error) throw error;
      setReports(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
      if (selected?.id === id) setSelected(prev => prev ? { ...prev, ...updates } : prev);
      toast.success("Report updated");
    } catch (err: any) {
      toast.error("Failed to update: " + (err.message || "Unknown error"));
    }
    setSaving(false);
  };

  const deleteReport = async (id: string) => {
    try {
      const { error } = await supabase.from("feedback_reports" as any).delete().eq("id", id);
      if (error) throw error;
      setReports(prev => prev.filter(r => r.id !== id));
      if (selected?.id === id) setSelected(null);
      toast.success("Report deleted");
    } catch (err: any) {
      toast.error("Failed to delete: " + (err.message || "Unknown error"));
    }
  };

  const openDetail = (r: FeedbackReport) => {
    setSelected(r);
    setAdminNotes(r.admin_notes || "");
  };

  if (rolesLoading) return <LoadingPage />;
  if (!isAdmin) return <Navigate to="/" replace />;

  const filtered = reports.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q || r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q) || (r.category || "").toLowerCase().includes(q);
    const matchType = typeFilter === "all" || r.type === typeFilter;
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    const matchPriority = priorityFilter === "all" || r.priority === priorityFilter;
    return matchSearch && matchType && matchStatus && matchPriority;
  });

  const stats = {
    total: reports.length,
    open: reports.filter(r => r.status === "open").length,
    bugs: reports.filter(r => r.type === "bug").length,
    features: reports.filter(r => r.type === "feature").length,
    critical: reports.filter(r => r.priority === "critical").length,
  };

  return (
    <Layout>
      <div className="p-4 space-y-5 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")} className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 shrink-0">
            <MessageSquare className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="font-heading text-xl font-bold">User Reports</h1>
            <p className="text-sm text-muted-foreground">Bugs, suggestions & surveys</p>
          </div>
          <Button variant="outline" size="icon" onClick={fetchReports} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-2">
          {[
            { label: "Total", value: stats.total, icon: MessageSquare, color: "text-foreground" },
            { label: "Open", value: stats.open, icon: Clock, color: "text-yellow-600" },
            { label: "Bugs", value: stats.bugs, icon: Bug, color: "text-destructive" },
            { label: "Ideas", value: stats.features, icon: Lightbulb, color: "text-primary" },
            { label: "Critical", value: stats.critical, icon: AlertTriangle, color: "text-red-600" },
          ].map(s => (
            <Card key={s.label} className="p-2 text-center">
              <s.icon className={cn("h-4 w-4 mx-auto mb-1", s.color)} />
              <p className="text-lg font-bold">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search reports..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Tabs value={typeFilter} onValueChange={setTypeFilter}>
              <TabsList className="h-8">
                <TabsTrigger value="all" className="text-xs px-2 h-6">All</TabsTrigger>
                <TabsTrigger value="bug" className="text-xs px-2 h-6">Bugs</TabsTrigger>
                <TabsTrigger value="feature" className="text-xs px-2 h-6">Features</TabsTrigger>
                <TabsTrigger value="survey" className="text-xs px-2 h-6">Surveys</TabsTrigger>
              </TabsList>
            </Tabs>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 w-32 text-xs"><Filter className="h-3 w-3 mr-1" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Object.entries(STATUS_CONFIG).map(([v, c]) => <SelectItem key={v} value={v}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="h-8 w-32 text-xs"><SelectValue placeholder="Priority" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                {Object.entries(PRIORITY_CONFIG).map(([v, c]) => <SelectItem key={v} value={v}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Report List */}
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>{reports.length === 0 ? "No reports yet" : "No reports match filters"}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(r => {
              const tc = TYPE_CONFIG[r.type] || TYPE_CONFIG.other;
              const sc = STATUS_CONFIG[r.status] || STATUS_CONFIG.open;
              const pc = PRIORITY_CONFIG[r.priority] || PRIORITY_CONFIG.medium;
              const TypeIcon = tc.icon;
              const StatusIcon = sc.icon;
              return (
                <Card
                  key={r.id}
                  className={cn("p-4 cursor-pointer transition-all hover:shadow-md hover:border-primary/30", r.priority === "critical" && "border-destructive/30")}
                  onClick={() => openDetail(r)}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg border shrink-0", tc.bg)}>
                      <TypeIcon className={cn("h-4 w-4", tc.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm truncate flex-1">{r.title}</p>
                        <Badge variant="outline" className={cn("text-[10px] border", sc.color)}>
                          <StatusIcon className="h-3 w-3 mr-1" />{sc.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.description}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {r.category && <Badge variant="secondary" className="text-[10px]">{r.category}</Badge>}
                        <Badge variant="outline" className={cn("text-[10px] border", pc.color)}>{pc.label}</Badge>
                        {r.page_url && (
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Globe className="h-3 w-3" />{r.page_url}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground ml-auto">
                          <Calendar className="h-3 w-3" />
                          {new Date(r.created_at).toLocaleDateString()}
                        </span>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Detail Dialog */}
        {selected && (
          <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {(() => { const tc = TYPE_CONFIG[selected.type] || TYPE_CONFIG.other; const Icon = tc.icon; return <Icon className={cn("h-4 w-4", tc.color)} />; })()}
                  Report Details
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <h3 className="font-bold">{selected.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{selected.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="space-y-1">
                    <Label className="text-xs">Status</Label>
                    <Select value={selected.status} onValueChange={v => updateReport(selected.id, { status: v })}>
                      <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUS_CONFIG).map(([v, c]) => <SelectItem key={v} value={v}>{c.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Priority</Label>
                    <Select value={selected.priority} onValueChange={v => updateReport(selected.id, { priority: v })}>
                      <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(PRIORITY_CONFIG).map(([v, c]) => <SelectItem key={v} value={v}>{c.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {selected.page_url && (
                  <div className="text-xs text-muted-foreground bg-muted rounded p-2">
                    <span className="font-medium">Page:</span> {selected.page_url}
                  </div>
                )}
                {selected.user_agent && (
                  <div className="text-xs text-muted-foreground bg-muted rounded p-2 truncate">
                    <span className="font-medium">Device:</span> {selected.user_agent.slice(0, 100)}...
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-xs">Admin Notes</Label>
                  <Textarea
                    placeholder="Add internal notes about this report..."
                    value={adminNotes}
                    onChange={e => setAdminNotes(e.target.value)}
                    className="min-h-[80px] text-sm"
                  />
                  <Button
                    size="sm" variant="outline" className="w-full"
                    onClick={() => updateReport(selected.id, { admin_notes: adminNotes })}
                    disabled={saving}
                  >
                    {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                    Save Notes
                  </Button>
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button
                  variant="destructive" size="sm"
                  onClick={() => deleteReport(selected.id)}
                >
                  <Trash2 className="h-3 w-3 mr-1" /> Delete
                </Button>
                <Button size="sm" onClick={() => setSelected(null)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </Layout>
  );
}
