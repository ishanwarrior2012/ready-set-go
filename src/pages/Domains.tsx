import { useState, useEffect, useRef, useCallback } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Globe, ExternalLink, RefreshCw, Plus, Trash2, Server, Shield,
  Loader2, Eye, EyeOff, MoreVertical, Settings, Link2,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuthorization } from "@/hooks/useAuthorization";

interface ManagedDomain {
  id: string;
  name: string;
  domain: string;
  description: string | null;
  status: string;
  sort_order: number;
  created_at: string;
}

function DomainPreviewFrame({ domain, refreshKey }: { domain: string; refreshKey: number }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const url = `https://${domain}`;

  useEffect(() => {
    setLoading(true);
    setError(false);
  }, [domain, refreshKey]);

  return (
    <div className="relative w-full h-48 bg-muted rounded-b-lg overflow-hidden">
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted z-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground">Loading preview…</span>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted z-10">
          <Globe className="h-8 w-8 text-muted-foreground/40" />
          <span className="text-xs text-muted-foreground text-center px-4">
            Preview unavailable — site may block embedding.
          </span>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary underline"
          >
            Open in new tab
          </a>
        </div>
      )}
      <iframe
        ref={iframeRef}
        src={url}
        title={`Preview of ${domain}`}
        className="w-full h-full border-0 scale-75 origin-top-left"
        style={{ width: "133%", height: "133%", transform: "scale(0.75)", transformOrigin: "top left" }}
        onLoad={() => setLoading(false)}
        onError={() => { setLoading(false); setError(true); }}
        sandbox="allow-scripts allow-same-origin allow-forms"
      />
    </div>
  );
}

export default function Domains() {
  const { isAdmin } = useAuthorization();
  const [domains, setDomains] = useState<ManagedDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKeys, setRefreshKeys] = useState<Record<string, number>>({});
  const [selectedDomain, setSelectedDomain] = useState<ManagedDomain | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDomain, setNewDomain] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [hiddenPreviews, setHiddenPreviews] = useState<Set<string>>(new Set());

  // Auto-refresh every 30 seconds
  const autoRefreshRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchDomains = useCallback(async () => {
    const { data, error } = await supabase
      .from("managed_domains" as any)
      .select("*")
      .order("sort_order", { ascending: true });
    if (!error && data) {
      setDomains(data as unknown as ManagedDomain[]);
    }
    setLoading(false);
  }, []);

  const refreshAllPreviews = useCallback(() => {
    setRefreshKeys(prev => {
      const next = { ...prev };
      domains.forEach(d => { next[d.id] = (next[d.id] || 0) + 1; });
      return next;
    });
    toast.success("Previews refreshed");
  }, [domains]);

  const refreshSingle = (id: string) => {
    setRefreshKeys(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  useEffect(() => {
    fetchDomains();
  }, [fetchDomains]);

  useEffect(() => {
    autoRefreshRef.current = setInterval(() => {
      setRefreshKeys(prev => {
        const next = { ...prev };
        domains.forEach(d => { next[d.id] = (next[d.id] || 0) + 1; });
        return next;
      });
    }, 30000);
    return () => { if (autoRefreshRef.current) clearInterval(autoRefreshRef.current); };
  }, [domains]);

  const handleAddDomain = async () => {
    if (!newName.trim() || !newDomain.trim()) {
      toast.error("Name and domain are required");
      return;
    }
    const cleanDomain = newDomain.trim().replace(/^https?:\/\//i, "").replace(/\/$/, "");
    setSaving(true);
    const { error } = await supabase
      .from("managed_domains" as any)
      .insert({ name: newName.trim(), domain: cleanDomain, description: newDesc.trim() || null, sort_order: domains.length + 1 });
    setSaving(false);
    if (error) { toast.error("Failed to add domain: " + error.message); return; }
    toast.success(`Domain ${cleanDomain} added`);
    setAddDialogOpen(false);
    setNewName(""); setNewDomain(""); setNewDesc("");
    fetchDomains();
  };

  const handleDeleteDomain = async (id: string, name: string) => {
    const { error } = await supabase.from("managed_domains" as any).delete().eq("id", id);
    if (error) { toast.error("Failed to delete domain"); return; }
    toast.success(`${name} removed`);
    fetchDomains();
  };

  const togglePreview = (id: string) => {
    setHiddenPreviews(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <Layout>
      <div className="p-4 space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Globe className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="font-heading text-xl font-bold">Domain Manager</h1>
              <p className="text-sm text-muted-foreground">Live previews · auto-refresh every 30s</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={refreshAllPreviews} className="gap-1.5">
              <RefreshCw className="h-4 w-4" />
              Refresh All
            </Button>
            {isAdmin && (
              <Button size="sm" onClick={() => setAddDialogOpen(true)} className="gap-1.5">
                <Plus className="h-4 w-4" />
                Add Domain
              </Button>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Domains", value: domains.length, color: "text-primary" },
            { label: "Active", value: domains.filter(d => d.status === "active").length, color: "text-emerald-500" },
            { label: "Auto-Refresh", value: "30s", color: "text-amber-500" },
          ].map((s, i) => (
            <Card key={i} className="p-3 text-center">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </Card>
          ))}
        </div>

        {/* Domain Cards */}
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {domains.map(d => (
              <Card key={d.id} className="overflow-hidden transition-all hover:shadow-lg">
                {/* Card Header */}
                <div className="flex items-center gap-3 p-3 border-b border-border">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                    <Globe className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm truncate">{d.name}</p>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${
                        d.status === "active" ? "border-emerald-500/40 text-emerald-600 bg-emerald-500/5" : "border-border text-muted-foreground"
                      }`}>
                        {d.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{d.domain}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => window.open(`https://${d.domain}`, "_blank")}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open Website
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => refreshSingle(d.id)}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => togglePreview(d.id)}>
                        {hiddenPreviews.has(d.id) ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
                        {hiddenPreviews.has(d.id) ? "Show Preview" : "Hide Preview"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => window.open("https://dash.cloudflare.com", "_blank")}
                      >
                        <Shield className="h-4 w-4 mr-2 text-orange-500" />
                        Manage in Cloudflare
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => window.open("https://dash.domain.digitalplat.org/", "_blank")}
                      >
                        <Server className="h-4 w-4 mr-2 text-blue-500" />
                        Operate Nameservers
                      </DropdownMenuItem>
                      {isAdmin && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onSelect={e => e.preventDefault()}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove Domain
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove Domain</AlertDialogTitle>
                              <AlertDialogDescription>
                                Remove <strong>{d.name}</strong> ({d.domain}) from the manager? This only removes it from this list.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteDomain(d.id, d.name)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >Remove</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 px-3 py-2 bg-muted/30 border-b border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-8 text-xs gap-1.5"
                    onClick={() => window.open(`https://${d.domain}`, "_blank")}
                  >
                    <ExternalLink className="h-3 w-3" />
                    Open Site
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-8 text-xs gap-1.5 text-orange-600 border-orange-500/30 hover:bg-orange-500/10"
                    onClick={() => window.open("https://dash.cloudflare.com", "_blank")}
                  >
                    <Shield className="h-3 w-3" />
                    Cloudflare
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-8 text-xs gap-1.5 text-blue-600 border-blue-500/30 hover:bg-blue-500/10"
                    onClick={() => window.open("https://dash.domain.digitalplat.org/", "_blank")}
                  >
                    <Server className="h-3 w-3" />
                    Nameservers
                  </Button>
                </div>

                {/* Live Preview */}
                {!hiddenPreviews.has(d.id) && (
                  <DomainPreviewFrame domain={d.domain} refreshKey={refreshKeys[d.id] || 0} />
                )}
                {hiddenPreviews.has(d.id) && (
                  <div className="h-12 flex items-center justify-center bg-muted/30">
                    <button onClick={() => togglePreview(d.id)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5">
                      <Eye className="h-3 w-3" /> Show preview
                    </button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Add Domain Dialog */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5 text-primary" /> Add Domain
              </DialogTitle>
              <DialogDescription>Add a new domain to the manager. The live preview will load automatically.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Display Name</Label>
                <Input placeholder="My Project" value={newName} onChange={e => setNewName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Domain</Label>
                <Input placeholder="example.qzz.io" value={newDomain} onChange={e => setNewDomain(e.target.value)} />
                <p className="text-xs text-muted-foreground">Without https:// — e.g. example.com</p>
              </div>
              <div className="space-y-2">
                <Label>Description <span className="text-muted-foreground">(optional)</span></Label>
                <Input placeholder="Short description" value={newDesc} onChange={e => setNewDesc(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddDomain} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Add Domain
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
