import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/courses", label: "Courses" },
  { href: "/admin/professors", label: "Professors" },
  { href: "/admin/generate", label: "AI generate" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role, display_name")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin") redirect("/learn");

  return (
    <div className="min-h-full bg-[#f3f1fa] text-[var(--pp-ink)]">
      <header className="border-b border-[var(--pp-border)] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="text-lg font-black text-[var(--pp-brand)]">
              PsychPath Admin
            </Link>
            <nav className="flex gap-1">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-xl px-3 py-2 text-sm font-extrabold text-[#5b5470] hover:bg-[var(--pp-brand-soft)] hover:text-[var(--pp-brand)]"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm font-bold">
            <span className="text-[var(--pp-muted)]">
              {profile?.display_name ?? "Admin"}
            </span>
            <Link
              href="/learn"
              className="rounded-xl border-2 border-[var(--pp-border)] px-3 py-1.5 hover:border-[var(--pp-brand)]"
            >
              Learner app
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
