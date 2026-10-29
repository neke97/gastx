import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasAccess, ACCESS_COLUMNS, PAYWALL_ENABLED } from "@/lib/access";
import { BottomNav } from "@/components/BottomNav";
import { Toaster } from "@/components/Toaster";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Gate de acceso: sin suscripción / código activo, mandar a /subscribe.
  if (PAYWALL_ENABLED) {
    const { data: profile } = await supabase
      .from("profiles")
      .select(ACCESS_COLUMNS)
      .eq("id", user.id)
      .maybeSingle();
    if (!hasAccess(profile)) redirect("/subscribe");
  }

  return (
    <>
      <div className="fade-in flex w-full flex-1 flex-col pb-24">{children}</div>
      <BottomNav />
      <Toaster />
    </>
  );
}
