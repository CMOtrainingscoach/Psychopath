import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { chapterWriteSchema } from "@/lib/schemas/admin";

export async function POST(req: Request) {
  const { response } = await requireAdmin();
  if (response) return response;
  const body = await req.json().catch(() => null);
  const parsed = chapterWriteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const admin = createAdminClient();
  let order_index = parsed.data.order_index;
  if (order_index === undefined) {
    const { data: last } = await admin
      .from("chapters")
      .select("order_index")
      .eq("lesson_id", parsed.data.lesson_id)
      .order("order_index", { ascending: false })
      .limit(1)
      .maybeSingle();
    order_index = (last?.order_index ?? -1) + 1;
  }
  const { data, error } = await admin
    .from("chapters")
    .insert({
      ...parsed.data,
      order_index,
      is_published: parsed.data.is_published ?? false,
    })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ chapter: data }, { status: 201 });
}
