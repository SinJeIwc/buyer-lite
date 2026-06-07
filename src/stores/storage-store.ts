import { createFetchStore } from "@/lib/create-fetch-store";
import { getStorageItems } from "@/server/supplier-items";

export interface StorageItem {
  id: string;
  clientId: string;
  clientName: string | null;
  supplierId: string;
  supplierName: string | null;
  name: string;
  size: string | null;
  quantity: number;
  purchasePrice: string;
}

export const useStorageStore = createFetchStore<StorageItem>(getStorageItems);
