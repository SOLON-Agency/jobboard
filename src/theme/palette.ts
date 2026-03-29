export const sharedPalette = {
  primary: {
    main: "#00c2d1",
    light: "#33d4e0",
    dark: "#009aa6",
    contrastText: "#ffffff",
  },
  secondary: {
    main: "#7b2ff7",
    light: "#a66bfa",
    dark: "#5a1db8",
    contrastText: "#ffffff",
  },
  error: {
    main: "#ef4444",
  },
  warning: {
    main: "#f59e0b",
  },
  success: {
    main: "#10b981",
  },
  info: {
    main: "#3b82f6",
  },
} as const;

export const darkPalette = {
  ...sharedPalette,
  primary: {
    main: "#00f0ff",
    light: "#67f7ff",
    dark: "#00b8c4",
    contrastText: "#0a0e1a",
  },
  background: {
    default: "#0a0e1a",
    paper: "#111827",
  },
  text: {
    primary: "#e2e8f0",
    secondary: "#94a3b8",
    disabled: "#475569",
  },
  divider: "rgba(226, 232, 240, 0.08)",
} as const;

export const lightPalette = {
  ...sharedPalette,
  background: {
    default: "#f8fafc",
    paper: "#ffffff",
  },
  text: {
    primary: "#0f172a",
    secondary: "#475569",
    disabled: "#94a3b8",
  },
  divider: "rgba(15, 23, 42, 0.08)",
} as const;
