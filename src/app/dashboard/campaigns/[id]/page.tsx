import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Workspace } from "@/components/Workspace";

export default async function CampaignDetail({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createSupabaseServerClient();
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!campaign) notFound();

  return <Workspace campaign={campaign} />;
}
