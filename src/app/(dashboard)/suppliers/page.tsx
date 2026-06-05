import { BackButton } from "@/components/back-button";
import { SuppliersList } from "@/components/suppliers/suppliers-list";

export default function SuppliersPage() {
  return (
    <>
      <div className="flex items-center">
        <BackButton />
        <h1 className="text-2xl font-bold">Поставщики</h1>
      </div>
      <SuppliersList />
    </>
  );
}
