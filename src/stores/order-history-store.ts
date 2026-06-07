import { createFetchStore } from "@/lib/create-fetch-store";
import type { OrderPaymentWithItems } from "@/server/order-history";
import { getOrderPayments } from "@/server/order-history";

export const useOrderHistoryStore =
  createFetchStore<OrderPaymentWithItems>(getOrderPayments);
