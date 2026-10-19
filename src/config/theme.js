// Ant Design theme: maps the Dhruva design tokens (src/styles/theme.css) onto the
// component library so every screen that uses antd restyles automatically.
const FONT_SANS =
  '"Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

const antdTheme = {
  token: {
    colorPrimary: "#17542a",
    colorInfo: "#17542a",
    colorSuccess: "#2e7d32",
    colorWarning: "#b7791f",
    colorError: "#c0392b",
    colorLink: "#17542a",
    colorPrimaryBg: "#e6f0e7",
    colorPrimaryBgHover: "#d6e7d8",
    colorPrimaryBorder: "#9cc3a4",
    colorPrimaryBorderHover: "#5da06a",
    controlItemBgActive: "#e6f0e7",
    controlItemBgHover: "#f1f6f1",
    colorText: "#1d261d",
    colorTextSecondary: "#5b665a",
    colorTextTertiary: "#8a958a",
    colorBorder: "#d6ddd4",
    colorBorderSecondary: "#e6eae4",
    colorBgLayout: "#f4f6f2",
    colorBgContainer: "#ffffff",
    borderRadius: 10,
    borderRadiusLG: 14,
    borderRadiusSM: 8,
    fontFamily: FONT_SANS,
    fontSize: 14,
    controlHeight: 38,
    controlHeightLG: 44,
    wireframe: false,
  },
  components: {
    Button: {
      fontWeight: 500,
      primaryShadow: "none",
      defaultShadow: "none",
      dangerShadow: "none",
      defaultBorderColor: "#d6ddd4",
      defaultColor: "#1d261d",
      colorPrimaryHover: "#226a36",
      colorPrimaryActive: "#0f4220",
    },
    Table: {
      headerBg: "#eff4ee",
      headerColor: "#243324",
      headerSplitColor: "transparent",
      rowHoverBg: "#f6f9f5",
      borderColor: "#e6eae4",
      headerBorderRadius: 12,
    },
    Card: {
      headerFontSize: 16,
      colorBorderSecondary: "#e6eae4",
    },
    Tabs: {
      inkBarColor: "#c4a747",
      itemSelectedColor: "#0b3d0b",
      itemHoverColor: "#226a36",
      itemColor: "#5b665a",
      titleFontSize: 15,
    },
    Menu: {
      darkItemBg: "transparent",
      darkSubMenuItemBg: "rgba(0, 0, 0, 0.18)",
      darkItemColor: "rgba(255, 255, 255, 0.78)",
      darkItemHoverBg: "rgba(224, 208, 133, 0.10)",
      darkItemHoverColor: "#ffffff",
      darkItemSelectedBg: "rgba(224, 208, 133, 0.16)",
      darkItemSelectedColor: "#e0d085",
      itemBorderRadius: 10,
    },
    Modal: { titleFontSize: 18 },
    Tag: { borderRadiusSM: 999 },
    Select: { optionSelectedBg: "#e0eee1" },
    DatePicker: { cellHoverBg: "#e0eee1" },
    Input: { activeShadow: "0 0 0 3px rgba(23, 84, 42, 0.12)" },
  },
};

export default antdTheme;
