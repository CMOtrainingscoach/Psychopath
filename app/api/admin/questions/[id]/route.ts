import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { questionUpdateSchema } from "@/lib/schemas/admin";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const { response } = await requireAdmin();
  if (response) return response;
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = questionUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  if (
    parsed.data.options &&
    parsed.data.answer_index !== undefined &&
    parsed.data.answer_index >= parsed.data.options.length
  ) {
    return NextResponse.json({ error: "answer_index out of range" }, { status: 400 });
  }
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("questions")
    .update(parsed.data)
    .eq("id", id)
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ question: data });
}

export async function DELETE(_req: Request, { params }: Params) {
  const { response } = await requireAdmin();
  if (response) return response;
  const { id } = await params;
  const admin = createAdminClient();
  const { error } = await admin.from("questions").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
