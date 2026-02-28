import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { createBrowserRouter, RouterProvider } from "react-router";
import { TaskProvider } from "@/context/TaskContext";
import { Layout } from "@/components/Layout";
import { lazy, Suspense, useEffect } from "react";
import { ErrorBoundary } from "@/monitoring/ErrorBoundary";
import { applyColorPalette, getStoredColorPalette } from "@/lib/color-palette";

// Lazy-loaded routes for code splitting
const Index = lazy(() => import("./pages/Index"));
const TaskList = lazy(() => import("./pages/TaskList"));
const DailyFocus = lazy(() => import("./pages/DailyFocus"));
const Stats = lazy(() => import("./pages/Stats"));
const Settings = lazy(() => import("./pages/Settings"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Login = lazy(() => import("./pages/Login"));
const SpotifyCallback = lazy(() => import("./pages/SpotifyCallback"));

import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SpotifyPlayer } from "@/components/SpotifyPlayer";
import { RadioPlayer } from "@/components/RadioPlayer";
import { PomodoroProvider } from "@/context/PomodoroContext";
import { SpotifyProvider } from "@/context/SpotifyContext";
import { LanguageProvider } from "@/context/LanguageContext";

// Only include MonitoringPanel in dev — tree-shaken out of production builds
import { MonitoringPanel } from "@/monitoring/MonitoringPanel";

const queryClient = new QueryClient();

/**
 * Route tree — Layout acts as the root layout route, rendering child
 * pages via <Outlet /> so all pages share the sidebar and header.
 */
const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { path: "/", element: <Index /> },
      { path: "/tasks", element: <TaskList /> },
      { path: "/daily", element: <DailyFocus /> },
      { path: "/stats", element: <Stats /> },
      { path: "/settings", element: <Settings /> },
      { path: "/callback", element: <SpotifyCallback /> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

/**
 * Main Application Component.
 * Sets up global providers:
 * - QueryClientProvider: For data fetching and caching.
 * - TooltipProvider: For accessible tooltips.
 * - ErrorBoundary: Catches render errors globally.
 * - RouterProvider: React Router v7 data router.
 * - TaskProvider: For global task management state.
 * - MonitoringPanel: Dev-only floating diagnostic panel (guarded by import.meta.env.DEV).
 */
const App = () => {
  useEffect(() => {
    applyColorPalette(getStoredColorPalette());
  }, []);

  return (
    <LanguageProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <ErrorBoundary>
              <AuthProvider>
                <SpotifyProvider>
                  <PomodoroProvider>
                    <TaskProvider>
                      <Suspense fallback={<div className="flex h-screen w-screen items-center justify-center bg-background"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>}>
                        <RouterProvider router={router} />
                      </Suspense>
                    </TaskProvider>
                  </PomodoroProvider>
                  <SpotifyPlayer />
                  <RadioPlayer />
                </SpotifyProvider>
              </AuthProvider>
            </ErrorBoundary>
            {import.meta.env.DEV && <MonitoringPanel />}
          </TooltipProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
};

export default App;
