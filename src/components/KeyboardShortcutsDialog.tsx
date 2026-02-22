import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SHORTCUTS = [
  { keys: ['Ctrl', 'N'], description: 'Open Quick Add task modal' },
  { keys: ['Ctrl', '/'], description: 'Open keyboard shortcuts help' },
  { keys: ['1'], description: 'Go to Dashboard' },
  { keys: ['2'], description: 'Go to All Tasks' },
  { keys: ['3'], description: 'Go to Daily Focus' },
  { keys: ['4'], description: 'Go to Stats' },
];

/**
 * Displays the available global keyboard shortcuts.
 */
export function KeyboardShortcutsDialog({ open, onOpenChange }: KeyboardShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Shortcuts work globally except while typing in input fields.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2.5">
          {SHORTCUTS.map((shortcut) => (
            <div key={shortcut.description} className="flex items-center justify-between rounded-md border px-3 py-2">
              <span className="text-sm text-muted-foreground">{shortcut.description}</span>
              <span className="flex items-center gap-1.5">
                {shortcut.keys.map((key) => (
                  <kbd key={key} className="rounded border bg-muted px-1.5 py-0.5 text-xs font-semibold">
                    {key}
                  </kbd>
                ))}
              </span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
