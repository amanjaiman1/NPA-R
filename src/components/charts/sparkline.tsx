import { cn } from "@/lib/utils";

export function Sparkline({
  values,
  width = 120,
  height = 32,
  className,
  fill = true,
}: {
  values: number[];
  width?: number;
  height?: number;
  className?: string;
  fill?: boolean;
}) {
  if (!values.length) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const pad = 2;
  const x = (i: number) =>
    pad + (i / (values.length - 1 || 1)) * (width - pad * 2);
  const y = (v: number) =>
    pad + (height - pad * 2) - ((v - min) / (max - min || 1)) * (height - pad * 2);
  const line = values
    .map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`)
    .join(" ");
  const area = `${line} L${x(values.length - 1).toFixed(1)},${height} L${x(0).toFixed(1)},${height} Z`;
  const gid = `sl-${values.length}-${Math.round(max)}`;

  return (
    <svg
      width={width}
      height={height}
      className={cn("overflow-visible", className)}
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(var(--accent))" stopOpacity="0.25" />
          <stop offset="100%" stopColor="rgb(var(--accent))" stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={area} fill={`url(#${gid})`} />}
      <path
        d={line}
        fill="none"
        className="stroke-accent"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
