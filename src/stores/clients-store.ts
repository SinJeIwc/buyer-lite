import { createFetchStore } from "@/lib/create-fetch-store";
import { getClients } from "@/server/clients";

export interface Client {
  id: string;
  name: string;
  phone: string | null;
  city: string | null;
  notes: string | null;
  balance: string;
}

export const useClientsStore = createFetchStore<Client>(getClients);
