import { useLocation } from 'react-router';
import { NavLink } from '@/components/NavLink';
import { LayoutGrid, ListTodo, Zap, Plus, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OPEN_QUICK_ADD_EVENT } from '@/hooks/use-keyboard-shortcuts';

const navItems = [
  { title: 'Matrix', url: '/', icon: LayoutGrid },
  { title: 'List', url: '/tasks', icon: ListTodo },
  { title: 'Add', action: 'add', icon: Plus },
  { title: 'Focus', url: '/daily', icon: Zap },
  { title: 'Config', url: '/settings', icon: Settings },
];

export function MobileBottomNav() {
  const location = useLocation();

  const handleQuickAdd = () => {
    window.dispatchEvent(new CustomEvent(OPEN_QUICK_ADD_EVENT));
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-[72px] w-full items-center justify-around border-t bg-background px-2 pb-safe md:hidden shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
      {navItems.map((item) => {
        if (item.action === 'add') {
          return (
            <button
              key="add-btn"
              onClick={handleQuickAdd}
              type="button"
              className="group -mt-8 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95"
            >
              <item.icon className="h-7 w-7 transition-transform group-hover:rotate-90" />
            </button>
          );
        }

        const isActive = location.pathname === item.url;
        
        return (
          <NavLink
            key={item.url}
            to={item.url || '/'}
            end={item.url === '/'}
            className={cn(
              "flex flex-col items-center justify-center gap-1.5 w-16 h-full transition-colors",
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon className={cn("h-6 w-6", isActive && "fill-primary/20")} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[11px] font-medium">{item.title}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
