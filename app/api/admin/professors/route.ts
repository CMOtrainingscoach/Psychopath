import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { professorWriteSchema } from "@/lib/schemas/admin";

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("professors")
    .select("*")
    .order("name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ professors: data });
}

export async function POST(req: Request) {
  const { user, response } = await requireAdmin();
  if (response || !user) return response!;

  const body = await req.json().catch(() => null);
  const parsed = professorWriteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("professors")
    .insert({ ...parsed.data, created_by: user.id })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ professor: data }, { status: 201 });
}
