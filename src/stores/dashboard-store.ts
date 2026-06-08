import { create } from "zustand";
import type { DashboardStats } from "@/server/dashboard";
import { getDashboardStats } from "@/server/dashboard";

interface DashboardState {
  stats: DashboardStats | null;
  isLoading: boolean;
  lastFetched: number | null;
  fetchStats: (force?: boolean) => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  stats: null,
  isLoading: false,
  lastFetched: null,

  fetchStats: async (force = false) => {
    const { lastFetched, isLoading } = get();
    if (!force && lastFetched && Date.now() - lastFetched < 5 * 60 * 1000)
      return;
    if (isLoading) return;

    set({ isLoading: true });
    try {
      const data = await getDashboardStats();
      set({ stats: data, lastFetched: Date.now() });
    } finally {
      set({ isLoading: false });
    }
  },
}));
