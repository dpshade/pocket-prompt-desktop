/**
 * PublicPromptView - Stub Implementation
 *
 * Arweave public prompt viewing is disabled in local-first mode.
 * This stub shows a message directing users to use Turso sharing instead.
 *
 * To re-enable Arweave public prompts:
 * 1. Set FEATURE_FLAGS.ARWEAVE_ENABLED = true
 * 2. Restore full implementation from src/arweave/frontend/components/prompts/PublicPromptView.tsx
 */

import { ArrowLeft } from 'lucide-react';
import { Button } from '@/frontend/components/ui/button';

interface PublicPromptViewProps {
  txId: string;
  onBack: () => void;
}

export function PublicPromptView({ txId, onBack }: PublicPromptViewProps) {
  return (
    <div className="h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-md text-center space-y-6">
        <img src="/logo.svg" alt="Pocket Prompt Logo" className="h-16 w-16 mx-auto opacity-50" />

        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Public Prompts Unavailable</h1>
          <p className="text-muted-foreground">
            Arweave public prompt viewing is currently disabled.
            This feature will be available in a future update.
          </p>
        </div>

        <div className="text-xs text-muted-foreground bg-muted/30 rounded-md p-3 font-mono">
          Transaction ID: {txId}
        </div>

        <Button onClick={onBack} variant="outline" className="w-full">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    </div>
  );
}
