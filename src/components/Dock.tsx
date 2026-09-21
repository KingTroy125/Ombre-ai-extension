import { motion, useReducedMotion, type Transition } from "framer-motion";
import { createContext, useContext, useId, useMemo, type ReactNode } from "react";
import { cn } from "../lib/utils";

const SPRING_LAYOUT: Transition = {
  type: "spring",
  stiffness: 550,
  damping: 38,
  mass: 0.7,
};

type DockContextValue = {
  size: number;
  pillLayoutId: string;
};

const DockContext = createContext<DockContextValue | null>(null);

export interface DockProps {
  children: ReactNode;
  className?: string;
  /** Size of each item in px. */
  size?: number;
}

export function Dock({ children, size = 44, className }: DockProps) {
  const pillLayoutId = useId();
  const ctx = useMemo<DockContextValue>(() => ({ size, pillLayoutId }), [size, pillLayoutId]);

  return (
    <DockContext.Provider value={ctx}>
      <div
        className={cn(
          "inline-flex h-auto items-end gap-1.5 rounded-2xl border border-white/10 bg-[#121215]/90 px-2 py-1 shadow-[0_12px_28px_rgba(0,0,0,0.42)] backdrop-blur-xl",
          className
        )}
      >
        {children}
      </div>
    </DockContext.Provider>
  );
}

export interface DockItemProps {
  children: ReactNode;
  className?: string;
  /** When set, the item renders as a <button>. Omit when children carry their own link or button. */
  onClick?: () => void;
  active?: boolean;
  "aria-label"?: string;
}

export function DockItem({ children, className, onClick, active, ...rest }: DockItemProps) {
  const dock = useContext(DockContext);
  const reduce = useReducedMotion();
  const size = dock?.size ?? 44;
  const pillLayoutId = dock?.pillLayoutId ?? "dock-pill";

  const pill = active ? (
    <motion.span
      layoutId={pillLayoutId}
      transition={reduce ? { duration: 0 } : SPRING_LAYOUT}
      className="absolute inset-0.5 -z-10 rounded-xl bg-primary/15"
    />
  ) : null;
  const sharedStyle = { width: size, height: size };
  const sharedClass = cn(
    "relative flex shrink-0 items-center justify-center rounded-full text-foreground",
    className
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={rest["aria-label"]}
        aria-pressed={active}
        style={sharedStyle}
        className={cn(
          sharedClass,
          "cursor-pointer border border-transparent bg-transparent p-0 text-foreground/90 outline-none transition-colors hover:bg-white/5",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        )}
      >
        {pill}
        {children}
      </button>
    );
  }

  // Children carry their own link or button (and its accessible name).
  return (
    <div style={sharedStyle} className={sharedClass}>
      {pill}
      {children}
    </div>
  );
}

export function DockSeparator({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn("mx-1 h-6 w-px self-center bg-border", className)} />
  );
}
