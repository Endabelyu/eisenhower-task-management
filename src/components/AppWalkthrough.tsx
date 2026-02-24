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
              description: 'This is the main navigation menu where you can access your dashboard, settings, and more.',
              side: 'right',
              align: 'start'
            }
          },
          {
            element: '#tour-header',
            popover: {
              title: 'Your Dashboard',
              description: 'Here you have an overview of all your tasks and priorities.',
              side: 'bottom',
              align: 'start'
            }
          },
          {
            element: '#tour-add-task',
            popover: {
              title: 'Add a Task',
              description: 'Click here or press "N" anytime to quickly add a new task.',
              side: 'left',
              align: 'start'
            }
          },
          {
            element: '#tour-stats',
            popover: {
              title: 'Quick Stats',
              description: 'Keep track of your total, completed, and overdue tasks at a single glance.',
              side: 'bottom',
              align: 'center'
            }
          },
          {
            element: '#tour-views',
            popover: {
              title: 'Switch Views',
              description: 'Easily toggle between the Matrix, List, or Today view to focus on what matters.',
              side: 'bottom',
              align: 'start'
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
