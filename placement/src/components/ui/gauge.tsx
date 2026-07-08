import { cn } from "@/lib/utils";

function scoreColor(score: number) {
  if (score >= 80) return "var(--success)";
  if (score >= 60) return "var(--warn)";
  return "var(--danger)";
}

interface GaugeProps {
  value: number;
  size?: number;
  label?: string;
  className?: string;
}

export function Gauge({ value, size = 160, label, className }: GaugeProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = size / 2 - 12;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);
  const color = scoreColor(clamped);
  const height = size / 2 + 24;

  return (
    <div className={cn("flex flex-col items-center", className)} style={{ width: size }}>
      <svg width={size} height={height} viewBox={`0 0 ${size} ${height}`}>
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke="var(--border)"
          strokeWidth={12}
          strokeLinecap="round"
        />
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          fontSize={size * 0.22}
          fontWeight={800}
          fill="var(--foreground)"
        >
          {clamped}
        </text>
        <text
          x={cx}
          y={cy + size * 0.1}
          textAnchor="middle"
          fontSize={size * 0.08}
          fill="var(--muted-foreground)"
        >
          /100
        </text>
      </svg>
      {label ? (
        <span className="mt-1 text-sm font-medium text-muted-foreground">{label}</span>
      ) : null}
    </div>
  );
}
