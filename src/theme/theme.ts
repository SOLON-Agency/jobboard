import { createTheme } from "@mui/material/styles";
import { lightPalette } from "./palette";
import { components } from "./components";

const typography = {
  fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  h1: { fontSize: "3rem", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.15 },
  h2: { fontSize: "2.25rem", fontWeight: 700, letterSpacing: "-0.01em", lineHeight: 1.2 },
  h3: { fontSize: "1.5rem", fontWeight: 700, lineHeight: 1.3 },
  h4: { fontSize: "1.25rem", fontWeight: 600, lineHeight: 1.4 },
  h5: { fontSize: "1rem", fontWeight: 600, lineHeight: 1.5 },
  h6: { fontSize: "0.875rem", fontWeight: 600, lineHeight: 1.5 },
  body1: { fontSize: "1rem", lineHeight: 1.7 },
  body2: { fontSize: "0.875rem", lineHeight: 1.6 },
  button: { textTransform: "none" as const, fontWeight: 600 },
};

const shape = { borderRadius: 8 };

export const theme = createTheme({
  palette: {
    mode: "light",
    ...lightPalette,
  },
  typography,
  shape,
  components,
});
