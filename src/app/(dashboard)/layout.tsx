import { redirect } from "next/navigation";
import { BottomNav } from "@/components/bottom-nav";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="pb-16">
      <main className="container min-h-[calc(100vh-4rem)] mx-auto px-4 pt-4 flex flex-col gap-4">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
