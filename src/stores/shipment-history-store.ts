import { createFetchStore } from "@/lib/create-fetch-store";
import { getShipments } from "@/server/shipments";
import type { Shipment } from "./shipments-store";

export const useShipmentHistoryStore = createFetchStore<Shipment>(() =>
  getShipments("shipped"),
);
