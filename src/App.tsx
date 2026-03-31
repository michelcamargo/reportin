import { createBrowserRouter, RouterProvider, Outlet, useLocation, useNavigate, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { Box, BottomNavigation, BottomNavigationAction, Paper } from "@mui/material";
import ArticleIcon from "@mui/icons-material/Article";
import HistoryIcon from "@mui/icons-material/History";
import SettingsIcon from "@mui/icons-material/Settings";
import { HomePage } from "./pages/HomePage";
import { HistoryPage } from "./pages/HistoryPage";
import { SettingsPage } from "./pages/SettingsPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { listReports, getItem, sendViaWebhook, updateReportStatus } from "./services";
import { STORAGE_KEYS } from "./constants/storage-keys";
import type { AppSettings } from "./types/report";

const NAV_ROUTES = ["/", "/history", "/settings"];

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentIndex = NAV_ROUTES.indexOf(location.pathname) ?? 0;

  useEffect(() => {
    const syncPending = async () => {
      // Return if no browser connection is visible initially, though occasionally unreliable
      if (typeof navigator !== "undefined" && !navigator.onLine) return;

      try {
        const reports = await listReports();
        const pending = reports.filter((r) => r.status === "pending");
        if (pending.length === 0) return;

        const settings = await getItem<AppSettings>(STORAGE_KEYS.SETTINGS);
        if (!settings?.senderWebhookUrl || !settings?.recipient) return;

        for (const report of pending) {
          try {
            await sendViaWebhook(settings.senderWebhookUrl, report, settings);
            await updateReportStatus(report.id, "sent");
          } catch (err) {
            console.error("Sync Error: Failed to resend report", report.id, err);
          }
        }
      } catch (err) {
        console.error("Sync Setup Error:", err);
      }
    };

    syncPending();
    window.addEventListener("online", syncPending);
    return () => window.removeEventListener("online", syncPending);
  }, []);

  return (
    <Box>
      <Box
        component="main"
        sx={{
          p: 2,
          pt: 3,
          pb: 10,
          maxWidth: 600,
          width: "100%",
          mx: "auto",
        }}
      >
        <Outlet />
      </Box>

      <Paper
        elevation={8}
        sx={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100 }}
      >
        <BottomNavigation
          value={currentIndex === -1 ? 0 : currentIndex}
          onChange={(_, newValue) => navigate(NAV_ROUTES[newValue])}
          showLabels
        >
          <BottomNavigationAction label="Laudo" icon={<ArticleIcon />} />
          <BottomNavigationAction label="Histórico" icon={<HistoryIcon />} />
          <BottomNavigationAction label="Configurações" icon={<SettingsIcon />} />
        </BottomNavigation>
      </Paper>
    </Box>
  );
}

const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    path: "/",
    element: (
      <PrivateRoute>
        <AppLayout />
      </PrivateRoute>
    ),
    children: [
      { index: true, element: <HomePage /> },
      { path: "history", element: <HistoryPage /> },
      { path: "settings", element: <SettingsPage /> },
    ],
  },
]);

export function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
