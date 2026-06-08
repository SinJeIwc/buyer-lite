import { create, type StateCreator } from "zustand";

interface BaseStore<T> {
  items: T[];
  isLoading: boolean;
  lastFetched: number | null;
  fetchItems: (force?: boolean) => Promise<void>;
  refresh: () => Promise<void>;
}

export function createFetchStore<T>(
  fetcher: () => Promise<T[]>,
  // cacheMs = 5 * 60 * 1000,
) {
  const store: StateCreator<BaseStore<T>> = (set, get) => ({
    items: [],
    isLoading: false,
    lastFetched: null,
    //force = false
    fetchItems: async () => {
      // lastFetched,
      const { isLoading } = get();
      // if (!force && lastFetched && Date.now() - lastFetched < cacheMs) return;
      if (isLoading) return;

      set({ isLoading: true });
      try {
        const data = await fetcher();
        set({ items: data, lastFetched: Date.now() });
      } finally {
        set({ isLoading: false });
      }
    },

    refresh: async () => {
      set({ lastFetched: null });
      await get().fetchItems(true);
    },
  });

  return create<BaseStore<T>>(store);
}
