import type { Components, Theme } from "@mui/material/styles";

export const getComponents = (mode: "light" | "dark"): Components<Theme> => {
  const isDark = mode === "dark";
  const borderAlpha = isDark ? 0.08 : 0.12;
  const hoverBorderAlpha = isDark ? 0.15 : 0.25;

  return {
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
        containedPrimary: isDark
          ? {
              background: "linear-gradient(135deg, #00f0ff 0%, #7b2ff7 100%)",
              boxShadow: "0 0 20px rgba(0, 240, 255, 0.2)",
              color: "#0a0e1a",
              "&:hover": {
                background:
                  "linear-gradient(135deg, #67f7ff 0%, #a66bfa 100%)",
                boxShadow: "0 0 30px rgba(0, 240, 255, 0.33)",
              },
            }
          : {
              background: "linear-gradient(135deg, #00c2d1 0%, #7b2ff7 100%)",
              boxShadow: "0 2px 8px rgba(0, 194, 209, 0.25)",
              color: "#ffffff",
              "&:hover": {
                background:
                  "linear-gradient(135deg, #33d4e0 0%, #a66bfa 100%)",
                boxShadow: "0 4px 16px rgba(0, 194, 209, 0.35)",
              },
            },
        outlined: {
          borderColor: isDark
            ? "rgba(226, 232, 240, 0.15)"
            : "rgba(15, 23, 42, 0.2)",
          "&:hover": {
            borderColor: isDark ? "#00f0ff" : "#00c2d1",
            backgroundColor: isDark
              ? "rgba(0, 240, 255, 0.04)"
              : "rgba(0, 194, 209, 0.04)",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: `1px solid rgba(${isDark ? "226, 232, 240" : "15, 23, 42"}, ${borderAlpha})`,
          backgroundImage: "none",
          transition: "border-color 0.2s ease, box-shadow 0.2s ease",
          "&:hover": {
            borderColor: isDark
              ? "rgba(0, 240, 255, 0.2)"
              : "rgba(0, 194, 209, 0.3)",
            boxShadow: isDark
              ? "0 0 30px rgba(0, 240, 255, 0.05)"
              : "0 4px 20px rgba(0, 0, 0, 0.06)",
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
          borderColor: `rgba(${isDark ? "226, 232, 240" : "15, 23, 42"}, ${hoverBorderAlpha})`,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 8,
            "& fieldset": {
              borderColor: `rgba(${isDark ? "226, 232, 240" : "15, 23, 42"}, ${borderAlpha})`,
            },
            "&:hover fieldset": {
              borderColor: isDark ? "#00b8c4" : "#009aa6",
            },
            "&.Mui-focused fieldset": {
              borderColor: isDark ? "#00f0ff" : "#00c2d1",
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
          backgroundColor: isDark
            ? "rgba(10, 14, 26, 0.8)"
            : "rgba(248, 250, 252, 0.85)",
          backdropFilter: "blur(12px)",
          borderBottom: `1px solid rgba(${isDark ? "226, 232, 240" : "15, 23, 42"}, 0.06)`,
          boxShadow: isDark ? "none" : "0 1px 3px rgba(0,0,0,0.04)",
          color: isDark ? "#e2e8f0" : "#0f172a",
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: `1px solid rgba(${isDark ? "226, 232, 240" : "15, 23, 42"}, 0.06)`,
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: `rgba(${isDark ? "226, 232, 240" : "15, 23, 42"}, 0.08)`,
        },
      },
    },
  };
};
