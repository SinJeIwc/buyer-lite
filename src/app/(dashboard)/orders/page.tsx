import { BackButton } from "@/components/back-button";
import { OrdersTabs } from "@/components/orders/orders-tabs";

export default function OrdersPage() {
  return (
    <>
      <div className="flex items-center mb-1">
        <BackButton />
        <h1 className="text-2xl font-bold">Заказы</h1>
      </div>
      <OrdersTabs />
    </>
  );
}
