import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon, Mic, Sparkles, Send } from "lucide-react";

const suggestedQueries = [
  "Show me recent earthquakes above 5.0 magnitude",
  "Track flight AA123",
  "What's the weather forecast for Tokyo?",
  "Find radio stations in Brazil",
];

export default function SearchPage() {
  const [query, setQuery] = useState("");

  return (
    <Layout>
      <div className="p-4 space-y-6">
        {/* Header */}
        <section className="text-center py-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-heading text-2xl font-bold mb-2">
            AI Assistant
          </h1>
          <p className="text-muted-foreground">
            Ask anything about tracking, weather, or radio
          </p>
        </section>

        {/* Search Input */}
        <Card className="p-2">
          <div className="flex items-center gap-2">
            <SearchIcon className="h-5 w-5 text-muted-foreground ml-2" />
            <Input
              type="text"
              placeholder="Ask me anything..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 border-0 bg-transparent focus-visible:ring-0"
            />
            <Button size="icon" variant="ghost">
              <Mic className="h-5 w-5" />
            </Button>
            <Button size="icon" disabled={!query}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </Card>

        {/* Suggested Queries */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">
            Try asking
          </h2>
          <div className="space-y-2">
            {suggestedQueries.map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                className="w-full justify-start text-left h-auto py-3 px-4"
                onClick={() => setQuery(suggestion)}
              >
                <Sparkles className="h-4 w-4 mr-3 text-primary shrink-0" />
                <span className="text-sm">{suggestion}</span>
              </Button>
            ))}
          </div>
        </section>
      </div>
    </Layout>
  );
}
