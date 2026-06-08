import { BackButton } from "@/components/back-button";
import { BalanceHistoryList } from "@/components/clients/balance-history/balance-history-list";

export default function BalanceHistoryPage() {
  return (
    <>
      <div className="flex items-center">
        <BackButton />
        <h1 className="text-2xl font-bold">История баланса</h1>
      </div>
      <BalanceHistoryList />
    </>
  );
}
