import { create } from "zustand";

import {
  createProgram,
} from "../services/budgetRegistry";

export const useProgramStore = create((set) => ({
  loading: false,
  error: null,
  txHash: null,

  createProgram: async (name, amount, budgetId) => {
    try {
      set({
        loading: true,
        error: null,
        txHash: null,
      });

      const result = await createProgram(
        name,
        amount,
        budgetId
      );

      set({
        loading: false,
        txHash: result.hash,
      });

      return result;
    } catch (error) {
      set({
        loading: false,
        error:
          error.shortMessage ||
          error.reason ||
          error.message,
      });

      return null;
    }
  },

  clearResult: () => {
    set({
      error: null,
      txHash: null,
    });
  },
}));