/**
 * ConnectWalletModal - Stub Implementation
 *
 * Wallet connection is disabled in local-first mode.
 * This stub maintains API compatibility for future reconnection.
 *
 * To re-enable wallet connection:
 * 1. Set FEATURE_FLAGS.WALLET_CONNECTION = true
 * 2. Restore wallet connector imports from src/arweave/services/wallets
 * 3. Implement the full wallet selection UI
 */

import type { ArNSWalletConnector } from '@/shared/types/wallet';

interface ConnectWalletModalProps {
  open: boolean;
  onClose: () => void;
  onConnect: (connector: ArNSWalletConnector, address: string) => void;
}

/**
 * Stub wallet connect modal
 * Returns null since wallet connection is disabled
 */
export function ConnectWalletModal({ open, onClose }: ConnectWalletModalProps) {
  // Wallet connection is disabled in local-first mode
  // This component exists for API compatibility only

  if (!open) return null;

  // If somehow opened, just close immediately
  if (open) {
    console.log('[ConnectWalletModal] Wallet connection disabled in local-first mode');
    onClose();
  }

  return null;
}
