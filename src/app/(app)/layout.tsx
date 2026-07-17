import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasAccess, ACCESS_COLUMNS } from "@/lib/access";
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
    .select(ACCESS_COLUMNS)
    .eq("id", user.id)
    .maybeSingle();
  if (!hasAccess(profile)) redirect("/subscribe");

  return (
    <>
      <div className="fade-in flex w-full flex-1 flex-col pb-20">{children}</div>
      <BottomNav />
    </>
  );
}
