import { createFetchStore } from "@/lib/create-fetch-store";
import { getShipments } from "@/server/shipments";

export interface ShipmentItem {
  id: string;
  storageItemId: string;
  quantity: number;
  name: string | null;
  size: string | null;
  purchasePrice: string | null;
}

export interface Shipment {
  id: string;
  code: string | null;
  clientId: string;
  clientName: string | null;
  status: string;
  destination: string | null;
  shippingCost: string | null;
  notes: string | null;
  createdAt: Date | null;
  shippedAt: Date | null;
  items: ShipmentItem[];
}

export const useShipmentsStore = createFetchStore<Shipment>(() =>
  getShipments("preparing"),
);
