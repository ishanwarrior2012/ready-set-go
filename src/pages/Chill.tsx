import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Film, Tv, ExternalLink, Shield, X, Smartphone, Monitor, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type ChillTab = "movies" | "anime";

const DNS_DISMISSED_KEY = "safetrack_dns_dismissed";

function DNSPopup({ onDismiss }: { onDismiss: () => void }) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-card border rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-primary/10 p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-heading font-bold text-base">Private DNS Recommended</h3>
            <p className="text-xs text-muted-foreground">For a safer browsing experience</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onDismiss} className="shrink-0">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            We recommend using <strong>AdGuard Family DNS</strong> to block ads and inappropriate content while streaming.
          </p>

          {/* Android */}
          <div className="rounded-xl border p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm">Android</span>
            </div>
            <ol className="text-xs text-muted-foreground space-y-1 pl-5 list-decimal">
              <li>Go to <strong>Settings → Network → Private DNS</strong></li>
              <li>Select <strong>"Private DNS provider hostname"</strong></li>
              <li>Enter the hostname below and tap <strong>Save</strong></li>
            </ol>
            <button
              onClick={() => copyToClipboard("family.adguard-dns.com", "android")}
              className="flex items-center gap-2 w-full bg-muted/50 hover:bg-muted rounded-lg px-3 py-2 transition-colors"
            >
              <code className="text-xs font-mono text-primary flex-1 text-left">family.adguard-dns.com</code>
              {copiedField === "android" ? (
                <Check className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </button>
          </div>

          {/* Windows */}
          <div className="rounded-xl border p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Monitor className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm">Windows</span>
            </div>
            <ol className="text-xs text-muted-foreground space-y-1 pl-5 list-decimal">
              <li>Open <strong>Settings → Network & Internet → Wi-Fi/Ethernet</strong></li>
              <li>Click on your connection → <strong>Edit DNS</strong></li>
              <li>Set DNS to <strong>Manual</strong> and enter:</li>
            </ol>
            <div className="space-y-1.5">
              <button
                onClick={() => copyToClipboard("94.140.14.15", "primary")}
                className="flex items-center gap-2 w-full bg-muted/50 hover:bg-muted rounded-lg px-3 py-2 transition-colors"
              >
                <span className="text-xs text-muted-foreground">Primary:</span>
                <code className="text-xs font-mono text-primary flex-1 text-left">94.140.14.15</code>
                {copiedField === "primary" ? (
                  <Check className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </button>
              <button
                onClick={() => copyToClipboard("94.140.15.16", "secondary")}
                className="flex items-center gap-2 w-full bg-muted/50 hover:bg-muted rounded-lg px-3 py-2 transition-colors"
              >
                <span className="text-xs text-muted-foreground">Secondary:</span>
                <code className="text-xs font-mono text-primary flex-1 text-left">94.140.15.16</code>
                {copiedField === "secondary" ? (
                  <Check className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 pt-0 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onDismiss}>
            Dismiss
          </Button>
          <Button
            className="flex-1"
            onClick={() => {
              localStorage.setItem(DNS_DISMISSED_KEY, "permanent");
              onDismiss();
            }}
          >
            Don't show again
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Chill() {
  const [activeTab, setActiveTab] = useState<ChillTab>("movies");
  const [showDNSPopup, setShowDNSPopup] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const dismissed = localStorage.getItem(DNS_DISMISSED_KEY);
    if (dismissed !== "permanent") {
      setShowDNSPopup(true);
    }
  }, []);

  const tabs = [
    { id: "movies" as const, label: "Movies", icon: Film, url: "https://yomovies.sarl" },
    { id: "anime" as const, label: "Anime", icon: Tv, url: "https://hianime.to" },
  ];

  const activeSource = tabs.find((t) => t.id === activeTab)!;

  const openExternal = () => {
    window.open(activeSource.url, "_blank", "noopener,noreferrer");
  };

  return (
    <Layout>
      {showDNSPopup && <DNSPopup onDismiss={() => setShowDNSPopup(false)} />}

      <div className="flex flex-col h-[calc(100vh-8rem)] animate-fade-in">
        {/* Tab Header */}
        <div className="flex items-center gap-2 p-3 border-b bg-card">
          <div className="flex gap-1.5 flex-1">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 gap-2 transition-all tv-focus",
                  activeTab === tab.id && "shadow-md"
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </Button>
            ))}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowDNSPopup(true)}
            title="DNS settings"
            className="shrink-0"
          >
            <Shield className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={openExternal}
            title="Open in new tab"
            className="shrink-0"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>

        {/* Iframe Content */}
        <div className="flex-1 relative bg-muted">
          <iframe
            key={activeTab}
            src={activeSource.url}
            className="w-full h-full border-0"
            title={activeSource.label}
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-presentation"
            referrerPolicy="no-referrer"
            allowFullScreen
          />
        </div>
      </div>
    </Layout>
  );
}
