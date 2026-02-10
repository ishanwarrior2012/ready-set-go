import { useMemo } from "react";
import { Progress } from "@/components/ui/progress";
import { Check, X } from "lucide-react";

interface Props {
  password: string;
}

const checks = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "Uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "Number", test: (p: string) => /\d/.test(p) },
  { label: "Special character", test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

export function PasswordStrengthMeter({ password }: Props) {
  const { score, label, color } = useMemo(() => {
    if (!password) return { score: 0, label: "", color: "" };
    const passed = checks.filter((c) => c.test(password)).length;
    const s = (passed / checks.length) * 100;
    if (s <= 20) return { score: s, label: "Very Weak", color: "text-red-500" };
    if (s <= 40) return { score: s, label: "Weak", color: "text-orange-500" };
    if (s <= 60) return { score: s, label: "Fair", color: "text-amber-500" };
    if (s <= 80) return { score: s, label: "Strong", color: "text-emerald-500" };
    return { score: s, label: "Very Strong", color: "text-green-500" };
  }, [password]);

  if (!password) return null;

  return (
    <div className="space-y-2 mt-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Password Strength</span>
        <span className={`text-xs font-semibold ${color}`}>{label}</span>
      </div>
      <Progress value={score} className="h-1.5" />
      <div className="grid grid-cols-1 gap-1 mt-1">
        {checks.map((c, i) => {
          const passed = c.test(password);
          return (
            <div key={i} className="flex items-center gap-1.5">
              {passed ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <X className="h-3 w-3 text-muted-foreground/50" />
              )}
              <span className={`text-xs ${passed ? "text-foreground" : "text-muted-foreground/50"}`}>
                {c.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
