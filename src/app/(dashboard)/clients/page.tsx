import { BackButton } from "@/components/back-button";
import { ClientsList } from "@/components/clients/clients-list";

export default function ClientsPage() {
  return (
    <>
      <div className="flex items-center">
        <BackButton />
        <h1 className="text-2xl font-bold ">Клиенты</h1>
      </div>
      <ClientsList />
    </>
  );
}
