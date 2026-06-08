import { ClientGrid } from "@/components/dashboard/client-grid";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { NavButtons } from "@/components/dashboard/nav-buttons";
import { StatsCompact } from "@/components/dashboard/stats-compact";

export default async function DashboardPage() {
  return (
    <>
      {/* Header */}
      <DashboardHeader />

      {/* Дашборд */}
      <StatsCompact />

      {/* Клиенты */}
      <ClientGrid />

      {/* Навигация */}
      <NavButtons />
    </>
  );
}
