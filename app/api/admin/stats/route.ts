import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const { user, response } = await requireAdmin();
  if (response || !user) return response!;

  const admin = createAdminClient();
  const [
    { count: courses },
    { count: lessons },
    { count: chapters },
    { count: professors },
    { count: published },
    { data: drafts },
  ] = await Promise.all([
    admin.from("courses").select("*", { count: "exact", head: true }),
    admin.from("lessons").select("*", { count: "exact", head: true }),
    admin.from("chapters").select("*", { count: "exact", head: true }),
    admin.from("professors").select("*", { count: "exact", head: true }),
    admin
      .from("courses")
      .select("*", { count: "exact", head: true })
      .eq("is_published", true),
    admin
      .from("generation_jobs")
      .select("id, type, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  return NextResponse.json({
    counts: {
      courses: courses ?? 0,
      lessons: lessons ?? 0,
      chapters: chapters ?? 0,
      professors: professors ?? 0,
      published_courses: published ?? 0,
    },
    recent_drafts: drafts ?? [],
  });
}
