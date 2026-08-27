"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import type { AvatarConfig } from "@/lib/schemas/avatar";

const HAIRS = ["short", "sides", "bald", "long", "curly"] as const;
const ACCESSORIES = ["none", "cigar", "bowtie"] as const;

const empty: {
  name: string;
  tagline: string;
  bio: string;
  voice_prompt: string;
  sample_phrases: string;
  avatar_config: {
    bg: string;
    hair: "short" | "sides" | "bald" | "long" | "curly";
    hairColor: string;
    beard: boolean;
    mustache: boolean;
    glasses: boolean;
    accessory: "none" | "cigar" | "bowtie";
  };
} = {
  name: "",
  tagline: "",
  bio: "",
  voice_prompt: "",
  sample_phrases: "",
  avatar_config: {
    bg: "#efe9ff",
    hair: "short",
    hairColor: "#6b7280",
    beard: false,
    mustache: false,
    glasses: false,
    accessory: "none",
  },
};

export default function ProfessorEditorPage() {
  const params = useParams<{ id: string }>();
  const isNew = params.id === "new";
  const router = useRouter();
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isNew) return;
    fetch(`/api/admin/professors/${params.id}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      })
      .then((d) => {
        const p = d.professor;
        setForm({
          name: p.name,
          tagline: p.tagline ?? "",
          bio: p.bio ?? "",
          voice_prompt: p.voice_prompt ?? "",
          sample_phrases: Array.isArray(p.sample_phrases)
            ? p.sample_phrases.join("\n")
            : "",
          avatar_config: { ...empty.avatar_config, ...(p.avatar_config ?? {}) },
        });
      })
      .catch((e) => setError(e.message));
  }, [isNew, params.id]);

  const cfg = useMemo(() => form.avatar_config as AvatarConfig, [form.avatar_config]);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      name: form.name,
      tagline: form.tagline,
      bio: form.bio,
      voice_prompt: form.voice_prompt,
      sample_phrases: form.sample_phrases
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      avatar_config: form.avatar_config,
    };
    const res = await fetch(
      isNew ? "/api/admin/professors" : `/api/admin/professors/${params.id}`,
      {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(typeof d.error === "string" ? d.error : "Save failed");
      return;
    }
    const d = await res.json();
    if (isNew) router.replace(`/admin/professors/${d.professor.id}`);
  }

  async function onDelete() {
    if (isNew || !confirm("Delete this professor?")) return;
    const res = await fetch(`/api/admin/professors/${params.id}`, { method: "DELETE" });
    if (res.ok) router.replace("/admin/professors");
  }

  function setCfg<K extends keyof typeof form.avatar_config>(
    key: K,
    value: (typeof form.avatar_config)[K],
  ) {
    setForm((f) => ({ ...f, avatar_config: { ...f.avatar_config, [key]: value } }));
  }

  return (
    <div>
      <Link href="/admin/professors" className="text-sm font-extrabold text-[var(--pp-brand)]">
        ← Professors
      </Link>
      <h1 className="mt-2 mb-6 text-3xl font-black">
        {isNew ? "New professor" : form.name || "Edit professor"}
      </h1>

      <form onSubmit={onSave} className="grid gap-6 lg:grid-cols-[1fr_240px]">
        <div className="space-y-4 rounded-2xl bg-white p-5 ring-1 ring-[var(--pp-border)]">
          {(
            [
              ["name", "Name"],
              ["tagline", "Tagline"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block text-xs font-extrabold tracking-wide text-[var(--pp-muted)]">
              {label}
              <input
                required={key === "name"}
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="mt-1 w-full rounded-xl border-2 border-[var(--pp-border)] px-3 py-2 text-base font-bold"
              />
            </label>
          ))}
          <label className="block text-xs font-extrabold tracking-wide text-[var(--pp-muted)]">
            Bio
            <textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              rows={3}
              className="mt-1 w-full rounded-xl border-2 border-[var(--pp-border)] px-3 py-2 text-base font-semibold"
            />
          </label>
          <label className="block text-xs font-extrabold tracking-wide text-[var(--pp-muted)]">
            Voice prompt
            <textarea
              value={form.voice_prompt}
              onChange={(e) => setForm({ ...form, voice_prompt: e.target.value })}
              rows={4}
              className="mt-1 w-full rounded-xl border-2 border-[var(--pp-border)] px-3 py-2 text-base font-semibold"
            />
          </label>
          <label className="block text-xs font-extrabold tracking-wide text-[var(--pp-muted)]">
            Sample phrases (one per line)
            <textarea
              value={form.sample_phrases}
              onChange={(e) => setForm({ ...form, sample_phrases: e.target.value })}
              rows={3}
              className="mt-1 w-full rounded-xl border-2 border-[var(--pp-border)] px-3 py-2 text-base font-semibold"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-extrabold text-[var(--pp-muted)]">
              Hair
              <select
                value={form.avatar_config.hair}
                onChange={(e) => setCfg("hair", e.target.value as (typeof HAIRS)[number])}
                className="mt-1 w-full rounded-xl border-2 border-[var(--pp-border)] px-3 py-2 font-bold"
              >
                {HAIRS.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-extrabold text-[var(--pp-muted)]">
              Accessory
              <select
                value={form.avatar_config.accessory}
                onChange={(e) =>
                  setCfg("accessory", e.target.value as (typeof ACCESSORIES)[number])
                }
                className="mt-1 w-full rounded-xl border-2 border-[var(--pp-border)] px-3 py-2 font-bold"
              >
                {ACCESSORIES.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-extrabold text-[var(--pp-muted)]">
              Hair color
              <input
                type="color"
                value={form.avatar_config.hairColor}
                onChange={(e) => setCfg("hairColor", e.target.value)}
                className="mt-1 h-10 w-full"
              />
            </label>
            <label className="text-xs font-extrabold text-[var(--pp-muted)]">
              Background
              <input
                type="color"
                value={form.avatar_config.bg}
                onChange={(e) => setCfg("bg", e.target.value)}
                className="mt-1 h-10 w-full"
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-4 text-sm font-bold">
            {(
              [
                ["beard", "Beard"],
                ["mustache", "Mustache"],
                ["glasses", "Glasses"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!form.avatar_config[key]}
                  onChange={(e) => setCfg(key, e.target.checked)}
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        <aside className="flex flex-col items-center gap-4 rounded-2xl bg-white p-5 ring-1 ring-[var(--pp-border)]">
          <div className="text-xs font-extrabold tracking-wide text-[var(--pp-muted)]">
            LIVE PREVIEW
          </div>
          <Avatar cfg={cfg} size={140} />
          <div className="text-center font-black">{form.name || "Name"}</div>
          <div className="text-center text-sm font-semibold text-[var(--pp-muted)]">
            {form.tagline || "Tagline"}
          </div>
        </aside>

        {error && <p className="font-bold text-red-600 lg:col-span-2">{error}</p>}

        <div className="flex gap-3 lg:col-span-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-2xl bg-[var(--pp-brand)] px-5 py-3 font-black text-white disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          {!isNew && (
            <button
              type="button"
              onClick={onDelete}
              className="rounded-2xl border-2 border-red-200 px-5 py-3 font-black text-red-600"
            >
              Delete
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
