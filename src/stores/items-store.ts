import { createFetchStore } from "@/lib/create-fetch-store";
import { getSupplierItems } from "@/server/supplier-items";

export interface SupplierItem {
  id: string;
  supplierId: string;
  clientId: string;
  clientName: string | null;
  name: string;
  size: string | null;
  quantity: number;
  purchasePrice: string;
}

export const useItemsStore = createFetchStore<SupplierItem>(getSupplierItems);
