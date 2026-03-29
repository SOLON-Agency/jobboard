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
        background: "linear-gradient(135deg, #03170C 0%, #3E5C76 100%)",
        boxShadow: "0 2px 8px rgba(3, 23, 12, 0.3)",
        color: "#F0EBD8",
        "&:hover": {
          background: "linear-gradient(135deg, #0f4024 0%, #4d6e8a 100%)",
          boxShadow: "0 4px 16px rgba(3, 23, 12, 0.4)",
        },
      },
      containedSecondary: {
        background: "#3E5C76",
        color: "#F0EBD8",
        "&:hover": {
          background: "#4d6e8a",
        },
      },
      outlined: {
        borderColor: "rgba(3, 23, 12, 0.22)",
        "&:hover": {
          borderColor: "#3E5C76",
          backgroundColor: "rgba(62, 92, 118, 0.05)",
        },
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 16,
        border: "1px solid rgba(3, 23, 12, 0.1)",
        backgroundImage: "none",
        transition: "border-color 0.2s ease, box-shadow 0.2s ease",
        "&:hover": {
          borderColor: "rgba(62, 92, 118, 0.4)",
          boxShadow: "0 4px 20px rgba(3, 23, 12, 0.08)",
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
        borderColor: "rgba(62, 92, 118, 0.3)",
      },
    },
  },
  MuiTextField: {
    styleOverrides: {
      root: {
        "& .MuiOutlinedInput-root": {
          borderRadius: 8,
          "& fieldset": {
            borderColor: "rgba(3, 23, 12, 0.15)",
          },
          "&:hover fieldset": {
            borderColor: "#748CAB",
          },
          "&.Mui-focused fieldset": {
            borderColor: "#3E5C76",
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
        backgroundColor: "rgba(245, 242, 234, 0.88)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(3, 23, 12, 0.08)",
        boxShadow: "0 1px 3px rgba(3,23,12,0.05)",
        color: "#03170C",
      },
    },
  },
  MuiDrawer: {
    styleOverrides: {
      paper: {
        borderRight: "1px solid rgba(3, 23, 12, 0.08)",
      },
    },
  },
  MuiDivider: {
    styleOverrides: {
      root: {
        borderColor: "rgba(3, 23, 12, 0.1)",
      },
    },
  },
  MuiSelect: {
    styleOverrides: {
      outlined: {
        "& .MuiOutlinedInput-notchedOutline": {
          borderColor: "rgba(3, 23, 12, 0.15)",
        },
        "&:hover .MuiOutlinedInput-notchedOutline": {
          borderColor: "#748CAB",
        },
        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
          borderColor: "#3E5C76",
        },
      },
    },
  },
};
