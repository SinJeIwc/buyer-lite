import { SettingsIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/server/settings";

export async function DashboardHeader() {
  const user = await getCurrentUser();

  return (
    <header className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Image src="/logo.png" alt="Logo" width={36} height={36} />
        <p className="text-sm font-medium">{user?.name ?? "Байер"}</p>
      </div>

      <Link href="/settings">
        <Button variant="ghost" size="icon" className="size-9">
          <SettingsIcon className="size-5" />
        </Button>
      </Link>
    </header>
  );
}
