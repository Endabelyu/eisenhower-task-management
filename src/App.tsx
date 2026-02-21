import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TaskProvider } from "@/context/TaskContext";
import { Layout } from "@/components/Layout";
import Index from "./pages/Index";
import TaskList from "./pages/TaskList";
import DailyFocus from "./pages/DailyFocus";
import Stats from "./pages/Stats";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

/**
 * Main Application Component.
 * Sets up global providers:
 * - QueryClientProvider: For data fetching and caching.
 * - TooltipProvider: For accessible tooltips.
 * - BrowserRouter: For client-side routing.
 * - TaskProvider: For global task management state.
 * - Layout: Provides the sidebar and consistent page structure.
 */
const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <TaskProvider>
            <Layout>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/tasks" element={<TaskList />} />
                <Route path="/daily" element={<DailyFocus />} />
                <Route path="/stats" element={<Stats />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Layout>
          </TaskProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
