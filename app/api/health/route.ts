import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anon = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const service = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? null;
  const aiConfigured = Boolean(process.env.OPENAI_API_KEY);

  const configured = Boolean(url && anon && service);
  let supabase = false;
  let reason: string | undefined;

  if (!configured) {
    reason = "missing_env";
  } else {
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const client = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { error } = await client.from("profiles").select("id").limit(1);
      if (error) {
        const missing =
          error.message?.toLowerCase().includes("does not exist") ||
          error.code === "PGRST205" ||
          error.code === "42P01";
        supabase = missing;
        if (!missing) reason = error.message;
        else supabase = true;
      } else {
        supabase = true;
      }
    } catch (err) {
      reason = err instanceof Error ? err.message : "unknown_error";
    }
  }

  const healthy = configured && supabase;

  return NextResponse.json(
    {
      ok: healthy,
      configured,
      supabase,
      ai: { configured: aiConfigured },
      appUrl,
      env: {
        hasUrl: Boolean(url),
        hasAnon: anon,
        hasService: service,
        hasAppUrl: Boolean(appUrl),
      },
      reason,
      checkedAt: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503 },
  );
}
