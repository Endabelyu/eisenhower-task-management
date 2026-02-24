import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

export function AppWalkthrough() {
  const { user } = useAuth();

  useEffect(() => {
    // Only run if user exists and hasn't seen the tour yet
    if (user && !user.user_metadata?.has_seen_tour) {
      const tourDriver = driver({
        showProgress: true,
        animate: true,
        steps: [
          {
            element: '#tour-sidebar',
            popover: {
              title: 'Welcome to Eisenhower Matrix!',
              description: 'This is your main navigation hub. From here, you can access your unified Dashboard, All Tasks list, Daily Focus mode, and Settings.',
              side: 'right',
              align: 'start'
            }
          },
          {
            element: '#tour-header',
            popover: {
              title: 'The Dashboard',
              description: 'Your command center. The Eisenhower Matrix helps you decide on and prioritize tasks by urgency and importance, sorting out less urgent and important tasks which you should either delegate or not do at all.',
              side: 'bottom',
              align: 'start'
            }
          },
          {
            element: '#tour-add-task',
            popover: {
              title: 'Capture Thoughts Quickly',
              description: 'Click here or press "N" on your keyboard anytime to add a new task before you forget it.',
              side: 'left',
              align: 'start'
            }
          },
          {
            element: '#tour-quadrant-do',
            popover: {
              title: '"Do First" Quadrant',
              description: 'Tasks here are both Urgent and Important. These are your top priorities that require immediate attention. Do them today.',
              side: 'right',
              align: 'start'
            }
          },
          {
            element: '#tour-quadrant-schedule',
            popover: {
              title: 'Drag & Drop Reprioritization',
              description: 'This is the "Schedule" quadrant (Important, Not Urgent). You can drag and drop tasks freely between any of the four quadrants as their priorities shift.',
              side: 'left',
              align: 'start'
            }
          },
          {
            element: '#tour-focus-mode',
            popover: {
              title: 'Eliminate Distractions',
              description: 'Click "Focus Mode" to hide the bottom two quadrants (Delegate & Hold). This keeps your screen completely focused on what truly matters right now.',
              side: 'bottom',
              align: 'center'
            }
          },
          {
            element: '#tour-views',
            popover: {
              title: 'Change Your Perspective',
              description: 'Not in a Matrix mood? Switch to the List view for a traditional checklist, or the Today panel to see your upcoming schedule.',
              side: 'bottom',
              align: 'start'
            }
          },
          {
            element: '#tour-stats',
            popover: {
              title: 'Track Your Progress',
              description: 'Watch your completion rate rise! This summary strip gives you a real-time glance at your productivity and highlights any overdue tasks.',
              side: 'top',
              align: 'center'
            }
          },
        ],
        onDestroyStarted: () => {
          // Confirm before closing? Or just let them close
          // When destroyed/finished, update the database
          if (!tourDriver.hasNextStep()) {
            tourDriver.destroy();
          } else {
             tourDriver.destroy();
          }
        },
        onDestroyed: async () => {
          // Update the metadata so the user doesn't see this again
          try {
            await supabase.auth.updateUser({
              data: {
                has_seen_tour: true
              }
            });
          } catch (error) {
            console.error('Failed to update walkthrough status:', error);
          }
        }
      });

      // Give the UI a brief moment to finish rendering
      setTimeout(() => {
        tourDriver.drive();
      }, 500);
    }
  }, [user]);

  return null; // This is a logic-only component that mounts the driver.js UI globally
}
