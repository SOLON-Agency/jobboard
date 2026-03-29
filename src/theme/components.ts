import type { Components, Theme } from "@mui/material/styles";

export const components: Components<Theme> = {
  MuiCssBaseline: {
    styleOverrides: {
      body: {
        scrollbarWidth: "thin",
      },
    },
  },
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        textTransform: "none",
        fontWeight: 600,
        letterSpacing: "0.02em",
      },
      containedPrimary: {
        background: "linear-gradient(135deg, #00c2d1 0%, #7b2ff7 100%)",
        boxShadow: "0 2px 8px rgba(0, 194, 209, 0.25)",
        color: "#ffffff",
        "&:hover": {
          background: "linear-gradient(135deg, #33d4e0 0%, #a66bfa 100%)",
          boxShadow: "0 4px 16px rgba(0, 194, 209, 0.35)",
        },
      },
      outlined: {
        borderColor: "rgba(15, 23, 42, 0.2)",
        "&:hover": {
          borderColor: "#00c2d1",
          backgroundColor: "rgba(0, 194, 209, 0.04)",
        },
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 16,
        border: "1px solid rgba(15, 23, 42, 0.12)",
        backgroundImage: "none",
        transition: "border-color 0.2s ease, box-shadow 0.2s ease",
        "&:hover": {
          borderColor: "rgba(0, 194, 209, 0.3)",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.06)",
        },
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: 6,
        fontWeight: 500,
        fontSize: "0.75rem",
      },
      outlined: {
        borderColor: "rgba(15, 23, 42, 0.25)",
      },
    },
  },
  MuiTextField: {
    styleOverrides: {
      root: {
        "& .MuiOutlinedInput-root": {
          borderRadius: 8,
          "& fieldset": {
            borderColor: "rgba(15, 23, 42, 0.12)",
          },
          "&:hover fieldset": {
            borderColor: "#009aa6",
          },
          "&.Mui-focused fieldset": {
            borderColor: "#00c2d1",
          },
        },
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        backgroundImage: "none",
      },
    },
  },
  MuiAppBar: {
    styleOverrides: {
      root: {
        backgroundColor: "rgba(248, 250, 252, 0.85)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(15, 23, 42, 0.06)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        color: "#0f172a",
      },
    },
  },
  MuiDrawer: {
    styleOverrides: {
      paper: {
        borderRight: "1px solid rgba(15, 23, 42, 0.06)",
      },
    },
  },
  MuiDivider: {
    styleOverrides: {
      root: {
        borderColor: "rgba(15, 23, 42, 0.08)",
      },
    },
  },
};
