import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  if (!configured) {
    return NextResponse.json({ ok: false, supabase: false, reason: "missing_env" });
  }

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("profiles").select("id").limit(1);

    // Before Phase 1 migrations, the profiles table may not exist yet.
    // A successful HTTP round-trip still proves credentials + connectivity.
    if (error && error.code !== "PGRST116" && error.code !== "42P01") {
      // PGRST116 = no rows; 42P01 / PostgREST schema miss often surfaces as other codes
      const missingRelation =
        error.message?.toLowerCase().includes("does not exist") ||
        error.code === "PGRST205";

      if (!missingRelation) {
        return NextResponse.json({
          ok: true,
          supabase: false,
          reason: error.message,
        });
      }
    }

    return NextResponse.json({ ok: true, supabase: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown_error";
    return NextResponse.json({ ok: false, supabase: false, reason: message });
  }
}
