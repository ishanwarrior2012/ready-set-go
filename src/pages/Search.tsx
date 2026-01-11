import { useState, useRef, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search as SearchIcon, 
  Mic, 
  MicOff,
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
  Loader2,
  AudioWaveform
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAIChat, ChatMessage } from "@/hooks/useAIChat";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem("safetrack-search-history");
    return saved ? JSON.parse(saved) : [];
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { messages, isLoading, sendMessage, clearMessages } = useAIChat();
  
  const { isRecording, isProcessing, startRecording, stopRecording, cancelRecording } = useVoiceInput({
    onTranscript: async (text) => {
      // Auto-send to AI after transcription
      const newHistory = [text, ...searchHistory.filter(h => h !== text)].slice(0, 5);
      setSearchHistory(newHistory);
      localStorage.setItem("safetrack-search-history", JSON.stringify(newHistory));
      
      toast.success("Sending to AI...", { description: text.slice(0, 50) + (text.length > 50 ? "..." : "") });
      await sendMessage(text);
    },
    onError: (error) => {
      toast.error("Voice input failed", { description: error });
    }
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!query.trim() || isLoading) return;

    // Add to search history
    const newHistory = [query, ...searchHistory.filter(h => h !== query)].slice(0, 5);
    setSearchHistory(newHistory);
    localStorage.setItem("safetrack-search-history", JSON.stringify(newHistory));

    const currentQuery = query;
    setQuery("");
    await sendMessage(currentQuery);
  };

  const handleVoiceToggle = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      try {
        await startRecording();
        toast.info("Listening...", { description: "Speak now, then tap again to stop" });
      } catch {
        toast.error("Microphone access denied", { 
          description: "Please allow microphone access in your browser settings" 
        });
      }
    }
  };

  const clearChat = () => {
    clearMessages();
  };

  const isVoiceBusy = isRecording || isProcessing;

  return (
    <Layout showFab={false}>
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
                  Powered by Gemini AI - I can help you track flights, ships, earthquakes, and more
                </p>
                <p className="text-primary text-sm mt-2 flex items-center justify-center gap-1">
                  <Mic className="h-4 w-4" />
                  Tap the mic to speak your question
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
                {messages.map((message: ChatMessage) => (
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
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
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
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">Thinking...</span>
                      </div>
                    </Card>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Recording Indicator */}
        {isRecording && (
          <div className="px-4 py-2">
            <Card className="p-3 bg-destructive/10 border-destructive/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <AudioWaveform className="h-5 w-5 text-destructive animate-pulse" />
                    <span className="absolute -top-1 -right-1 h-2 w-2 bg-destructive rounded-full animate-ping" />
                  </div>
                  <span className="text-sm font-medium text-destructive">Recording... Tap mic to stop</span>
                </div>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={cancelRecording}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="px-4 py-2">
            <Card className="p-3 bg-primary/10 border-primary/20">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 text-primary animate-spin" />
                <span className="text-sm font-medium text-primary">Transcribing your voice...</span>
              </div>
            </Card>
          </div>
        )}

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
                disabled={isLoading || isVoiceBusy}
              />
              <Button 
                size="icon" 
                variant={isRecording ? "destructive" : isProcessing ? "secondary" : "ghost"}
                onClick={handleVoiceToggle}
                disabled={isLoading || isProcessing}
                className={cn(
                  "relative",
                  isRecording && "animate-pulse"
                )}
              >
                {isProcessing ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : isRecording ? (
                  <MicOff className="h-5 w-5" />
                ) : (
                  <Mic className="h-5 w-5" />
                )}
              </Button>
              <Button 
                size="icon" 
                disabled={!query.trim() || isLoading || isVoiceBusy}
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
