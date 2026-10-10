import { create } from "zustand";

import {
  createBudget,
} from "../services/budgetRegistry";

export const useCreateBudgetStore = create((set) => ({
  loading: false,
  error: null,
  txHash: null,

  submitBudget: async (
    ministry,
    fiscalYear,
    allocatedAmount
  ) => {
    set({
      loading: true,
      error: null,
      txHash: null,
    });

    try {
      const result = await createBudget(
        ministry,
        fiscalYear,
        allocatedAmount
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

  reset: () => {
    set({
      loading: false,
      error: null,
      txHash: null,
    });
  },
}));