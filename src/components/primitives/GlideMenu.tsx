import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

import { cn } from "../../lib/utils";

interface GlideMenuProps {
  children: ReactNode;
  className?: string;
  highlightClassName?: string;
  rowSelector?: string;
}

interface HighlightPosition {
  left: number;
  top: number;
  width: number;
  height: number;
}

function getHighlightPosition(
  container: HTMLDivElement,
  row: Element,
): HighlightPosition {
  const containerRect = container.getBoundingClientRect();
  const rowRect = row.getBoundingClientRect();

  return {
    left: rowRect.left - containerRect.left,
    top: rowRect.top - containerRect.top,
    width: rowRect.width,
    height: rowRect.height,
  };
}

export default function GlideMenu({
  children,
  className,
  highlightClassName,
  rowSelector = "[data-menu-row]",
}: GlideMenuProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [highlight, setHighlight] = useState<HighlightPosition | null>(null);

  const updateHighlight = (row: Element | null) => {
    const container = containerRef.current;

    if (!container || !row || !container.contains(row)) {
      setHighlight(null);
      return;
    }

    setHighlight(getHighlightPosition(container, row));
  };

  useEffect(() => {
    const container = containerRef.current;

    if (!container || !highlight) return;

    const handleResize = () => {
      const row = container.querySelector(rowSelector);

      if (row) {
        setHighlight(getHighlightPosition(container, row));
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [highlight, rowSelector]);

  const highlightStyle: CSSProperties | undefined = highlight
    ? {
        left: highlight.left,
        top: highlight.top,
        width: highlight.width,
        height: highlight.height,
      }
    : undefined;

  return (
    <div
      ref={containerRef}
      className={cn("relative", className)}
      onPointerOver={(event) => {
        const row = (event.target as Element).closest(rowSelector);
        updateHighlight(row);
      }}
      onPointerLeave={() => setHighlight(null)}
      onFocusCapture={(event) => {
        const row = (event.target as Element).closest(rowSelector);
        updateHighlight(row);
      }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setHighlight(null);
        }
      }}
    >
      {highlight && (
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute z-0 transition-[left,top,width,height] duration-150",
            highlightClassName,
          )}
          style={highlightStyle}
        />
      )}

      {children}
    </div>
  );
}