import { OrdersList } from "@/components/orders/orders-list";

export default function OrdersPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Заказы</h1>
      <OrdersList />
    </div>
  );
}
