import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CategoryForm } from "@/components/CategoryForm";
import { PageHeader } from "@/components/PageHeader";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: category } = await supabase
    .from("categories")
    .select("id, name, kind, color, icon")
    .eq("id", id)
    .maybeSingle();

  if (!category) notFound();

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-5 py-6">
      <PageHeader title="Editar categoría" back="/dashboard/categories" />

      <CategoryForm initial={category} />
    </main>
  );
}
