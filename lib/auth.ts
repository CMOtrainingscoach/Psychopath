import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    return { user: null, supabase, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { user, supabase, response: null };
}

export async function requireAdmin() {
  const result = await requireUser();
  if (result.response || !result.user) return result;

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", result.user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    return {
      ...result,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return result;
}
