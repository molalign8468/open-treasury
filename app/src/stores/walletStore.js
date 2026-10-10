import { create } from "zustand";

import {
  getAccount,
  requestAccounts,
  getChainId,
  switchToSepolia,
} from "../services/ethereum";

const SEPOLIA_CHAIN_ID = 11155111;

export const useWalletStore = create((set) => ({
  account: null,
  chainId: null,

  isConnected: false,
  isCorrectNetwork: false,

  loading: false,
  error: null,

  connectWallet: async () => {
    try {
      set({
        loading: true,
        error: null,
      });

      const account = await requestAccounts();
      const chainId = await getChainId();

      set({
        account,
        chainId,
        isConnected: !!account,
        isCorrectNetwork: chainId === SEPOLIA_CHAIN_ID,
        loading: false,
      });
    } catch (error) {
      set({
        loading: false,
        error: error.message,
      });
    }
  },

  refreshWallet: async () => {
    try {
      const account = await getAccount();

      if (!account) {
        set({
          account: null,
          chainId: null,
          isConnected: false,
          isCorrectNetwork: false,
        });

        return;
      }

      const chainId = await getChainId();

      set({
        account,
        chainId,
        isConnected: true,
        isCorrectNetwork: chainId === SEPOLIA_CHAIN_ID,
        error: null,
      });
    } catch (error) {
      set({
        account: null,
        chainId: null,
        isConnected: false,
        isCorrectNetwork: false,
        error: error.message,
      });
    }
  },

  switchNetwork: async () => {
    try {
      set({
        loading: true,
        error: null,
      });

      await switchToSepolia();

      const chainId = await getChainId();

      set({
        chainId,
        isCorrectNetwork: chainId === SEPOLIA_CHAIN_ID,
        loading: false,
      });
    } catch (error) {
      set({
        loading: false,
        error: error.message,
      });
    }
  },

  disconnectWallet: () => {
    set({
      account: null,
      chainId: null,
      isConnected: false,
      isCorrectNetwork: false,
      error: null,
    });
  },
}));