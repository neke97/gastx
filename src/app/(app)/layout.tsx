import { BottomNav } from "@/components/BottomNav";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="flex w-full flex-1 flex-col pb-20">{children}</div>
      <BottomNav />
    </>
  );
}
