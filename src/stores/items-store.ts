import { create } from "zustand";
import { getSupplierItems } from "@/server/supplier-items";

interface SupplierItem {
  id: string;
  supplierId: string;
  name: string;
  quantity: number;
  purchasePrice: string;
}

interface ItemsStore {
  items: SupplierItem[];
  isLoading: boolean;
  lastFetched: number | null;
  fetchItems: (force?: boolean) => Promise<void>;
  refresh: () => Promise<void>;
}

export const useItemsStore = create<ItemsStore>((set, get) => ({
  items: [],
  isLoading: false,
  lastFetched: null,

  fetchItems: async (force = false) => {
    const { lastFetched, isLoading } = get();
    if (!force && lastFetched && Date.now() - lastFetched < 5 * 60 * 1000)
      return;
    if (isLoading) return;

    set({ isLoading: true });
    try {
      const data = await getSupplierItems();
      set({ items: data, lastFetched: Date.now() });
    } finally {
      set({ isLoading: false });
    }
  },

  refresh: async () => {
    set({ lastFetched: null });
    await get().fetchItems(true);
  },
}));
