import { create } from "zustand";

import {
  getNextBudgetId,
  getBudget,
} from "../services/budgetRegistry";

export const useContractStore = create((set) => ({
  nextBudgetId: null,
  selectedBudget: null,

  loading: false,
  error: null,

  loadNextBudgetId: async () => {
    try {
      set({
        loading: true,
        error: null,
      });

      const nextBudgetId = await getNextBudgetId();

      set({
        nextBudgetId,
        loading: false,
      });
    } catch (error) {
      set({
        loading: false,
        error: error.message,
      });
    }
  },

  loadBudget: async (budgetId) => {
    try {
      set({
        loading: true,
        error: null,
      });

      const budget = await getBudget(budgetId);

      set({
        selectedBudget: budget,
        loading: false,
      });
    } catch (error) {
      set({
        loading: false,
        error: error.message,
      });
    }
  },
}));