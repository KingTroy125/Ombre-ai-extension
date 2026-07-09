import { useCallback, useLayoutEffect, useRef, useState } from "react";

const BOTTOM_THRESHOLD_PX = 56;

interface UseStickyScrollOptions {
  /** Fires when the pinned-to-bottom state changes. */
  onPinnedChange?: (pinned: boolean) => void;
}

/**
 * Mirrors the "auto-scroll while pinned, back off the moment the reader
 * scrolls up" behavior: while the viewport is already at the bottom, new
 * content keeps it pinned there; the moment the reader scrolls away from
 * the bottom, that's treated as a deliberate opt-out and nothing auto-
 * scrolls again until they either scroll back down themselves or tap the
 * "jump to latest" button.
 */
export function useStickyScroll({ onPinnedChange }: UseStickyScrollOptions = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPinned, setIsPinned] = useState(true);
  const [hasUnseenContent, setHasUnseenContent] = useState(false);
  const isPinnedRef = useRef(true);

  const setPinned = useCallback(
    (value: boolean) => {
      isPinnedRef.current = value;
      setIsPinned(value);
      if (value) setHasUnseenContent(false);
      onPinnedChange?.(value);
    },
    [onPinnedChange]
  );

  const measureIsAtBottom = useCallback(() => {
    const el = containerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < BOTTOM_THRESHOLD_PX;
  }, []);

  const handleScroll = useCallback(() => {
    const atBottom = measureIsAtBottom();
    if (atBottom !== isPinnedRef.current) setPinned(atBottom);
  }, [measureIsAtBottom, setPinned]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
    setPinned(true);
  }, [setPinned]);

  /** Turn-anchoring: settle a specific element (e.g. the message the person
   * just sent) near the top of the viewport instead of snapping the whole
   * thread to the bottom — keeps a peek of prior context visible above it. */
  const anchorToElement = useCallback((el: HTMLElement, offsetPx = 12) => {
    const container = containerRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const delta = elRect.top - containerRect.top - offsetPx;
    container.scrollTo({ top: container.scrollTop + delta, behavior: "smooth" });
    // Anchoring intentionally does NOT re-pin to bottom — the reply that
    // follows should arrive in view below without yanking the view down.
    setPinned(false);
    setHasUnseenContent(false);
  }, [setPinned]);

  /** Call after new content renders. Auto-scrolls only if already pinned;
   * otherwise flags that there's unseen content below, for the jump button. */
  const onContentChanged = useCallback(() => {
    if (isPinnedRef.current) {
      requestAnimationFrame(() => scrollToBottom("smooth"));
    } else {
      setHasUnseenContent(true);
    }
  }, [scrollToBottom]);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return { containerRef, isPinned, hasUnseenContent, scrollToBottom, anchorToElement, onContentChanged, setPinned };
}
