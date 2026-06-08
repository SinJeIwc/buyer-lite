"use client";

import { FileText } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import type { BalanceOperationWithClient } from "@/server/balance";
import { type BalanceOperationType, balanceOperationLabels } from "../types";

interface BalanceHistoryReportButtonProps {
  operations: BalanceOperationWithClient[];
}

export function BalanceHistoryReportButton({
  operations,
}: BalanceHistoryReportButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePdf = useCallback(async () => {
    const { pdf } = await import("@react-pdf/renderer");
    const { Document, Page, Text, View, StyleSheet, Font } = await import(
      "@react-pdf/renderer"
    );

    // Регистрируем шрифт (на случай если ещё не зарегистрирован)
    try {
      Font.register({
        family: "Roboto",
        fonts: [
          { src: "/fonts/Roboto-Regular.ttf", fontWeight: 400 },
          { src: "/fonts/Roboto-Bold.ttf", fontWeight: 700 },
        ],
      });
    } catch {
      // уже зарегистрирован
    }

    const styles = StyleSheet.create({
      page: { padding: 30, fontSize: 10, fontFamily: "Roboto" },
      title: { fontSize: 16, fontWeight: "bold", marginBottom: 12 },
      dateHeader: {
        fontSize: 11,
        fontWeight: "bold",
        marginTop: 12,
        marginBottom: 4,
        color: "#666",
      },
      row: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 3,
        borderBottomWidth: 0.5,
        borderBottomColor: "#f0f0f0",
      },
      cellName: { flex: 1 },
      cellType: { width: 100, color: "#666" },
      cellAmount: { width: 80, textAlign: "right" },
      cellDesc: { width: 120, color: "#999", textAlign: "right" },
    });

    // Группировка по датам
    const groups = new Map<string, BalanceOperationWithClient[]>();
    for (const op of operations) {
      if (!op.createdAt) continue;
      const dateKey = new Date(op.createdAt).toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      const arr = groups.get(dateKey);
      if (arr) arr.push(op);
      else groups.set(dateKey, [op]);
    }

    const total = operations.reduce(
      (sum, op) => sum + parseFloat(op.amount),
      0,
    );

    const doc = (
      <Document>
        <Page size="A4" style={styles.page}>
          <Text style={styles.title}>
            История баланса ({operations.length} оп.)
          </Text>

          {Array.from(groups.entries()).map(([date, ops]) => (
            <View key={date}>
              <Text style={styles.dateHeader}>{date}</Text>
              {ops.map((op) => {
                const amount = parseFloat(op.amount);
                const opType = op.type as BalanceOperationType;
                return (
                  <View key={op.id} style={styles.row}>
                    <Text style={styles.cellName}>{op.clientName || "—"}</Text>
                    <Text style={styles.cellType}>
                      {balanceOperationLabels[opType] ?? op.type}
                    </Text>
                    <Text style={styles.cellAmount}>
                      {amount >= 0 ? "+" : ""}
                      {amount.toLocaleString("ru-RU")} с
                    </Text>
                  </View>
                );
              })}
            </View>
          ))}

          <View style={[styles.row, { marginTop: 16 }]}>
            <Text style={{ fontWeight: "bold" }}>Итого:</Text>
            <Text style={[styles.cellAmount, { fontWeight: "bold" }]}>
              {total >= 0 ? "+" : ""}
              {total.toLocaleString("ru-RU")} с
            </Text>
          </View>
        </Page>
      </Document>
    );

    const blob = await pdf(doc).toBlob();
    return blob;
  }, [operations]);

  async function handleShare() {
    setIsGenerating(true);
    try {
      const blob = await generatePdf();
      const fileName = `История_баланса_${new Date().toLocaleDateString("ru-RU")}.pdf`;
      const file = new File([blob], fileName, { type: "application/pdf" });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: fileName,
          text: "История баланса",
        });
        return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF share error:", err);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-8 shrink-0"
      onClick={handleShare}
      disabled={isGenerating}
    >
      <FileText className="size-4" />
    </Button>
  );
}
