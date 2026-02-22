import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { createBrowserRouter, RouterProvider } from "react-router";
import { TaskProvider } from "@/context/TaskContext";
import { Layout } from "@/components/Layout";
import Index from "./pages/Index";
import TaskList from "./pages/TaskList";
import DailyFocus from "./pages/DailyFocus";
import Stats from "./pages/Stats";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

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
 * - RouterProvider: React Router v7 data router.
 * - TaskProvider: For global task management state (wrapped inside Layout).
 */
const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <TaskProvider>
          <RouterProvider router={router} />
        </TaskProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
