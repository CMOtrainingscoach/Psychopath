import { createAdminClient } from "@/lib/supabase/admin";

const DAILY_LIMIT = 20;

export async function assertGenerationRateLimit(userId: string) {
  const admin = createAdminClient();
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);

  const { count, error } = await admin
    .from("generation_jobs")
    .select("*", { count: "exact", head: true })
    .eq("created_by", userId)
    .gte("created_at", start.toISOString());

  if (error) throw new Error(error.message);
  if ((count ?? 0) >= DAILY_LIMIT) {
    throw new Error(`Daily AI generation limit reached (${DAILY_LIMIT}/day).`);
  }
}
