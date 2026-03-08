import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bug, Lightbulb, Star, Send, Smile, Meh, Frown,
  MessageSquare, ChevronRight, CheckCircle2, Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface FeedbackDialogProps {
  open: boolean;
  onClose: () => void;
  defaultTab?: "bug" | "feature" | "survey";
}

const CATEGORIES = {
  bug: ["UI/Display", "Performance", "Data Accuracy", "Crash/Error", "Authentication", "Maps", "Other"],
  feature: ["New Feature", "Improvement", "Integration", "Performance", "Accessibility", "Other"],
};

const PRIORITIES = [
  { value: "low", label: "Low", color: "bg-muted text-muted-foreground border-border" },
  { value: "medium", label: "Medium", color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30" },
  { value: "high", label: "High", color: "bg-orange-500/10 text-orange-600 border-orange-500/30" },
  { value: "critical", label: "Critical", color: "bg-destructive/10 text-destructive border-destructive/30" },
];

const SURVEY_QUESTIONS = [
  { id: "overall", question: "How would you rate SafeTrack overall?" },
  { id: "ease", question: "How easy is it to find what you need?" },
  { id: "data", question: "How satisfied are you with the data accuracy?" },
];

const EMOJI_RATINGS = [
  { score: 1, icon: Frown, label: "Poor", color: "text-destructive" },
  { score: 2, icon: Frown, label: "Fair", color: "text-orange-500" },
  { score: 3, icon: Meh, label: "OK", color: "text-yellow-500" },
  { score: 4, icon: Smile, label: "Good", color: "text-emerald-500" },
  { score: 5, icon: Smile, label: "Excellent", color: "text-primary" },
];

export function FeedbackDialog({ open, onClose, defaultTab = "bug" }: FeedbackDialogProps) {
  const { user } = useAuth();
  const [tab, setTab] = useState<"bug" | "feature" | "survey">(defaultTab);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Bug/Feature form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("medium");

  // Survey state
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [npsScore, setNpsScore] = useState<number | null>(null);
  const [npsReason, setNpsReason] = useState("");

  const resetForm = () => {
    setTitle(""); setDescription(""); setCategory(""); setPriority("medium");
    setRatings({}); setNpsScore(null); setNpsReason(""); setSubmitted(false);
  };

  const handleClose = () => { resetForm(); onClose(); };

  const submitReport = async () => {
    if (!user) { toast.error("Please sign in to submit feedback"); return; }
    if (!title.trim() || !description.trim()) { toast.error("Please fill in title and description"); return; }

    setSubmitting(true);
    try {
      const { error } = await (supabase as any).from("feedback_reports").insert({
        user_id: user.id,
        type: tab,
        title: title.trim(),
        description: description.trim(),
        category: category || null,
        priority,
        page_url: window.location.pathname,
        user_agent: navigator.userAgent.slice(0, 500),
        metadata: { tab, timestamp: new Date().toISOString() },
      });
      if (error) throw error;
      setSubmitted(true);
      toast.success("Thank you! Your feedback has been received. 🎉");
    } catch (err: any) {
      toast.error("Failed to submit: " + (err.message || "Unknown error"));
    }
    setSubmitting(false);
  };

  const submitSurvey = async () => {
    if (!user) { toast.error("Please sign in to submit survey"); return; }
    if (Object.keys(ratings).length < SURVEY_QUESTIONS.length && npsScore === null) {
      toast.error("Please answer all questions");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await (supabase as any).from("survey_responses").insert({
        user_id: user.id,
        survey_id: "in-app-satisfaction-v1",
        nps_score: npsScore,
        responses: { ratings, nps_reason: npsReason, page: window.location.pathname },
      });
      if (error) throw error;
      setSubmitted(true);
      toast.success("Survey submitted! Your voice shapes SafeTrack. 🙌");
    } catch (err: any) {
      toast.error("Failed to submit: " + (err.message || "Unknown error"));
    }
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-sm">
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Thank you!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Your feedback helps make SafeTrack better for everyone. We genuinely appreciate it.
              </p>
            </div>
            <Button onClick={handleClose} className="w-full">Done</Button>
            <Button variant="ghost" size="sm" onClick={() => { setSubmitted(false); resetForm(); }}>
              Submit more feedback
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Share Your Feedback
          </DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => { setTab(v as any); resetForm(); }}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="bug" className="gap-1.5 text-xs">
              <Bug className="h-3.5 w-3.5" /> Bug Report
            </TabsTrigger>
            <TabsTrigger value="feature" className="gap-1.5 text-xs">
              <Lightbulb className="h-3.5 w-3.5" /> Suggestion
            </TabsTrigger>
            <TabsTrigger value="survey" className="gap-1.5 text-xs">
              <Star className="h-3.5 w-3.5" /> Survey
            </TabsTrigger>
          </TabsList>

          {/* Bug Report */}
          <TabsContent value="bug" className="space-y-4 mt-4">
            <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-3 text-sm text-muted-foreground">
              🐛 Found something broken? Tell us and we'll fix it fast!
            </div>

            <div className="space-y-2">
              <Label>What went wrong? <span className="text-destructive">*</span></Label>
              <Input placeholder="e.g. Map crashes when zooming in on mobile" value={title} onChange={e => setTitle(e.target.value)} maxLength={120} />
            </div>

            <div className="space-y-2">
              <Label>Describe the bug <span className="text-destructive">*</span></Label>
              <Textarea
                placeholder="Steps to reproduce, what you expected vs what happened..."
                value={description} onChange={e => setDescription(e.target.value)}
                className="min-h-[100px]" maxLength={2000}
              />
              <p className="text-xs text-muted-foreground text-right">{description.length}/2000</p>
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.bug.map(c => (
                  <button key={c} onClick={() => setCategory(c === category ? "" : c)}
                    className={cn("px-3 py-1 rounded-full text-xs border transition-colors", category === c ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50")}
                  >{c}</button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <div className="flex gap-2 flex-wrap">
                {PRIORITIES.map(p => (
                  <button key={p.value} onClick={() => setPriority(p.value)}
                    className={cn("px-3 py-1 rounded-full text-xs border font-medium transition-all", priority === p.value ? p.color : "border-border text-muted-foreground hover:border-primary/50")}
                  >{p.label}</button>
                ))}
              </div>
            </div>

            <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">
              📎 Page URL and device info are automatically included to help us debug.
            </div>

            <Button onClick={submitReport} disabled={submitting || !title.trim() || !description.trim()} className="w-full gap-2">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Submit Bug Report
            </Button>
          </TabsContent>

          {/* Feature Suggestion */}
          <TabsContent value="feature" className="space-y-4 mt-4">
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-sm text-muted-foreground">
              💡 Great ideas make great apps. Your suggestion could become a real feature!
            </div>

            <div className="space-y-2">
              <Label>Feature title <span className="text-destructive">*</span></Label>
              <Input placeholder="e.g. Dark mode for the map overlay" value={title} onChange={e => setTitle(e.target.value)} maxLength={120} />
            </div>

            <div className="space-y-2">
              <Label>How would it work? <span className="text-destructive">*</span></Label>
              <Textarea
                placeholder="Describe the feature, how it would help, and why it matters to you..."
                value={description} onChange={e => setDescription(e.target.value)}
                className="min-h-[100px]" maxLength={2000}
              />
              <p className="text-xs text-muted-foreground text-right">{description.length}/2000</p>
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.feature.map(c => (
                  <button key={c} onClick={() => setCategory(c === category ? "" : c)}
                    className={cn("px-3 py-1 rounded-full text-xs border transition-colors", category === c ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50")}
                  >{c}</button>
                ))}
              </div>
            </div>

            <Button onClick={submitReport} disabled={submitting || !title.trim() || !description.trim()} className="w-full gap-2">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
              Submit Suggestion
            </Button>
          </TabsContent>

          {/* In-App Survey */}
          <TabsContent value="survey" className="space-y-5 mt-4">
            <div className="rounded-lg bg-muted/50 border border-border p-3 text-sm text-muted-foreground">
              ⭐ Quick 2-minute survey — your honest opinions directly guide our roadmap!
            </div>

            {SURVEY_QUESTIONS.map(q => (
              <div key={q.id} className="space-y-3">
                <Label className="text-sm">{q.question}</Label>
                <div className="flex gap-3 justify-center">
                  {EMOJI_RATINGS.map(r => {
                    const Icon = r.icon;
                    const selected = ratings[q.id] === r.score;
                    return (
                      <button key={r.score} onClick={() => setRatings(prev => ({ ...prev, [q.id]: r.score }))}
                        className={cn("flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all", selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/30")}
                      >
                        <Icon className={cn("h-6 w-6", selected ? r.color : "text-muted-foreground")} />
                        <span className="text-xs text-muted-foreground">{r.score}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* NPS */}
            <div className="space-y-3">
              <Label className="text-sm">How likely are you to recommend SafeTrack? (0-10)</Label>
              <div className="grid grid-cols-11 gap-1">
                {Array.from({ length: 11 }, (_, i) => {
                  const isSelected = npsScore === i;
                  const selectedCls = i >= 9
                    ? "bg-emerald-500 text-primary-foreground border-emerald-500"
                    : i >= 7
                    ? "bg-yellow-500 text-primary-foreground border-yellow-500"
                    : "bg-destructive text-destructive-foreground border-destructive";
                  return (
                    <button key={i} onClick={() => setNpsScore(i)}
                      className={cn(
                        "h-8 rounded text-xs font-semibold border transition-all",
                        isSelected ? selectedCls : "border-border hover:border-primary/50"
                      )}
                    >{i}</button>
                  );
                })}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Not likely</span><span>Very likely</span>
              </div>
            </div>

            {npsScore !== null && npsScore <= 6 && (
              <div className="space-y-2">
                <Label className="text-sm">What could we improve?</Label>
                <Textarea placeholder="Your honest feedback helps us improve..." value={npsReason} onChange={e => setNpsReason(e.target.value)} className="min-h-[80px]" maxLength={500} />
              </div>
            )}

            <Button onClick={submitSurvey} disabled={submitting || Object.keys(ratings).length < SURVEY_QUESTIONS.length || npsScore === null} className="w-full gap-2">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4" />}
              Submit Survey
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
