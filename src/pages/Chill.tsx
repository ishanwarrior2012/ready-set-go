import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Film, Tv, Maximize2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

type ChillTab = "movies" | "anime";

export default function Chill() {
  const [activeTab, setActiveTab] = useState<ChillTab>("movies");

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
                  "flex-1 gap-2 transition-all",
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
            allowFullScreen
          />
        </div>
      </div>
    </Layout>
  );
}
