import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { courseWriteSchema } from "@/lib/schemas/admin";

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("courses")
    .select("*, lessons(count)")
    .order("order_index");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    courses: (data ?? []).map((c) => ({
      ...c,
      lesson_count: Array.isArray(c.lessons)
        ? (c.lessons[0] as { count?: number })?.count ?? 0
        : 0,
      lessons: undefined,
    })),
  });
}

export async function POST(req: Request) {
  const { response } = await requireAdmin();
  if (response) return response;
  const body = await req.json().catch(() => null);
  const parsed = courseWriteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const admin = createAdminClient();
  let order_index = parsed.data.order_index;
  if (order_index === undefined) {
    const { data: last } = await admin
      .from("courses")
      .select("order_index")
      .order("order_index", { ascending: false })
      .limit(1)
      .maybeSingle();
    order_index = (last?.order_index ?? -1) + 1;
  }
  const { data, error } = await admin
    .from("courses")
    .insert({ ...parsed.data, order_index, is_published: parsed.data.is_published ?? false })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ course: data }, { status: 201 });
}
