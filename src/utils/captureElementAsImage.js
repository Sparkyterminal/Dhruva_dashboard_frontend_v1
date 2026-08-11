import html2canvas from "html2canvas-pro";

const UNSUPPORTED_COLOR_PATTERN =
  /oklch|oklab|color\(|lch\(|lab\(/i;

const inlineAllComputedStyles = (originalRoot, clonedRoot) => {
  if (!originalRoot || !clonedRoot) return;

  const originalNodes = [
    originalRoot,
    ...originalRoot.querySelectorAll("*"),
  ];
  const clonedNodes = [clonedRoot, ...clonedRoot.querySelectorAll("*")];

  originalNodes.forEach((original, index) => {
    const clone = clonedNodes[index];
    if (!clone) return;

    const computed = window.getComputedStyle(original);
    for (let i = 0; i < computed.length; i += 1) {
      const prop = computed[i];
      const value = computed.getPropertyValue(prop);
      if (!value || UNSUPPORTED_COLOR_PATTERN.test(value)) continue;
      try {
        clone.style.setProperty(prop, value, computed.getPropertyPriority(prop));
      } catch {
        // Some properties cannot be set inline.
      }
    }
  });
};

const hideElements = (clonedDoc, selectors) => {
  selectors.forEach((selector) => {
    clonedDoc.querySelectorAll(selector).forEach((el) => {
      el.style.visibility = "hidden";
    });
  });
};

const capture = (element, { hideSelectors, useStyleFallback }) =>
  html2canvas(element, {
    scale: Math.max(2, window.devicePixelRatio || 1),
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#ffffff",
    logging: false,
    onclone: (clonedDoc, clonedElement) => {
      hideElements(clonedDoc, hideSelectors);

      if (useStyleFallback) {
        clonedDoc
          .querySelectorAll("style, link[rel='stylesheet']")
          .forEach((node) => node.remove());
        inlineAllComputedStyles(element, clonedElement);
      }
    },
  });

/**
 * Capture a DOM node as a canvas matching on-screen appearance (PNG export).
 */
export const captureElementAsImage = async (
  element,
  { hideSelectors = [] } = {},
) => {
  if (!element) return null;

  try {
    return await capture(element, { hideSelectors, useStyleFallback: false });
  } catch (error) {
    if (!/oklch|color function/i.test(String(error?.message || ""))) {
      throw error;
    }
    return capture(element, { hideSelectors, useStyleFallback: true });
  }
};

export const downloadCanvasAsPng = (canvas, filename) => {
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  link.click();
};
