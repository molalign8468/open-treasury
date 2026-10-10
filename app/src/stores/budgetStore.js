import { create } from "zustand";

import {
  getAllBudgets,
  getBudget,getProgramsByBudget
} from "../services/budgetRegistry";


export const useBudgetStore = create((set) => ({
  budgets: [],
  programs: [],

  selectedBudget: null,

  loading: false,
  error: null,


  loadBudgets: async () => {
    try {
      set({
        loading: true,
        error: null,
      });

      const budgets = await getAllBudgets();

      set({
        budgets,
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
  loadProgramsByBudget: async (budgetId) => {
  try {
    set({
      loading: true,
      error: null,
      programs: [],
    });

    const programs = await getProgramsByBudget(budgetId);

    set({
      programs,
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