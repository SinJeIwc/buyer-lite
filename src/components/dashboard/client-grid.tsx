"use client";

import { Plus } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { BalanceDialog } from "@/components/clients/balance/balance-button";
import { Card, CardContent } from "@/components/ui/card";
import { useClientsStore } from "@/stores/clients-store";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export function ClientGrid() {
  const clients = useClientsStore((s) => s.items);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [balanceOpen, setBalanceOpen] = useState(false);

  // Фильтруем заблокированных
  const activeClients = clients.filter((c) => !c.isBlocked);

  if (activeClients.length === 0) return null;

  function handleClientClick(clientId: string) {
    setSelectedClientId(clientId);
    setBalanceOpen(true);
  }

  function formatBalance(balance: string) {
    const num = parseFloat(balance);
    return num.toLocaleString("ru-RU", { minimumFractionDigits: 0 });
  }

  const hasOdd = activeClients.length % 2 !== 0;

  return (
    <>
      <motion.div
        className="grid grid-cols-2 gap-2"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {activeClients.map((client) => (
          <motion.div key={client.id} variants={item}>
            <button
              type="button"
              className="w-full text-left"
              onClick={() => handleClientClick(client.id)}
            >
              <Card className="active:scale-[0.97] transition-transform">
                <CardContent className="p-3">
                  <p className="text-sm font-medium truncate">{client.name}</p>
                  <p
                    className={`text-lg font-semibold tabular-nums ${
                      parseFloat(client.balance) >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {formatBalance(client.balance)}с
                  </p>
                </CardContent>
              </Card>
            </button>
          </motion.div>
        ))}

        {hasOdd && (
          <motion.div variants={item}>
            <Link href="/clients">
              <Card className="active:scale-[0.97] transition-transform h-full border-dashed">
                <CardContent className="p-3 flex items-center justify-center h-full">
                  <Plus className="size-6 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        )}
      </motion.div>

      {selectedClientId && (
        <BalanceDialog
          open={balanceOpen}
          onOpenChange={setBalanceOpen}
          clientId={selectedClientId}
          onSuccess={() => {
            useClientsStore.getState().refresh();
          }}
        />
      )}
    </>
  );
}
