import { useCallback, useEffect, useState } from 'react';
import { Outlet, useNavigate, useSearchParams } from 'react-router';
import { Keyboard } from 'lucide-react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Button } from '@/components/ui/button';
import { QuickAddModal } from '@/components/QuickAddModal';
import { KeyboardShortcutsDialog } from '@/components/KeyboardShortcutsDialog';
import { OPEN_QUICK_ADD_EVENT, useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';

/**
 * Layout component - Root layout route for the application.
 * Renders child routes via <Outlet /> and provides the sidebar/header shell.
 */
export function Layout() {
  const navigate = useNavigate();
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const openQuickAdd = useCallback(() => setShowQuickAdd(true), []);
  const openShortcuts = useCallback(() => setShowShortcuts(true), []);
  const handleNavigate = useCallback((path: string) => navigate(path), [navigate]);
  const handleToggleFocus = useCallback(() => {
    setSearchParams(prev => {
      if (prev.get('focus') === '1') prev.delete('focus');
      else prev.set('focus', '1');
      return prev;
    });
  }, [setSearchParams]);

  useKeyboardShortcuts({
    onQuickAdd: openQuickAdd,
    onHelp: openShortcuts,
    onNavigate: handleNavigate,
    onToggleFocus: handleToggleFocus,
  });

  useEffect(() => {
    window.addEventListener(OPEN_QUICK_ADD_EVENT, openQuickAdd);
    return () => window.removeEventListener(OPEN_QUICK_ADD_EVENT, openQuickAdd);
  }, [openQuickAdd]);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="flex h-14 items-center justify-between border-b px-4">
            <SidebarTrigger />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground"
              onClick={() => setShowShortcuts(true)}
            >
              <Keyboard className="h-4 w-4" />
              Shortcuts
            </Button>
          </header>
          <main className="flex-1 p-6">
            <Outlet />
          </main>
          <QuickAddModal open={showQuickAdd} onOpenChange={setShowQuickAdd} />
          <KeyboardShortcutsDialog open={showShortcuts} onOpenChange={setShowShortcuts} />
        </div>
      </div>
    </SidebarProvider>
  );
}
