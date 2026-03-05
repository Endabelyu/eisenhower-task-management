import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { driver, type DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';

const TOUR_STEPS: Record<string, DriveStep[]> = {
  dashboard: [
    { element: '#tour-sidebar', popover: { title: 'Welcome to Eisenhower Matrix!', description: 'This is your main navigation hub. From here, you can access your unified Dashboard, All Tasks list, Daily Focus mode, and Settings.', side: 'right', align: 'start' } },
    { element: '#tour-header', popover: { title: 'The Dashboard', description: 'Your command center. The Eisenhower Matrix helps you decide on and prioritize tasks by urgency and importance, sorting out less urgent and important tasks which you should either delegate or not do at all.', side: 'bottom', align: 'start' } },
    { element: '#tour-add-task', popover: { title: 'Capture Thoughts Quickly', description: 'Click here or press "N" on your keyboard anytime to add a new task before you forget it.', side: 'left', align: 'start' } },
    { element: '#tour-quadrant-do', popover: { title: '"Do First" Quadrant', description: 'Tasks here are both Urgent and Important. These are your top priorities that require immediate attention. Do them today.', side: 'right', align: 'start' } },
    { element: '#tour-quadrant-schedule', popover: { title: 'Drag & Drop Reprioritization', description: 'This is the "Schedule" quadrant (Important, Not Urgent). You can drag and drop tasks freely between any of the four quadrants as their priorities shift.', side: 'left', align: 'start' } },
    { element: '#tour-focus-mode', popover: { title: 'Eliminate Distractions', description: 'Click "Focus Mode" to hide the bottom two quadrants (Delegate & Hold). This keeps your screen completely focused on what truly matters right now.', side: 'bottom', align: 'center' } },
    { element: '#tour-views', popover: { title: 'Change Your Perspective', description: 'Not in a Matrix mood? Switch to the List view for a traditional checklist, or the Today panel to see your upcoming schedule.', side: 'bottom', align: 'start' } },
    { element: '#tour-stats', popover: { title: 'Track Your Progress', description: 'Watch your completion rate rise! This summary strip gives you a real-time glance at your productivity and highlights any overdue tasks.', side: 'top', align: 'center' } },
    { element: '#tour-media', popover: { title: 'Background Ambiance', description: 'Need to focus? Use the floating media menu down here to access Lofi Radio stations or optionally link your Spotify account in Settings.', side: 'top', align: 'end' } }
  ],
  daily: [
    { element: '#tour-daily-budget', popover: { title: 'Time Budget', description: 'This calculates the total estimated minutes of your top tasks so you know exactly how much work is ahead.', side: 'bottom', align: 'start' } },
    { element: '#tour-daily-count', popover: { title: 'Focus Count', description: 'Limit how many top priority tasks are pulled from the matrix. Keep it small to avoid overwhelm!', side: 'bottom', align: 'start' } },
    { element: '#tour-daily-pomodoro', popover: { title: 'Pomodoro Timer', description: 'Start the timer to begin deep work. Your sessions are automatically tracked.', side: 'bottom', align: 'start' } },
    { element: '#tour-daily-tasks', popover: { title: 'Ranked Priorities', description: 'These are your absolute highest priority tasks, dynamically ranked by our smart urgency scoring algorithm.', side: 'top', align: 'start' } }
  ],
  settings: [
    { element: '#tour-settings-account', popover: { title: 'Account Hub', description: 'Manage your user profile and securely sign out right here.', side: 'bottom', align: 'start' } },
    { element: '#tour-settings-appearance', popover: { title: 'Personalize UI', description: 'Change color palettes and app language to perfectly suit your style.', side: 'top', align: 'start' } },
    { element: '#tour-settings-pomodoro', popover: { title: 'Configure Focus', description: 'Set your default Pomodoro focus and break lengths here. The default recommendation is 25 minutes.', side: 'top', align: 'start' } },
    { element: '#tour-settings-feedback', popover: { title: 'We Listen!', description: 'Found a bug or have a suggestion? Send an email directly to the developer team.', side: 'top', align: 'start' } }
  ]
};

export function AppWalkthrough() {
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!user) return;

    // Convert route to logical key
    const pathKey = location.pathname === '/' ? 'dashboard' : location.pathname.substring(1).replace(/\//g, '_');
    
    // Safety check if we have a tour defined for this view
    if (!TOUR_STEPS[pathKey]) return;

    // We'll track per-page tours via localStorage to prevent massive lag from repetitive metadata syncs
    const storageKey = `tour_${user.id}_${pathKey}`;
    const hasSeenTourLocally = localStorage.getItem(storageKey);

    // Backward compatibility for old "has_seen_tour" boolean for the dashboard
    if (pathKey === 'dashboard' && user.user_metadata?.has_seen_tour && !hasSeenTourLocally) {
       localStorage.setItem(storageKey, 'true');
       return;
    }

    if (hasSeenTourLocally) return;

    const steps = TOUR_STEPS[pathKey];

    const tourDriver = driver({
      showProgress: true,
      animate: true,
      steps,
      onDestroyed: async () => {
        // Mark as seen locally
        localStorage.setItem(storageKey, 'true');
        
        // Still sync the master dashboard tour to Supabase so it stops triggering on new devices
        if (pathKey === 'dashboard' && !user.user_metadata?.has_seen_tour) {
          try {
            await supabase.auth.updateUser({
              data: { has_seen_tour: true }
            });
          } catch (error) {
            console.error('Failed to update walkthrough status:', error);
          }
        }
      }
    });

    // Wait a chunk longer (800ms) to ensure the DOM elements and animations are fully mounted before targeting
    const timeoutId = setTimeout(() => {
      // Validate that at least the first intended element is genuinely on screen before launching
      const firstElement = document.querySelector(steps[0].element as string);
      if (firstElement) {
        tourDriver.drive();
      }
    }, 800);

    return () => clearTimeout(timeoutId);

  }, [user, location.pathname]);

  return null;
}
