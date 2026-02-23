import { useSearchParams } from 'react-router';
import { LayoutGrid, List, Calendar, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { monitoringStore } from '@/monitoring/monitoring-store';

type ViewMode = 'matrix' | 'list' | 'today';

export function ViewSwitcher() {
  const [searchParams, setSearchParams] = useSearchParams();
  const view = (searchParams.get('view') as ViewMode) || 'matrix';
  const focusMode = searchParams.get('focus') === '1';

  const setView = (v: ViewMode) => {
    monitoringStore.addLog('view:switch', { to: v });
    setSearchParams(prev => {
      prev.set('view', v);
      return prev;
    });
  };

  const toggleFocus = () => {
    monitoringStore.addLog('focus:toggle', { active: !focusMode });
    setSearchParams(prev => {
      if (focusMode) {
        prev.delete('focus');
      } else {
        prev.set('focus', '1');
      }
      return prev;
    });
  };

  return (
    <div className="mb-6 flex items-center justify-between">
      {/* View Tabs */}
      <div className="flex items-center gap-1 rounded-lg bg-muted/50 p-1">
        <button
          onClick={() => setView('matrix')}
          className={cn(
            'flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all',
            view === 'matrix' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <LayoutGrid className="h-3.5 w-3.5" />
          Matrix
        </button>
        <button
          onClick={() => setView('list')}
          className={cn(
            'flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all',
            view === 'list' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <List className="h-4 w-4" />
          List
        </button>
        <button
          onClick={() => setView('today')}
          className={cn(
            'flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all',
            view === 'today' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Calendar className="h-3.5 w-3.5" />
          Today
        </button>
      </div>

      {/* Focus Mode Toggle */}
      {view === 'matrix' && (
        <Button
          variant="outline"
          size="sm"
          onClick={toggleFocus}
          className={cn(
            'gap-2 text-xs uppercase tracking-widest font-semibold transition-colors',
            focusMode 
              ? 'border-red-500/30 bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-500' 
              : 'text-muted-foreground'
          )}
        >
          <Sparkles className={cn("h-3.5 w-3.5", focusMode ? "text-red-500" : "")} />
          Focus Mode
        </Button>
      )}
    </div>
  );
}
