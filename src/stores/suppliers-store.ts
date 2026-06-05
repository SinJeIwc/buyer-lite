import { create } from "zustand";
import { getSuppliers } from "@/server/settings";

interface Supplier {
  id: string;
  name: string;
  location: string | null;
}

interface SuppliersStore {
  suppliers: Supplier[];
  isLoading: boolean;
  lastFetched: number | null;
  fetchSuppliers: (force?: boolean) => Promise<void>;
  refresh: () => Promise<void>;
}

export const useSuppliersStore = create<SuppliersStore>((set, get) => ({
  suppliers: [],
  isLoading: false,
  lastFetched: null,

  fetchSuppliers: async (force = false) => {
    const { lastFetched, isLoading } = get();
    if (!force && lastFetched && Date.now() - lastFetched < 5 * 60 * 1000)
      return;
    if (isLoading) return;

    set({ isLoading: true });
    try {
      const data = await getSuppliers();
      set({ suppliers: data, lastFetched: Date.now() });
    } finally {
      set({ isLoading: false });
    }
  },

  refresh: async () => {
    set({ lastFetched: null });
    await get().fetchSuppliers(true);
  },
}));
