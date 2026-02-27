import { LayoutGrid, ListTodo, Zap, BarChart3, Settings, Moon, Sun, ChevronsUpDown, LogOut } from 'lucide-react';
import { useTheme } from 'next-themes';
import { NavLink } from '@/components/NavLink';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from '@/components/ui/sidebar';
import { useLanguage } from '@/context/LanguageContext';
import { TranslationKey } from '@/i18n/dictionaries';

const getNavItems = (): { titleKey: TranslationKey; url: string; icon: any }[] => [
  { titleKey: 'nav.dashboard', url: '/', icon: LayoutGrid },
  { titleKey: 'nav.tasks', url: '/tasks', icon: ListTodo },
  { titleKey: 'nav.focus', url: '/daily', icon: Zap },
  { titleKey: 'nav.stats', url: '/stats', icon: BarChart3 },
  { titleKey: 'nav.settings', url: '/settings', icon: Settings },
];

/**
 * AppSidebar component - Main navigation sidebar for the application.
 * Contains links to the Dashboard, Task List, Daily Focus, and Stats.
 */
export function AppSidebar() {
  const { t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  
  const navItems = getNavItems();

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const userInitials = user?.email?.substring(0, 2).toUpperCase() || 'U';

  return (
    <Sidebar className="hidden md:flex border-r-0" id="tour-sidebar">
      <SidebarHeader className="p-5 pb-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <LayoutGrid className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-base font-bold text-sidebar-primary">EM</h1>
            <p className="text-xs text-sidebar-foreground/60">Task Prioritizer</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/40 text-[10px] uppercase tracking-widest">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.titleKey}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === '/'}
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{t(item.titleKey)}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={cycleTheme}
          className="w-full justify-start gap-3 text-sm text-sidebar-foreground"
        >
          {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          <span>{theme === 'dark' ? t('settings.theme.dark' as any) : theme === 'light' ? t('settings.theme.light' as any) : t('settings.theme.system' as any)}</span>
        </Button>

        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.user_metadata?.avatar_url} alt={user.email || ''} />
                  <AvatarFallback className="rounded-lg bg-primary/10 text-primary">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.user_metadata?.full_name || 'My Account'}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              side="top"
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user.user_metadata?.avatar_url} alt={user.email || ''} />
                    <AvatarFallback className="rounded-lg bg-primary/10 text-primary">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user.user_metadata?.full_name || 'My Account'}</span>
                    <span className="truncate text-xs">{user.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                <span>{t('settings.account.logout' as any)}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
