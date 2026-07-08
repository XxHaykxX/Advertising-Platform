import { cn } from "@/lib/utils";

function scoreColor(score: number) {
  if (score >= 80) return "var(--success)";
  if (score >= 60) return "var(--warn)";
  return "var(--danger)";
}

interface ScoreBarProps {
  label: string;
  score: number;
  aiText?: string;
  className?: string;
}

export function ScoreBar({ label, score, aiText, className }: ScoreBarProps) {
  const clamped = Math.max(0, Math.min(100, score));
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className="font-semibold" style={{ color: scoreColor(clamped) }}>
          {clamped}
        </span>
      </div>
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-[width] duration-500 ease-out"
          style={{ width: `${clamped}%`, backgroundColor: scoreColor(clamped) }}
        />
      </div>
      {aiText ? <p className="mt-1.5 text-xs text-muted-foreground">{aiText}</p> : null}
    </div>
  );
}
