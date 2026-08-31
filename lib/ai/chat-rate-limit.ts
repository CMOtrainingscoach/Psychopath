import { createAdminClient } from "@/lib/supabase/admin";

const DAILY_CHAT_LIMIT = 50;

export async function assertProfessorChatRateLimit(userId: string) {
  const admin = createAdminClient();
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);

  const { count, error } = await admin
    .from("generation_jobs")
    .select("*", { count: "exact", head: true })
    .eq("created_by", userId)
    .eq("type", "professor_chat")
    .gte("created_at", start.toISOString());

  if (error) throw new Error(error.message);
  if ((count ?? 0) >= DAILY_CHAT_LIMIT) {
    throw new Error(`Daily professor chat limit reached (${DAILY_CHAT_LIMIT}/day).`);
  }
}
