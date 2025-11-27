import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody } from '@/frontend/components/ui/dialog';
import { Keyboard } from 'lucide-react';

interface HotkeysDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Hotkey {
  keys: string[];
  description: string;
}

interface HotkeySection {
  title: string;
  hotkeys: Hotkey[];
}

const hotkeysSections: HotkeySection[] = [
  {
    title: 'Search',
    hotkeys: [
      { keys: ['/'], description: 'Focus search' },
      { keys: ['Cmd', 'K'], description: 'Focus search' },
      { keys: ['Tab'], description: 'Accept autocomplete' },
      { keys: ['Esc'], description: 'Clear search / close dialogs' },
    ],
  },
  {
    title: 'Navigation',
    hotkeys: [
      { keys: ['↑', '↓'], description: 'Move up/down' },
      { keys: ['←', '→'], description: 'Move left/right (grid view)' },
      { keys: ['Enter'], description: 'Open selected prompt' },
    ],
  },
  {
    title: 'Actions',
    hotkeys: [
      { keys: ['E'], description: 'Edit prompt' },
      { keys: ['C'], description: 'Copy prompt content' },
      { keys: ['A'], description: 'Archive/restore prompt' },
      { keys: ['?'], description: 'Show this help' },
    ],
  },
];

function KeyBadge({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[1.75rem] h-7 px-2 text-sm font-medium bg-muted rounded-lg shadow-soft">
      {children}
    </kbd>
  );
}

export function HotkeysDialog({ open, onOpenChange }: HotkeysDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        <DialogBody className="pt-0 space-y-6">
          {hotkeysSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                {section.title}
              </h3>
              <div className="space-y-2">
                {section.hotkeys.map((hotkey, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm">{hotkey.description}</span>
                    <div className="flex items-center gap-1">
                      {hotkey.keys.map((key, keyIndex) => (
                        <span key={keyIndex} className="flex items-center gap-1">
                          <KeyBadge>{key}</KeyBadge>
                          {keyIndex < hotkey.keys.length - 1 && (
                            <span className="text-muted-foreground text-xs">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <p className="text-xs text-muted-foreground text-center pt-3">
            Press <KeyBadge>?</KeyBadge> anytime to show this dialog
          </p>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
