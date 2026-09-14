import { useEffect, useState } from "react";

const CHEVRON_DELAYS = Array.from({ length: 9 }, (_, i) => {
  const r = Math.floor(i / 3);
  const c = i % 3;
  return (c + Math.abs(r - 1)) * 90;
});

const ORBIT_ORDER = [0, 1, 2, 5, 8, 7, 6, 3];
const ORBIT_DELAYS = Array.from({ length: 9 }, (_, i) => {
  const k = ORBIT_ORDER.indexOf(i);
  return k === -1 ? null : k * 110;
});

const PATTERNS = {
  Drive: { delays: CHEVRON_DELAYS, dur: 650, round: false },
  Dots: { delays: CHEVRON_DELAYS, dur: 650, round: true },
  Orbit: { delays: ORBIT_DELAYS, dur: 950, round: false },
};

function LoaderGrid({
  delays,
  dur,
  round,
}: {
  delays: (number | null)[];
  dur: number;
  round: boolean;
}) {
  return (
    <span aria-hidden="true" className="grid shrink-0 grid-cols-[repeat(3,4px)] gap-[1.5px]">
      {delays.map((delay, index) => (
        <span
          key={index}
          className={`size-[4px] bg-foreground/15 ${round ? "rounded-full" : "rounded-[1px]"}`}
          style={{
            opacity: delay === null ? 0.07 : 0.15,
            animation: delay === null ? "none" : `pixel-on ${dur}ms ease-in-out ${delay}ms infinite`,
          }}
        />
      ))}
    </span>
  );
}

function useElapsed() {
  const [ds, setDs] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setDs((d) => d + 1), 100);
    return () => clearInterval(t);
  }, []);
  const total = ds / 10;
  if (total < 60) return `${total.toFixed(1)}s`;
  return `${Math.floor(total / 60)}m ${(total % 60).toFixed(1)}s`;
}

interface ThinkingIndicatorProps {
  words: string[];
  interval?: number;
  className?: string;
  variant?: "Drive" | "Dots" | "Orbit";
}

export function ThinkingIndicator({
  words,
  interval = 2600,
  className,
  variant = "Drive",
}: ThinkingIndicatorProps) {
  const [index, setIndex] = useState(0);
  const elapsed = useElapsed();
  const { delays, dur, round } = PATTERNS[variant] ?? PATTERNS.Drive;

  useEffect(() => {
    setIndex(0);
    if (words.length <= 1) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % words.length), interval);
    return () => clearInterval(timer);
  }, [words, interval]);

  const word = words.length > 0 ? words[index % words.length] : "";
  const resolvedLabel = words.length > 0 ? word : "Churning";

  return (
    <div role="status" className={`flex w-fit items-center gap-2.5 ${className ?? ""}`}>
      <LoaderGrid delays={delays} dur={dur} round={round} />
      <span
        className="bg-clip-text text-[13px] font-medium text-transparent"
        style={{
          backgroundImage:
            "linear-gradient(90deg, var(--muted-foreground) 35%, var(--foreground) 50%, var(--muted-foreground) 65%)",
          backgroundSize: "200% 100%",
          animation: "shimmer-text 1.4s linear infinite",
        }}
      >
        {resolvedLabel}
      </span>
      <span className="font-mono text-[12px] text-muted-foreground tabular-nums">
        {elapsed}
      </span>
    </div>
  );
}