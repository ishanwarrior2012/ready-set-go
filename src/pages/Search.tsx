import { useState, useRef, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search as SearchIcon, 
  Mic, 
  Sparkles, 
  Send, 
  Bot, 
  User,
  Plane,
  Ship,
  Mountain,
  Cloud,
  Radio,
  History,
  X,
  Loader2
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const suggestedQueries = [
  { icon: Mountain, text: "Show me recent earthquakes above 5.0 magnitude", category: "Earthquakes" },
  { icon: Plane, text: "Track flight AA123 from LAX to JFK", category: "Flights" },
  { icon: Cloud, text: "What's the weather forecast for Tokyo?", category: "Weather" },
  { icon: Radio, text: "Find jazz radio stations in New York", category: "Radio" },
  { icon: Ship, text: "Show me cargo ships near Singapore", category: "Marine" },
];

const quickActions = [
  { icon: Plane, label: "Track Flight", color: "text-blue-500" },
  { icon: Ship, label: "Find Vessel", color: "text-cyan-500" },
  { icon: Mountain, label: "Earthquakes", color: "text-orange-500" },
  { icon: Cloud, label: "Weather", color: "text-sky-500" },
];

const searchHistory = [
  "Flight UA237 status",
  "Earthquakes in California",
  "Weather in London",
];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!query.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: query,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setQuery("");
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const responses: Record<string, string> = {
        earthquake: "Based on USGS data, there have been 5 earthquakes above magnitude 5.0 in the last 24 hours. The largest was a M6.1 in Chile. Would you like me to show you the details on the map?",
        flight: "I found flight information. The flight is currently en route and scheduled to arrive on time. You can track it in real-time on the Flight Radar page.",
        weather: "The current weather shows partly cloudy conditions with temperatures around 24°C. The forecast shows potential rain on Wednesday. Check the Weather page for detailed information.",
        radio: "I found several stations matching your criteria. You can listen to them on the Radio page. Would you like me to recommend some popular ones?",
        ship: "I can help you track vessels. Head over to the Marine Traffic page to see real-time ship positions and details.",
      };

      let response = "I can help you with tracking flights, ships, earthquakes, volcanoes, weather, and finding radio stations. What would you like to know?";
      
      const lowerQuery = query.toLowerCase();
      if (lowerQuery.includes("earthquake") || lowerQuery.includes("seismic")) {
        response = responses.earthquake;
      } else if (lowerQuery.includes("flight") || lowerQuery.includes("plane")) {
        response = responses.flight;
      } else if (lowerQuery.includes("weather") || lowerQuery.includes("forecast")) {
        response = responses.weather;
      } else if (lowerQuery.includes("radio") || lowerQuery.includes("station")) {
        response = responses.radio;
      } else if (lowerQuery.includes("ship") || lowerQuery.includes("vessel") || lowerQuery.includes("marine")) {
        response = responses.ship;
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const handleVoiceInput = () => {
    setIsListening(!isListening);
    // Voice input simulation
    if (!isListening) {
      setTimeout(() => {
        setQuery("Show me recent earthquakes");
        setIsListening(false);
      }, 2000);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        {/* Header */}
        <section className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                AI Assistant
              </h1>
              <p className="text-muted-foreground text-sm">
                Ask anything about tracking, weather, or radio
              </p>
            </div>
            {messages.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearChat}>
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </section>

        {/* Chat Area */}
        <div className="flex-1 overflow-hidden px-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col justify-center">
              {/* Welcome */}
              <div className="text-center mb-8">
                <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 mb-4">
                  <Bot className="h-10 w-10 text-primary" />
                </div>
                <h2 className="font-heading text-xl font-semibold mb-2">
                  How can I help you today?
                </h2>
                <p className="text-muted-foreground text-sm">
                  I can help you track flights, ships, earthquakes, and more
                </p>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-4 gap-2 mb-6">
                {quickActions.map((action, index) => (
                  <Card 
                    key={index}
                    className="p-3 text-center cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => setQuery(`Help me with ${action.label.toLowerCase()}`)}
                  >
                    <action.icon className={`h-6 w-6 mx-auto mb-1 ${action.color}`} />
                    <p className="text-xs">{action.label}</p>
                  </Card>
                ))}
              </div>

              {/* Suggested Queries */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground mb-3">Try asking</p>
                {suggestedQueries.slice(0, 4).map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-3 px-4"
                    onClick={() => setQuery(suggestion.text)}
                  >
                    <suggestion.icon className="h-4 w-4 mr-3 text-primary shrink-0" />
                    <span className="text-sm truncate">{suggestion.text}</span>
                  </Button>
                ))}
              </div>

              {/* Search History */}
              {searchHistory.length > 0 && (
                <div className="mt-6">
                  <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Recent searches
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {searchHistory.map((item, index) => (
                      <Button
                        key={index}
                        variant="secondary"
                        size="sm"
                        onClick={() => setQuery(item)}
                      >
                        {item}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <ScrollArea className="h-full pr-4" ref={scrollRef}>
              <div className="space-y-4 py-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.role === "user" ? "justify-end" : ""}`}
                  >
                    {message.role === "assistant" && (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 shrink-0">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <Card className={`max-w-[80%] p-3 ${
                      message.role === "user" 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted"
                    }`}>
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-2 ${
                        message.role === "user" 
                          ? "text-primary-foreground/70" 
                          : "text-muted-foreground"
                      }`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </Card>
                    {message.role === "user" && (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted shrink-0">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 shrink-0">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <Card className="p-3 bg-muted">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </Card>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Input Area */}
        <section className="px-4 py-4">
          <Card className="p-2">
            <div className="flex items-center gap-2">
              <SearchIcon className="h-5 w-5 text-muted-foreground ml-2" />
              <Input
                type="text"
                placeholder="Ask me anything..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                className="flex-1 border-0 bg-transparent focus-visible:ring-0"
              />
              <Button 
                size="icon" 
                variant={isListening ? "default" : "ghost"}
                onClick={handleVoiceInput}
              >
                <Mic className={`h-5 w-5 ${isListening ? "animate-pulse" : ""}`} />
              </Button>
              <Button 
                size="icon" 
                disabled={!query.trim() || isLoading}
                onClick={handleSend}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </Card>
        </section>
      </div>
    </Layout>
  );
}
