import { BackButton } from "@/components/back-button";
import { ShipmentsTabs } from "@/components/shipments/shipments-tabs";

export default function ShipmentsPage() {
  return (
    <>
      <div className="flex items-center mb-1">
        <BackButton />
        <h1 className="text-2xl font-bold">Отправки</h1>
      </div>
      <ShipmentsTabs />
    </>
  );
}
