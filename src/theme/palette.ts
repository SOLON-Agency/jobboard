export const lightPalette = {
  primary: {
    main: "#03170C",
    light: "#0f4024",
    dark: "#010c07",
    contrastText: "#F0EBD8",
  },
  secondary: {
    main: "#3E5C76",
    light: "#748CAB",
    dark: "#2c4357",
    contrastText: "#F0EBD8",
  },
  error: {
    main: "#c0392b",
    contrastText: "#ffffff",
  },
  warning: {
    main: "#a0882a",
    contrastText: "#ffffff",
  },
  success: {
    main: "#2d6a4f",
    contrastText: "#ffffff",
  },
  info: {
    main: "#3E5C76",
    contrastText: "#F0EBD8",
  },
  background: {
    default: "#F5F2EA",
    paper: "#FFFEFB",
  },
  text: {
    primary: "#03170C",
    secondary: "#3E5C76",
    disabled: "#748CAB",
  },
  divider: "rgba(3, 23, 12, 0.1)",
} as const;

/** Shared brand gradients — import where hardcoded hex is required */
export const brandGradient = "linear-gradient(135deg, #03170C 0%, #3E5C76 100%)";
export const brandGradientDark = "linear-gradient(135deg, #748CAB 0%, #c3ae61 100%)";
export const accentGold = "#c3ae61";
export const accentGoldLight = "#d7c996";
export const cream = "#F0EBD8";
