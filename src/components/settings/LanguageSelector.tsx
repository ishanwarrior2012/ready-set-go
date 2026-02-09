import { useState, useMemo } from "react";
import { Globe, Search, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePreferences } from "@/contexts/AppContext";
import { useToast } from "@/hooks/use-toast";
import { languages, searchLanguages } from "@/hooks/useLanguages";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function LanguageSelector() {
  const { preferences, updatePreferences } = usePreferences();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(
    () => (query ? searchLanguages(query) : languages),
    [query]
  );

  const currentLang = languages.find((l) => l.code === preferences.language);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors">
          <Globe className="h-5 w-5 text-muted-foreground" />
          <div className="flex-1">
            <p className="font-medium">Language</p>
            <p className="text-sm text-muted-foreground">
              {currentLang ? `${currentLang.nativeName} (${currentLang.name})` : "English"}
            </p>
          </div>
          <span className="text-sm text-muted-foreground">{preferences.language?.toUpperCase()}</span>
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Select Language ({languages.length}+ languages)
          </DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search languages..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
            autoFocus
          />
        </div>
        <ScrollArea className="h-[400px] pr-2">
          <div className="space-y-0.5">
            {filtered.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  updatePreferences({ language: lang.code });
                  toast({ title: `Language: ${lang.nativeName}` });
                  setOpen(false);
                  setQuery("");
                }}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors",
                  preferences.language === lang.code
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted/50"
                )}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{lang.nativeName}</p>
                  <p className="text-xs text-muted-foreground truncate">{lang.name}</p>
                </div>
                <span className="text-xs text-muted-foreground uppercase shrink-0">{lang.code}</span>
                {preferences.language === lang.code && (
                  <Check className="h-4 w-4 text-primary shrink-0" />
                )}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No languages found</p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
