"use client";

import { FileText } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import type { Shipment } from "@/stores/shipments-store";

interface ShipmentReportButtonProps {
  shipment: Shipment;
}

export function ShipmentReportButton({ shipment }: ShipmentReportButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePdf = useCallback(async () => {
    const { pdf } = await import("@react-pdf/renderer");
    const { ShipmentDocument } = await import("./shipment-pdf-document");

    const doc = pdf(<ShipmentDocument shipment={shipment} />);
    const blob = await doc.toBlob();
    return blob;
  }, [shipment]);

  async function handleShare() {
    setIsGenerating(true);
    try {
      const blob = await generatePdf();
      const fileName = `Отправка${shipment.code ? `_${shipment.code}` : ""}.pdf`;
      const file = new File([blob], fileName, { type: "application/pdf" });

      // Пробуем Web Share API с файлом
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: fileName,
          text: `Отправка${shipment.code ? ` #${shipment.code}` : ""}`,
        });
        return;
      }

      // Fallback: скачивание
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
      className="size-8"
      onClick={handleShare}
      disabled={isGenerating}
    >
      <FileText className="size-4" />
    </Button>
  );
}
