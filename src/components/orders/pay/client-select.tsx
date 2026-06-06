"use client";

import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useClientsStore } from "@/stores/clients-store";

interface ClientSelectProps {
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
}

export function ClientSelect({ value, onChange, disabled }: ClientSelectProps) {
  const clientsList = useClientsStore((s) => s.clients);
  const isLoading = useClientsStore((s) => s.isLoading);

  const items = clientsList.map((c) => ({
    label: c.name,
    value: c.id,
  }));

  return (
    <Field>
      <FieldLabel>Клиент</FieldLabel>
      <Select
        items={items}
        value={value}
        onValueChange={onChange}
        disabled={disabled || isLoading}
      >
        <SelectTrigger>
          <SelectValue
            placeholder={isLoading ? "Загрузка..." : "Выберите клиента"}
          />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {items.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </Field>
  );
}
