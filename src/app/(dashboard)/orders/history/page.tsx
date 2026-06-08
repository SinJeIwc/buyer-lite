import { BackButton } from "@/components/back-button";
import { OrderHistory } from "@/components/orders/history/order-history";

export default function Page() {
  return (
    <>
      <div className="flex items-center">
        <BackButton />
        <h1 className="text-2xl font-bold ">История заказов</h1>
      </div>
      <OrderHistory />
    </>
  );
}
