import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { questionWriteSchema } from "@/lib/schemas/admin";

export async function POST(req: Request) {
  const { response } = await requireAdmin();
  if (response) return response;
  const body = await req.json().catch(() => null);
  const parsed = questionWriteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  if (parsed.data.answer_index >= parsed.data.options.length) {
    return NextResponse.json({ error: "answer_index out of range" }, { status: 400 });
  }
  const admin = createAdminClient();
  let order_index = parsed.data.order_index;
  if (order_index === undefined) {
    const { data: last } = await admin
      .from("questions")
      .select("order_index")
      .eq("owner_type", parsed.data.owner_type)
      .eq("owner_id", parsed.data.owner_id)
      .order("order_index", { ascending: false })
      .limit(1)
      .maybeSingle();
    order_index = (last?.order_index ?? -1) + 1;
  }
  const { data, error } = await admin
    .from("questions")
    .insert({ ...parsed.data, order_index })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ question: data }, { status: 201 });
}
