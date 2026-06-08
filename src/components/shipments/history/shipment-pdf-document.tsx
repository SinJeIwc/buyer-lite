"use client";

import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { Shipment } from "@/stores/shipments-store";

// Регистрируем Roboto — поддерживает кириллицу
Font.register({
  family: "Roboto",
  fonts: [
    { src: "/fonts/Roboto-Regular.ttf", fontWeight: 400 },
    { src: "/fonts/Roboto-Bold.ttf", fontWeight: 700 },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: "Roboto",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: "#666",
    marginBottom: 12,
  },
  infoTable: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  infoLabel: {
    width: 100,
    color: "#666",
  },
  infoValue: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
    paddingBottom: 4,
    marginBottom: 4,
  },
  tableHeaderText: {
    fontWeight: "bold",
    fontSize: 11,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f0f0f0",
  },
  colName: {
    flex: 1,
  },
  colQty: {
    width: 50,
    textAlign: "center",
  },
  colSum: {
    width: 80,
    textAlign: "right",
  },
  totalsTable: {
    marginTop: 16,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  totalsLabel: {
    color: "#666",
  },
  totalsBold: {
    fontWeight: "bold",
  },
});

interface ShipmentDocumentProps {
  shipment: Shipment;
}

export function ShipmentDocument({ shipment }: ShipmentDocumentProps) {
  const totalCost = shipment.items.reduce(
    (sum, item) => sum + parseFloat(item.purchasePrice || "0") * item.quantity,
    0,
  );
  const shippingCost = parseFloat(shipment.shippingCost || "0");

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Заголовок */}
        <Text style={styles.title}>
          Отправка{shipment.code ? ` #${shipment.code}` : ""}
        </Text>
        {shipment.shippedAt && (
          <Text style={styles.subtitle}>
            {new Date(shipment.shippedAt).toLocaleDateString("ru-RU", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </Text>
        )}

        {/* Информация */}
        <View style={styles.infoTable}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Клиент:</Text>
            <Text style={styles.infoValue}>{shipment.clientName || "—"}</Text>
          </View>
          {shipment.destination && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Куда:</Text>
              <Text style={styles.infoValue}>{shipment.destination}</Text>
            </View>
          )}
          {shipment.notes && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Комментарий:</Text>
              <Text style={styles.infoValue}>{shipment.notes}</Text>
            </View>
          )}
        </View>

        {/* Товары */}
        <Text style={styles.sectionTitle}>Товары</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.colName]}>Название</Text>
          <Text style={[styles.tableHeaderText, styles.colQty]}>Кол-во</Text>
          <Text style={[styles.tableHeaderText, styles.colSum]}>Сумма</Text>
        </View>
        {shipment.items.map((item) => (
          <View key={item.id} style={styles.tableRow}>
            <Text style={styles.colName}>
              {item.name}
              {item.size ? ` (${item.size})` : ""}
            </Text>
            <Text style={styles.colQty}>{String(item.quantity)}</Text>
            <Text style={styles.colSum}>
              {(
                parseFloat(item.purchasePrice || "0") * item.quantity
              ).toLocaleString("ru-RU")}
              с
            </Text>
          </View>
        ))}

        {/* Итого */}
        <View style={styles.totalsTable}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Товары:</Text>
            <Text>{totalCost.toLocaleString("ru-RU")}с</Text>
          </View>
          {shippingCost > 0 && (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Доставка:</Text>
              <Text>{shippingCost.toLocaleString("ru-RU")}с</Text>
            </View>
          )}
          {parseFloat(shipment.commissionAmount || "0") > 0 && (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Комиссия:</Text>
              <Text>
                {parseFloat(shipment.commissionAmount || "0").toLocaleString(
                  "ru-RU",
                )}
                с
              </Text>
            </View>
          )}
          <View
            style={[
              styles.totalsRow,
              {
                marginTop: 4,
                borderTopWidth: 1,
                borderTopColor: "#e5e5e5",
                paddingTop: 4,
              },
            ]}
          >
            <Text style={styles.totalsBold}>Итого:</Text>
            <Text style={styles.totalsBold}>
              {(
                totalCost +
                shippingCost +
                parseFloat(shipment.commissionAmount || "0")
              ).toLocaleString("ru-RU")}
              с
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
