import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { createBrowserRouter, RouterProvider } from "react-router";
import { TaskProvider } from "@/context/TaskContext";
import { Layout } from "@/components/Layout";
import { ErrorBoundary } from "@/monitoring/ErrorBoundary";
import Index from "./pages/Index";
import TaskList from "./pages/TaskList";
import DailyFocus from "./pages/DailyFocus";
import Stats from "./pages/Stats";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

// Only include MonitoringPanel in dev — tree-shaken out of production builds
import { MonitoringPanel } from "@/monitoring/MonitoringPanel";

const queryClient = new QueryClient();

/**
 * Route tree — Layout acts as the root layout route, rendering child
 * pages via <Outlet /> so all pages share the sidebar and header.
 */
const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: "/", element: <Index /> },
      { path: "/tasks", element: <TaskList /> },
      { path: "/daily", element: <DailyFocus /> },
      { path: "/stats", element: <Stats /> },
      { path: "/settings", element: <Settings /> },
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
const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <ErrorBoundary>
          <TaskProvider>
            <RouterProvider router={router} />
          </TaskProvider>
        </ErrorBoundary>
        {import.meta.env.DEV && <MonitoringPanel />}
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
