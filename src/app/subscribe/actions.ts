"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type PromoState = { error?: string } | null;

/** Canjea un código promocional y activa el acceso del usuario. */
export async function redeemCode(
  _prev: PromoState,
  formData: FormData,
): Promise<PromoState> {
  const code = String(formData.get("code") ?? "").trim();
  if (!code) return { error: "Ingresá un código." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase.rpc("redeem_promo_code", {
    p_code: code,
  });

  if (error) return { error: "No se pudo validar el código. Probá de nuevo." };
  if (!data) return { error: "Código inválido o sin usos disponibles." };

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
