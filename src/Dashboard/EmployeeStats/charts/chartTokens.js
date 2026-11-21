// Chart colours and ink for Employee Statistics. The categorical set was run through the dataviz
// validator on the white panel surface: every check passes (lightness band, chroma floor, colour-blind
// separation, normal-vision floor). Gold sits under 3:1 on white, which is why every chart also has
// visible labels, a legend and a table view, and never relies on colour alone.

/** Categorical colours in their validated order: green, gold, teal, clay. */
export const SERIES = ["#2f8a4b", "#c4a747", "#1d9e94", "#b5562b"];

/** Booking statuses, in the order they are drawn. Colour follows the status, never its size. */
export const STATUS = [
  { key: "confirmed", label: "Confirmed", color: SERIES[0] },
  { key: "inProgress", label: "In progress", color: SERIES[1] },
  { key: "almostBooked", label: "Almost booked", color: SERIES[2] },
  { key: "cancelled", label: "Cancelled", color: SERIES[3] },
];

export const CHART_INK = {
  primary: "#1d261d",
  secondary: "#5b665a",
  grid: "#e1e6df",
  axis: "#c9d1c7",
  surface: "#ffffff",
  dark: "#0b0b0b",
};

/** Heat-map steps: level 0 = nothing, 1-5 = one green hue, light to dark. `fg` is the text colour on that step. */
export const HEAT_RAMP = [
  { bg: "#f4f6f2", fg: CHART_INK.secondary },
  { bg: "#d6e8dc", fg: CHART_INK.primary },
  { bg: "#a7cfb4", fg: CHART_INK.primary },
  { bg: "#6fae86", fg: CHART_INK.dark },
  { bg: "#2f7a4d", fg: "#ffffff" },
  { bg: "#17542a", fg: "#ffffff" },
];

const channel = (v) => {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};

const luminance = (hex) => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.replace(/(.)/g, "$1$1") : h, 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
};

/** WCAG contrast ratio between two colours (1 to 21). */
export const contrastRatio = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/** White or near-black, whichever reads better on a filled mark. */
export const readableOn = (hex) =>
  contrastRatio("#ffffff", hex) >= contrastRatio(CHART_INK.dark, hex) ? "#ffffff" : CHART_INK.dark;
