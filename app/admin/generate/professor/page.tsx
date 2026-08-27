"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function GenerateProfessorPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [focus, setFocus] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/generate/professor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          focus,
          personality_notes: notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.toString?.() ?? data.error ?? "Generation failed");
      router.push(`/admin/generate/${data.job.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
      setBusy(false);
    }
  }

  return (
    <div className="max-w-xl">
      <Link
        href="/admin/generate"
        className="mb-4 inline-block text-sm font-extrabold text-[var(--pp-brand)]"
      >
        ← AI generate
      </Link>
      <h1 className="mb-2 text-3xl font-black">Generate professor</h1>
      <p className="mb-6 font-semibold text-[var(--pp-muted)]">
        OpenAI drafts a persona. You review and accept before it becomes real.
      </p>

      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-[var(--pp-border)]"
      >
        <label className="block">
          <span className="mb-1 block text-sm font-extrabold">Name</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border-2 border-[var(--pp-border)] px-3 py-2 font-semibold outline-none focus:border-[var(--pp-brand)]"
            placeholder="e.g. Dr. Maya Chen"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-extrabold">Focus / era</span>
          <input
            required
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            className="w-full rounded-xl border-2 border-[var(--pp-border)] px-3 py-2 font-semibold outline-none focus:border-[var(--pp-brand)]"
            placeholder="e.g. Cognitive behavioral therapy, modern clinical"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-extrabold">Personality notes</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="w-full rounded-xl border-2 border-[var(--pp-border)] px-3 py-2 font-semibold outline-none focus:border-[var(--pp-brand)]"
            placeholder="Warm, dry humor, uses everyday metaphors…"
          />
        </label>

        {error && <p className="font-bold text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="rounded-2xl bg-[var(--pp-brand)] px-5 py-2.5 text-sm font-black text-white disabled:opacity-60"
        >
          {busy ? "Generating…" : "Generate draft"}
        </button>
      </form>
    </div>
  );
}
