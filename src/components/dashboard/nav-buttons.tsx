import { ChartNoAxesCombinedIcon, VanIcon } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export function NavButtons() {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Link href="/analytics">
        <Card className="active:scale-[0.97] transition-transform">
          <CardContent className="p-4 items-center text-sm font-medium flex justify-center gap-2">
            <ChartNoAxesCombinedIcon className="w-4 h-4" />
            <span className="text-sm font-medium">Аналитика</span>
          </CardContent>
        </Card>
      </Link>
      <Link href="/suppliers">
        <Card className="active:scale-[0.97] transition-transform">
          <CardContent className="p-4 items-center text-sm font-medium flex justify-center gap-2">
            <VanIcon className="w-4 h-4" />
            <span>Поставщики</span>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
