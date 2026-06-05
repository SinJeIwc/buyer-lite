import { create } from "zustand";
import { getCurrencies } from "@/server/settings";

interface Currency {
  code: string;
  name: string;
  isDefault: boolean;
}

interface CurrenciesStore {
  currencies: Currency[];
  isLoading: boolean;
  lastFetched: number | null;
  fetchCurrencies: (force?: boolean) => Promise<void>;
  refresh: () => Promise<void>;
}

export const useCurrenciesStore = create<CurrenciesStore>((set, get) => ({
  currencies: [],
  isLoading: false,
  lastFetched: null,

  fetchCurrencies: async (force = false) => {
    const { lastFetched, isLoading } = get();
    if (!force && lastFetched && Date.now() - lastFetched < 5 * 60 * 1000)
      return;
    if (isLoading) return;

    set({ isLoading: true });
    try {
      const data = await getCurrencies();
      set({ currencies: data, lastFetched: Date.now() });
    } finally {
      set({ isLoading: false });
    }
  },

  refresh: async () => {
    set({ lastFetched: null });
    await get().fetchCurrencies(true);
  },
}));
