"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { ContentCard } from "@/lib/schemas/content";

type Question = {
  id: string;
  prompt: string;
  options: string[];
  answer_index: number;
  explanation: string;
};

const CARD_TYPES = ["idea", "eg", "tip", "name"] as const;

export default function ChapterEditorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [lessonId, setLessonId] = useState("");
  const [title, setTitle] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [cards, setCards] = useState<ContentCard[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch(`/api/admin/chapters/${id}`);
    if (!res.ok) throw new Error("Failed to load chapter");
    const d = await res.json();
    setLessonId(d.chapter.lesson_id);
    setTitle(d.chapter.title);
    setIsPublished(d.chapter.is_published);
    setCards(Array.isArray(d.chapter.cards) ? d.chapter.cards : []);
    setQuestions(d.questions ?? []);
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [id]);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/admin/chapters/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, cards, is_published: isPublished }),
    });
    setSaving(false);
    if (!res.ok) setError("Save failed");
  }

  function updateCard(i: number, patch: Partial<ContentCard>) {
    setCards((prev) => prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  }

  function moveCard(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= cards.length) return;
    setCards((prev) => {
      const next = [...prev];
      [next[i], next[j]] = [next[j]!, next[i]!];
      return next;
    });
  }

  async function addQuestion() {
    const res = await fetch("/api/admin/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        owner_type: "chapter",
        owner_id: id,
        prompt: "New quiz question",
        options: ["Option A", "Option B", "Option C", "Option D"],
        answer_index: 0,
        explanation: "",
        type: "mcq",
      }),
    });
    if (res.ok) await load();
  }

  async function saveQuestion(q: Question, patch: Partial<Question>) {
    await fetch(`/api/admin/questions/${q.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    await load();
  }

  async function deleteQuestion(qid: string) {
    if (!confirm("Delete question?")) return;
    await fetch(`/api/admin/questions/${qid}`, { method: "DELETE" });
    await load();
  }

  async function onDelete() {
    if (!confirm("Delete this chapter?")) return;
    const res = await fetch(`/api/admin/chapters/${id}`, { method: "DELETE" });
    if (res.ok) router.replace(`/admin/lessons/${lessonId}`);
  }

  return (
    <div>
      <Link
        href={lessonId ? `/admin/lessons/${lessonId}` : "/admin/courses"}
        className="text-sm font-extrabold text-[var(--pp-brand)]"
      >
        ← Lesson
      </Link>
      <h1 className="mt-2 mb-6 text-3xl font-black">{title || "Chapter"}</h1>
      {error && <p className="mb-4 font-bold text-red-600">{error}</p>}

      <form
        onSubmit={onSave}
        className="mb-8 space-y-4 rounded-2xl bg-white p-5 ring-1 ring-[var(--pp-border)]"
      >
        <label className="block text-xs font-extrabold text-[var(--pp-muted)]">
          Title
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-xl border-2 border-[var(--pp-border)] px-3 py-2 font-bold"
          />
        </label>
        <label className="flex items-center gap-2 text-sm font-bold">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
          />
          Published
        </label>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-black">Teaching cards</h2>
            <button
              type="button"
              onClick={() =>
                setCards((c) => [
                  ...c,
                  { type: "idea", heading: "New card", body: "Write content here." },
                ])
              }
              className="rounded-xl bg-[var(--pp-brand-soft)] px-3 py-1 text-sm font-black text-[var(--pp-brand)]"
            >
              Add card
            </button>
          </div>
          <div className="space-y-3">
            {cards.map((card, i) => (
              <div
                key={i}
                className="rounded-xl border-2 border-[var(--pp-border)] p-3"
              >
                <div className="mb-2 flex gap-2">
                  <select
                    value={card.type}
                    onChange={(e) =>
                      updateCard(i, { type: e.target.value as ContentCard["type"] })
                    }
                    className="rounded-lg border border-[var(--pp-border)] px-2 py-1 text-sm font-bold"
                  >
                    {CARD_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <button type="button" onClick={() => moveCard(i, -1)} className="px-2 font-black">
                    ↑
                  </button>
                  <button type="button" onClick={() => moveCard(i, 1)} className="px-2 font-black">
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => setCards((c) => c.filter((_, idx) => idx !== i))}
                    className="ml-auto text-sm font-black text-red-600"
                  >
                    Remove
                  </button>
                </div>
                <input
                  value={card.heading}
                  onChange={(e) => updateCard(i, { heading: e.target.value })}
                  className="mb-2 w-full rounded-lg border border-[var(--pp-border)] px-2 py-1 font-bold"
                  placeholder="Heading"
                />
                <textarea
                  value={card.body}
                  onChange={(e) => updateCard(i, { body: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border border-[var(--pp-border)] px-2 py-1 font-semibold"
                  placeholder="Body"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-2xl bg-[var(--pp-brand)] px-5 py-3 font-black text-white"
          >
            {saving ? "Saving…" : "Save chapter"}
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-2xl border-2 border-red-200 px-5 py-3 font-black text-red-600"
          >
            Delete
          </button>
        </div>
      </form>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-black">Chapter quiz</h2>
          <button
            type="button"
            onClick={addQuestion}
            className="rounded-2xl bg-[var(--pp-brand)] px-4 py-2 text-sm font-black text-white"
          >
            Add question
          </button>
        </div>
        <div className="space-y-4">
          {questions.map((q, qi) => (
            <InlineQuestion
              key={q.id}
              index={qi}
              question={q}
              onSave={(patch) => saveQuestion(q, patch)}
              onDelete={() => deleteQuestion(q.id)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function InlineQuestion({
  index,
  question,
  onSave,
  onDelete,
}: {
  index: number;
  question: Question;
  onSave: (patch: Partial<Question>) => void;
  onDelete: () => void;
}) {
  const [prompt, setPrompt] = useState(question.prompt);
  const [options, setOptions] = useState(question.options.join("\n"));
  const [answerIndex, setAnswerIndex] = useState(question.answer_index);
  const [explanation, setExplanation] = useState(question.explanation);

  useEffect(() => {
    setPrompt(question.prompt);
    setOptions(question.options.join("\n"));
    setAnswerIndex(question.answer_index);
    setExplanation(question.explanation);
  }, [question]);

  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-[var(--pp-border)]">
      <div className="mb-2 text-xs font-extrabold text-[var(--pp-muted)]">
        Q{index + 1}
      </div>
      <input
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="mb-2 w-full rounded-xl border-2 border-[var(--pp-border)] px-3 py-2 font-bold"
      />
      <textarea
        value={options}
        onChange={(e) => setOptions(e.target.value)}
        rows={4}
        className="mb-2 w-full rounded-xl border-2 border-[var(--pp-border)] px-3 py-2 font-semibold"
      />
      <input
        type="number"
        min={0}
        value={answerIndex}
        onChange={(e) => setAnswerIndex(Number(e.target.value))}
        className="mb-2 w-full rounded-xl border-2 border-[var(--pp-border)] px-3 py-2 font-bold"
      />
      <textarea
        value={explanation}
        onChange={(e) => setExplanation(e.target.value)}
        rows={2}
        className="mb-3 w-full rounded-xl border-2 border-[var(--pp-border)] px-3 py-2 font-semibold"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() =>
            onSave({
              prompt,
              options: options
                .split("\n")
                .map((s) => s.trim())
                .filter(Boolean),
              answer_index: answerIndex,
              explanation,
            })
          }
          className="rounded-xl bg-[var(--pp-brand)] px-3 py-1.5 text-sm font-black text-white"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-xl border-2 border-red-200 px-3 py-1.5 text-sm font-black text-red-600"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
