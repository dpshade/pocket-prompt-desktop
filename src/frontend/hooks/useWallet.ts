import { create } from 'zustand';
import { getProfile, initializeProfile } from '@/core/storage/cache';
import type { ArNSWalletConnector, WALLET_TYPES } from '@/shared/types/wallet';

interface WalletState {
  address: string | null;
  connected: boolean;
  connecting: boolean;
  error: string | null;
  walletType: WALLET_TYPES | null;
  wallet: ArNSWalletConnector | null;

  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  checkConnection: () => Promise<void>;
  setWallet: (connector: ArNSWalletConnector, address: string, walletType: WALLET_TYPES) => void;
}

/**
 * Wallet hook (stub implementation)
 *
 * Wallet connection is disabled in local-first mode.
 * The app uses device ID for identity instead of wallet addresses.
 * This hook maintains API compatibility for potential future reconnection.
 */
export const useWallet = create<WalletState>((set, get) => ({
  address: null,
  connected: false,
  connecting: false,
  error: null,
  walletType: null,
  wallet: null,

  /**
   * Connect wallet (disabled)
   */
  connect: async () => {
    // Wallet connection disabled - using device ID for identity
    console.log('[useWallet] Wallet connection disabled in local-first mode');
    set({ error: 'Wallet connection is not available in local mode' });
  },

  /**
   * Set wallet connector and address
   * Called by ConnectWalletModal after successful connection
   */
  setWallet: (connector: ArNSWalletConnector, address: string, walletType: WALLET_TYPES) => {
    // Initialize or load profile
    let profile = getProfile();
    if (!profile || profile.address !== address) {
      profile = initializeProfile(address);
    }

    set({
      wallet: connector,
      address,
      connected: true,
      connecting: false,
      error: null,
      walletType,
    });
  },

  /**
   * Disconnect wallet
   */
  disconnect: async () => {
    try {
      const { wallet } = get();

      // Disconnect using the wallet connector if available
      if (wallet) {
        await wallet.disconnect();
      }

      set({
        address: null,
        connected: false,
        error: null,
        wallet: null,
        walletType: null,
      });
    } catch (error) {
      console.error('Disconnect error:', error);
      set({
        address: null,
        connected: false,
        wallet: null,
        walletType: null,
      });
    }
  },

  /**
   * Check for existing connection (no-op in local mode)
   */
  checkConnection: async () => {
    // Wallet connection disabled - using device ID for identity
    console.log('[useWallet] Connection check disabled in local-first mode');
  },
}));
