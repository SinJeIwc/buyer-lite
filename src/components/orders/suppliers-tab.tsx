"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { SupplierFormDialog } from "@/components/suppliers/supplier-form-dialog";
import { Button } from "@/components/ui/button";
import { IsLoading } from "@/components/ui/is-loading";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemTitle,
} from "@/components/ui/item";
import { useSuppliersStore } from "@/stores/suppliers-store";
import { NewOrderDialog } from "./new-order-dialog";
import { PayDialog } from "./pay-dialog";

interface Supplier {
  id: string;
  name: string;
}

export function SuppliersTab() {
  const suppliers = useSuppliersStore((s) => s.suppliers);
  const isLoading = useSuppliersStore((s) => s.isLoading);
  const refresh = useSuppliersStore((s) => s.refresh);
  const [supplierFormOpen, setSupplierFormOpen] = useState(false);
  const [paySupplier, setPaySupplier] = useState<Supplier | null>(null);
  const [orderSupplier, setOrderSupplier] = useState<Supplier | null>(null);

  return (
    <div className="space-y-4">
      <Button
        onClick={() => setSupplierFormOpen(true)}
        variant="outline"
        className="w-full"
      >
        <Plus className="w-4 h-4 mr-1" />
        Новый поставщик
      </Button>

      {isLoading ? (
        <IsLoading />
      ) : (
        <div className="space-y-2">
          {suppliers.map((supplier) => (
            <Item key={supplier.id} variant="outline" size="xs">
              <ItemContent className="p-4">
                <ItemTitle>{supplier.name}</ItemTitle>
              </ItemContent>
              <ItemActions>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOrderSupplier(supplier)}
                >
                  Заказ
                </Button>
                <Button size="sm" onClick={() => setPaySupplier(supplier)}>
                  Оплатить
                </Button>
              </ItemActions>
            </Item>
          ))}
        </div>
      )}

      <SupplierFormDialog
        open={supplierFormOpen}
        onOpenChange={setSupplierFormOpen}
        onSuccess={() => refresh()}
      />

      {paySupplier && (
        <PayDialog
          open={!!paySupplier}
          onOpenChange={() => setPaySupplier(null)}
          supplierId={paySupplier.id}
          supplierName={paySupplier.name}
          onSuccess={() => {
            setPaySupplier(null);
            refresh();
          }}
        />
      )}

      {orderSupplier && (
        <NewOrderDialog
          open={!!orderSupplier}
          onOpenChange={() => setOrderSupplier(null)}
          supplierId={orderSupplier.id}
          supplierName={orderSupplier.name}
          onSuccess={() => {
            setOrderSupplier(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}
