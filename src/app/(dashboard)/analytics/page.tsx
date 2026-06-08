import { AnalyticsContent } from "@/components/analytics/analytics-content";
import { BackButton } from "@/components/back-button";

export default function AnalyticsPage() {
  return (
    <>
      <div className="flex items-center gap-2">
        <BackButton />
        <h1 className="text-2xl font-bold">Аналитика</h1>
      </div>
      <AnalyticsContent />
    </>
  );
}
