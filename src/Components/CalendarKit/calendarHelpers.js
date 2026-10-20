/**
 * Soft calendar-event colours: a tinted fill, a strong left edge and dark text, so busy
 * months stay readable. `accent` is any #rrggbb colour.
 */
export const softEvent = (accent) => {
  const hex = String(accent || "#338147").replace("#", "");
  const n = parseInt(hex.length === 3 ? hex.replace(/(.)/g, "$1$1") : hex, 16);
  const mix = (c) => Math.round(c + (255 - c) * 0.86);
  const r = mix((n >> 16) & 255);
  const g = mix((n >> 8) & 255);
  const b = mix(n & 255);
  return {
    backgroundColor: `rgb(${r}, ${g}, ${b})`,
    borderColor: `#${hex.length === 3 ? hex.replace(/(.)/g, "$1$1") : hex}`,
    textColor: "#1d261d",
  };
};

/** Same-month check used to avoid re-rendering the page when the visible month did not change. */
export const sameMonth = (a, b) =>
  a && b && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
