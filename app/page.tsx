import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/learn");

  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-col px-5 py-16">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div
          className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl text-4xl shadow-lg"
          style={{
            background: "linear-gradient(145deg, #7b6cf0, #6c5ce7)",
            boxShadow: "0 14px 32px rgba(108, 92, 231, 0.28)",
          }}
          aria-hidden
        >
          🧠
        </div>
        <p className="mb-2 text-sm font-extrabold tracking-widest text-[var(--pp-brand)]">
          PSYCHPATH
        </p>
        <h1 className="mb-3 text-4xl font-black leading-tight text-[var(--pp-ink)]">
          Master psychology,
          <br />
          one chapter at a time.
        </h1>
        <p className="mb-10 max-w-sm text-base font-semibold leading-relaxed text-[var(--pp-muted)]">
          A Duolingo-style path for master&apos;s prep — XP, streaks, and cartoon
          professors guiding every lesson.
        </p>
        <div className="flex w-full flex-col gap-3">
          <Link
            href="/signup"
            className="rounded-2xl bg-[var(--pp-brand)] px-5 py-3.5 text-center text-base font-black text-white shadow-md transition hover:brightness-105"
          >
            Get started
          </Link>
          <Link
            href="/login"
            className="rounded-2xl border-2 border-[var(--pp-border)] bg-white px-5 py-3.5 text-center text-base font-black text-[var(--pp-ink)]"
          >
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
