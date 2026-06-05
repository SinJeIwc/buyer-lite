import { create } from "zustand";
import { getClients } from "@/server/clients";

interface Client {
  id: string;
  name: string;
  phone: string | null;
  city: string | null;
  notes: string | null;
  balance: string;
}

interface ClientsStore {
  clients: Client[];
  isLoading: boolean;
  lastFetched: number | null;
  fetchClients: (force?: boolean) => Promise<void>;
  refresh: () => Promise<void>;
}

export const useClientsStore = create<ClientsStore>((set, get) => ({
  clients: [],
  isLoading: false,
  lastFetched: null,

  fetchClients: async (force = false) => {
    const { lastFetched, isLoading } = get();
    if (!force && lastFetched && Date.now() - lastFetched < 5 * 60 * 1000)
      return;
    if (isLoading) return;

    set({ isLoading: true });
    try {
      const data = await getClients();
      set({ clients: data, lastFetched: Date.now() });
    } finally {
      set({ isLoading: false });
    }
  },

  refresh: async () => {
    set({ lastFetched: null });
    await get().fetchClients(true);
  },
}));
