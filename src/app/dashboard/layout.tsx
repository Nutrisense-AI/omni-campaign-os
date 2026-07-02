import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { Sidebar } from "@/components/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin
    .from("users")
    .select("credit_balance, subscription_tier, email")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex min-h-screen bg-bg text-text">
      <Sidebar
        email={user.email || profile?.email || ""}
        credits={profile?.credit_balance ?? 0}
        tier={profile?.subscription_tier ?? "free"}
      />
      <main className="flex-1 overflow-x-hidden">{children}</main>
    </div>
  );
}
