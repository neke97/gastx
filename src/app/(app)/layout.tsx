import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BottomNav } from "@/components/BottomNav";

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
  const { data: profile } = await supabase
    .from("profiles")
    .select("access_active")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.access_active) redirect("/subscribe");

  return (
    <>
      <div className="fade-in flex w-full flex-1 flex-col pb-20">{children}</div>
      <BottomNav />
    </>
  );
}
