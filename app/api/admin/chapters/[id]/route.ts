import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { chapterUpdateSchema } from "@/lib/schemas/admin";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { response } = await requireAdmin();
  if (response) return response;
  const { id } = await params;
  const admin = createAdminClient();
  const { data: chapter, error } = await admin
    .from("chapters")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!chapter) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: questions } = await admin
    .from("questions")
    .select("*")
    .eq("owner_type", "chapter")
    .eq("owner_id", id)
    .order("order_index");

  return NextResponse.json({ chapter, questions: questions ?? [] });
}

export async function PATCH(req: Request, { params }: Params) {
  const { response } = await requireAdmin();
  if (response) return response;
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = chapterUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("chapters")
    .update(parsed.data)
    .eq("id", id)
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ chapter: data });
}

export async function DELETE(_req: Request, { params }: Params) {
  const { response } = await requireAdmin();
  if (response) return response;
  const { id } = await params;
  const admin = createAdminClient();
  await admin.from("questions").delete().eq("owner_type", "chapter").eq("owner_id", id);
  const { error } = await admin.from("chapters").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
