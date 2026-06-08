export interface CartItem {
  storageItemId: string;
  name: string;
  size: string | null;
  maxQuantity: number;
  quantity: number;
  clientId: string;
}

export interface LocalItem {
  id: string;
  storageItemId: string;
  name: string;
  size: string | null;
  quantity: number;
  originalQuantity: number;
  isNew?: boolean;
}
