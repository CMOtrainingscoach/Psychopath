"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/Avatar";
import type { AvatarConfig } from "@/lib/schemas/avatar";

type Professor = {
  id: string;
  name: string;
  tagline: string;
  avatar_config: AvatarConfig;
};

export default function ProfessorsPage() {
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/professors")
      .then(async (r) => {
        if (!r.ok) throw new Error("Failed to load professors");
        return r.json();
      })
      .then((d) => setProfessors(d.professors))
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">Professors</h1>
          <p className="font-semibold text-[var(--pp-muted)]">
            Personas, avatars, and voice prompts.
          </p>
        </div>
        <Link
          href="/admin/professors/new"
          className="rounded-2xl bg-[var(--pp-brand)] px-4 py-2.5 text-sm font-black text-white"
        >
          New professor
        </Link>
      </div>

      {error && <p className="font-bold text-red-600">{error}</p>}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {professors.map((p) => (
          <Link
            key={p.id}
            href={`/admin/professors/${p.id}`}
            className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[var(--pp-border)] hover:ring-[var(--pp-brand)]"
          >
            <Avatar cfg={p.avatar_config} size={56} />
            <div>
              <div className="font-black">{p.name}</div>
              <div className="text-sm font-semibold text-[var(--pp-muted)]">
                {p.tagline}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
