import { createFetchStore } from "@/lib/create-fetch-store";
import { getSuppliers } from "@/server/settings";

export interface Supplier {
  id: string;
  name: string;
  location: string | null;
}

export const useSuppliersStore = createFetchStore<Supplier>(getSuppliers);
