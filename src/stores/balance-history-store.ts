import { create } from "zustand";
import { balanceOperationSchema } from "@/components/clients/schemas";
import type { BalanceOperationWithClient } from "@/server/balance";
import { getBalanceHistory } from "@/server/balance";

interface BalanceHistoryState {
  items: BalanceOperationWithClient[];
  isLoading: boolean;
  fetchItems: () => Promise<void>;
}

export const useBalanceHistoryStore = create<BalanceHistoryState>((set) => ({
  items: [],
  isLoading: false,

  fetchItems: async () => {
    set({ isLoading: true });
    try {
      const data = await getBalanceHistory();
      // Runtime-валидация через Zod
      const validated = data
        .map((item) => {
          const result = balanceOperationSchema.safeParse(item);
          return result.success ? result.data : null;
        })
        .filter(Boolean) as BalanceOperationWithClient[];
      set({ items: validated });
    } finally {
      set({ isLoading: false });
    }
  },
}));
