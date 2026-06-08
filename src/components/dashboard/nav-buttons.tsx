import { ChartNoAxesCombinedIcon, VanIcon } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export function NavButtons() {
  return (
    <div className="grid grid-cols-2 gap-2 text-sm font-semibold">
      <Link href="/analytics">
        <Card className="active:scale-[0.97] transition-transform">
          <CardContent className="p-4 items-center flex justify-center gap-2">
            <ChartNoAxesCombinedIcon className="w-5 h-5" />
            <span>Аналитика</span>
          </CardContent>
        </Card>
      </Link>
      <Link href="/suppliers">
        <Card className="active:scale-[0.97] transition-transform">
          <CardContent className="p-4 items-center  flex justify-center gap-2">
            <VanIcon className="w-5 h-5" />
            <span>Поставщики</span>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
