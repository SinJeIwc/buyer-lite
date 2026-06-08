/** Товар в заказе (клиентская сторона) */
export interface OrderItem {
  _id: string;
  name: string;
  size: string;
  quantity: number;
  purchasePrice: number;
}

/** Элемент списка клиентов для Select */
export interface ClientOption {
  label: string;
  value: string;
}

/** Выбранный товар в оплате заказа */
export interface SelectedItem {
  _id: string;
  supplierItemId?: string;
  isNew: boolean;
  name: string;
  size: string | null;
  maxQuantity: number;
  quantity: number;
  purchasePrice: number;
}
