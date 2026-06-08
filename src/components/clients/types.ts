/** Краткие данные клиента (для форм и карточек) */
export interface ClientBrief {
  id: string;
  name: string;
  phone: string | null;
  city: string | null;
  notes: string | null;
}

/** Данные клиента из формы */
export interface ClientFormData {
  name: string;
  phone: string;
  city: string;
  notes: string;
}
