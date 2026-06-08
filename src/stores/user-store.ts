import { create } from "zustand";
import type { UserProfile } from "@/server/settings";
import { getCurrentUser } from "@/server/settings";

interface UserState {
  user: UserProfile | null;
  isLoading: boolean;
  fetchUser: () => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isLoading: false,

  fetchUser: async () => {
    set({ isLoading: true });
    try {
      const data = await getCurrentUser();
      set({ user: data });
    } finally {
      set({ isLoading: false });
    }
  },
}));
