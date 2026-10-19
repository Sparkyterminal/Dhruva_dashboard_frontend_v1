import React from "react";

/** The Dhruva elephant-D logo with the serif wordmark. Gold on the green brand surfaces. */
const BrandMark = ({ markSize = 46, wordSize = 30, color = "var(--gold)", className = "" }) => (
  <span
    className={className}
    style={{ display: "inline-flex", alignItems: "center", gap: 12 }}
  >
    <img
      src="/assets/dhruvalogo-removed.png"
      alt=""
      width={markSize}
      height={markSize}
      style={{ objectFit: "contain", flex: "none" }}
    />
    <span
      style={{
        fontFamily: "var(--font-display)",
        fontSize: wordSize,
        fontWeight: 600,
        lineHeight: 1,
        letterSpacing: "0.01em",
        color,
      }}
    >
      Dhruva
    </span>
  </span>
);

export default BrandMark;
