import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Calendar, Camera, ChevronRight, Loader2, Globe, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const STEPS = ["Welcome", "Profile", "Location", "Done"];

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    display_name: user?.email?.split("@")[0] || "",
    dob: "",
    bio: "",
    avatar_url: "",
    country: "",
    city: "",
  });

  const updateForm = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").update({
        display_name: form.display_name.trim() || user.email?.split("@")[0],
        bio: form.bio.trim() || null,
        avatar_url: form.avatar_url.trim() || null,
      }).eq("id", user.id);

      if (error) throw error;

      // Store onboarding complete flag
      localStorage.setItem(`onboarding_done_${user.id}`, "true");
      toast.success("Profile setup complete! Welcome to SafeTrack.");
      navigate("/", { replace: true });
    } catch (err: any) {
      toast.error("Failed to save profile: " + (err.message || "Unknown error"));
    }
    setSaving(false);
  };

  const handleSkip = () => {
    if (user) localStorage.setItem(`onboarding_done_${user.id}`, "true");
    navigate("/", { replace: true });
  };

  const initials = form.display_name
    .split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "U";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-colors ${
                i < step ? "bg-primary text-primary-foreground" :
                i === step ? "bg-primary/20 text-primary border-2 border-primary" :
                "bg-muted text-muted-foreground"
              }`}>
                {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 transition-colors ${i < step ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 0: Welcome */}
        {step === 0 && (
          <Card className="p-6 space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold font-heading">Welcome to SafeTrack</h1>
              <p className="text-muted-foreground mt-2">
                Let's set up your profile so you get the most out of the app. This only takes a minute.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {["🌍 Global Tracking","🌊 Marine Monitor","✈️ Flight Radar","🌋 Volcano Watch","🌦 Weather Layers","⭐ Astronomical Data"].map(f => (
                <div key={f} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                  <span>{f}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={handleSkip}>Skip Setup</Button>
              <Button className="flex-1" onClick={() => setStep(1)}>Get Started <ChevronRight className="w-4 h-4 ml-1" /></Button>
            </div>
          </Card>
        )}

        {/* Step 1: Profile */}
        {step === 1 && (
          <Card className="p-6 space-y-5">
            <div>
              <h2 className="text-xl font-bold font-heading flex items-center gap-2"><User className="w-5 h-5 text-primary" /> Your Profile</h2>
              <p className="text-sm text-muted-foreground mt-1">Tell us a bit about yourself</p>
            </div>
            <div className="flex flex-col items-center gap-3">
              <Avatar className="w-20 h-20 border-4 border-border">
                <AvatarImage src={form.avatar_url} />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">{initials}</AvatarFallback>
              </Avatar>
              <div className="w-full space-y-1">
                <Label htmlFor="avatar_url" className="flex items-center gap-1"><Camera className="w-3 h-3" /> Avatar URL (optional)</Label>
                <Input id="avatar_url" placeholder="https://example.com/avatar.jpg" value={form.avatar_url} onChange={e => updateForm("avatar_url", e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="display_name">Display Name *</Label>
              <Input id="display_name" placeholder="Your name" value={form.display_name} onChange={e => updateForm("display_name", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="dob" className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Date of Birth (optional)</Label>
              <Input id="dob" type="date" value={form.dob} onChange={e => updateForm("dob", e.target.value)} max={new Date().toISOString().split("T")[0]} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="bio">Bio (optional)</Label>
              <Textarea id="bio" placeholder="Tell us about yourself..." value={form.bio} onChange={e => updateForm("bio", e.target.value)} rows={3} maxLength={300} />
              <p className="text-xs text-muted-foreground text-right">{form.bio.length}/300</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep(0)}>Back</Button>
              <Button className="flex-1" onClick={() => setStep(2)} disabled={!form.display_name.trim()}>Next <ChevronRight className="w-4 h-4 ml-1" /></Button>
            </div>
          </Card>
        )}

        {/* Step 2: Location preferences */}
        {step === 2 && (
          <Card className="p-6 space-y-5">
            <div>
              <h2 className="text-xl font-bold font-heading flex items-center gap-2"><Globe className="w-5 h-5 text-primary" /> Location</h2>
              <p className="text-sm text-muted-foreground mt-1">Help us personalize weather and tracking data</p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="country">Country (optional)</Label>
              <Input id="country" placeholder="e.g. United States" value={form.country} onChange={e => updateForm("country", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="city">City (optional)</Label>
              <Input id="city" placeholder="e.g. New York" value={form.city} onChange={e => updateForm("city", e.target.value)} />
            </div>
            <div className="p-3 rounded-lg bg-muted/50 border border-border text-xs text-muted-foreground">
              📍 You can also grant GPS access from the Astronomical Dashboard for precise sunrise/sunset and sky chart calculations.
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Back</Button>
              <Button className="flex-1" onClick={() => setStep(3)}>Next <ChevronRight className="w-4 h-4 ml-1" /></Button>
            </div>
          </Card>
        )}

        {/* Step 3: Done */}
        {step === 3 && (
          <Card className="p-6 space-y-6 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-heading">All Set, {form.display_name || "Friend"}!</h2>
              <p className="text-muted-foreground mt-2">Your profile is ready. You can update it anytime from Settings.</p>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border">
              <Avatar className="w-14 h-14">
                <AvatarImage src={form.avatar_url} />
                <AvatarFallback className="bg-primary/10 text-primary text-lg">{initials}</AvatarFallback>
              </Avatar>
              <div className="text-left">
                <p className="font-semibold">{form.display_name}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                {form.city && <p className="text-xs text-muted-foreground">{form.city}{form.country ? `, ${form.country}` : ""}</p>}
              </div>
            </div>
            <Button className="w-full" size="lg" onClick={handleFinish} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {saving ? "Saving..." : "Enter SafeTrack →"}
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
