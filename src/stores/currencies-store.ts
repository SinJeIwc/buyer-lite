import { createFetchStore } from "@/lib/create-fetch-store";
import { getCurrencies } from "@/server/settings";

export interface Currency {
  code: string;
  name: string;
  isDefault: boolean;
}

export const useCurrenciesStore = createFetchStore<Currency>(getCurrencies);
