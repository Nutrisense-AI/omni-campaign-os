import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { campaignId } = await req.json();
    const supabase = createSupabaseServerClient();

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Attach the guest campaign to the user
    const { error } = await supabase
      .from("campaigns")
      .update({ user_id: user.id })
      .eq("id", campaignId)
      .is("user_id", null); // Only update if it's still a guest campaign

    if (error) {
      console.error("Error claiming campaign:", error);
      return NextResponse.json(
        { error: "Failed to claim campaign" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Claim campaign error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
