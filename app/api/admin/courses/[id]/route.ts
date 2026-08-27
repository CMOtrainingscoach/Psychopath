import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { courseWriteSchema } from "@/lib/schemas/admin";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { response } = await requireAdmin();
  if (response) return response;
  const { id } = await params;
  const admin = createAdminClient();
  const { data: course, error } = await admin
    .from("courses")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: lessons, error: lErr } = await admin
    .from("lessons")
    .select("*, chapters(count)")
    .eq("course_id", id)
    .order("order_index");
  if (lErr) return NextResponse.json({ error: lErr.message }, { status: 500 });

  return NextResponse.json({
    course,
    lessons: (lessons ?? []).map((l) => ({
      ...l,
      chapter_count: Array.isArray(l.chapters)
        ? (l.chapters[0] as { count?: number })?.count ?? 0
        : 0,
      chapters: undefined,
    })),
  });
}

export async function PATCH(req: Request, { params }: Params) {
  const { response } = await requireAdmin();
  if (response) return response;
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = courseWriteSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("courses")
    .update(parsed.data)
    .eq("id", id)
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ course: data });
}

export async function DELETE(_req: Request, { params }: Params) {
  const { response } = await requireAdmin();
  if (response) return response;
  const { id } = await params;
  const admin = createAdminClient();
  const { error } = await admin.from("courses").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
