import { createTheme } from "@mui/material/styles";

const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

export const theme = createTheme({
  palette: {
    mode: systemPrefersDark ? "dark" : "light",
    primary: {
      main: "#2196f3",
    },
    secondary: {
      main: "#ff6d00",
    },
    background: {
      default: systemPrefersDark ? "#0f1117" : "#f5f7fa",
      paper: systemPrefersDark ? "#1a1d27" : "#ffffff",
    },
  },
  typography: {
    fontFamily: "'Inter', 'Roboto', sans-serif",
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          borderRadius: 10,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
  },
});
