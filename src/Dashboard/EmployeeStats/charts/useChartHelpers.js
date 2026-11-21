import { useCallback, useLayoutEffect, useRef, useState } from "react";

/** Width of an element in pixels, kept up to date as it resizes (charts draw at their real size). */
export const useElementWidth = (fallback = 640) => {
  const ref = useRef(null);
  const [width, setWidth] = useState(fallback);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const update = () => setWidth(Math.round(el.clientWidth) || fallback);
    update();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : null;
    observer?.observe(el);
    return () => observer?.disconnect();
  }, [fallback]);
  return [ref, width];
};

/**
 * One tooltip per chart: shown on hover and on keyboard focus, so every value is reachable without a mouse.
 * `show(element, content)` places it above the element, kept inside the screen.
 */
export const useChartTip = () => {
  const [tip, setTip] = useState(null);
  const show = useCallback((element, content) => {
    if (!element) return;
    const r = element.getBoundingClientRect();
    const margin = 110;
    const x = Math.min(Math.max(r.left + r.width / 2, margin), Math.max(window.innerWidth - margin, margin));
    setTip({ x, y: r.top, content });
  }, []);
  const hide = useCallback(() => setTip(null), []);
  return { tip, show, hide };
};
