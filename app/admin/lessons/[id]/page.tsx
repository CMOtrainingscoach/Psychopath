"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Professor = { id: string; name: string };
type Chapter = {
  id: string;
  title: string;
  order_index: number;
  is_published: boolean;
};
type Question = {
  id: string;
  prompt: string;
  options: string[];
  answer_index: number;
  explanation: string;
  order_index: number;
};

export default function LessonEditorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [courseId, setCourseId] = useState<string>("");
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [checkpoint, setCheckpoint] = useState<Question[]>([]);
  const [form, setForm] = useState({
    title: "",
    professor_id: "",
    is_published: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    const [lessonRes, profRes] = await Promise.all([
      fetch(`/api/admin/lessons/${id}`),
      fetch("/api/admin/professors"),
    ]);
    if (!lessonRes.ok) throw new Error("Failed to load lesson");
    const d = await lessonRes.json();
    const p = await profRes.json();
    setProfessors(p.professors ?? []);
    setCourseId(d.lesson.course_id);
    setForm({
      title: d.lesson.title,
      professor_id: d.lesson.professor_id ?? "",
      is_published: d.lesson.is_published,
    });
    setChapters(d.chapters ?? []);
    setCheckpoint(d.checkpoint ?? []);
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [id]);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/admin/lessons/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        professor_id: form.professor_id || null,
        is_published: form.is_published,
      }),
    });
    setSaving(false);
    if (!res.ok) setError("Save failed");
  }

  async function addChapter() {
    const title = prompt("Chapter title?");
    if (!title) return;
    const res = await fetch("/api/admin/chapters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lesson_id: id, title, cards: [], is_published: false }),
    });
    if (res.ok) {
      const d = await res.json();
      router.push(`/admin/chapters/${d.chapter.id}`);
    }
  }

  async function moveChapter(ch: Chapter, dir: -1 | 1) {
    const idx = chapters.findIndex((x) => x.id === ch.id);
    const swap = chapters[idx + dir];
    if (!swap) return;
    await fetch("/api/admin/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        table: "chapters",
        items: [
          { id: ch.id, order_index: swap.order_index },
          { id: swap.id, order_index: ch.order_index },
        ],
      }),
    });
    await load();
  }

  async function addCheckpointQuestion() {
    const res = await fetch("/api/admin/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        owner_type: "lesson",
        owner_id: id,
        prompt: "New checkpoint question",
        options: ["Option A", "Option B", "Option C", "Option D"],
        answer_index: 0,
        explanation: "",
        type: "mcq",
      }),
    });
    if (res.ok) await load();
  }

  async function updateQuestion(q: Question, patch: Partial<Question>) {
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
    if (!confirm("Delete this lesson?")) return;
    const res = await fetch(`/api/admin/lessons/${id}`, { method: "DELETE" });
    if (res.ok) router.replace(`/admin/courses/${courseId}`);
  }

  return (
    <div>
      <Link
        href={courseId ? `/admin/courses/${courseId}` : "/admin/courses"}
        className="text-sm font-extrabold text-[var(--pp-brand)]"
      >
        ← Course
      </Link>
      <h1 className="mt-2 mb-6 text-3xl font-black">{form.title || "Lesson"}</h1>

      {error && <p className="mb-4 font-bold text-red-600">{error}</p>}

      <form
        onSubmit={onSave}
        className="mb-8 space-y-4 rounded-2xl bg-white p-5 ring-1 ring-[var(--pp-border)]"
      >
        <label className="block text-xs font-extrabold text-[var(--pp-muted)]">
          Title
          <input
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="mt-1 w-full rounded-xl border-2 border-[var(--pp-border)] px-3 py-2 font-bold"
          />
        </label>
        <label className="block text-xs font-extrabold text-[var(--pp-muted)]">
          Professor override
          <select
            value={form.professor_id}
            onChange={(e) => setForm({ ...form, professor_id: e.target.value })}
            className="mt-1 w-full rounded-xl border-2 border-[var(--pp-border)] px-3 py-2 font-bold"
          >
            <option value="">Use course default</option>
            {professors.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm font-bold">
          <input
            type="checkbox"
            checked={form.is_published}
            onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
          />
          Published
        </label>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-2xl bg-[var(--pp-brand)] px-5 py-3 font-black text-white"
          >
            Save lesson
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

      <section className="mb-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-black">Chapters</h2>
          <button
            type="button"
            onClick={addChapter}
            className="rounded-2xl bg-[var(--pp-brand)] px-4 py-2 text-sm font-black text-white"
          >
            Add chapter
          </button>
        </div>
        <div className="space-y-2">
          {chapters.map((ch, i) => (
            <div
              key={ch.id}
              className="flex flex-wrap items-center gap-2 rounded-2xl bg-white p-3 ring-1 ring-[var(--pp-border)]"
            >
              <div className="flex-1 font-black">
                <Link
                  href={`/admin/chapters/${ch.id}`}
                  className="hover:text-[var(--pp-brand)]"
                >
                  {ch.title}
                </Link>
                <div className="text-xs font-semibold text-[var(--pp-muted)]">
                  {ch.is_published ? "Published" : "Draft"}
                </div>
              </div>
              <button
                type="button"
                disabled={i === 0}
                onClick={() => moveChapter(ch, -1)}
                className="rounded-xl border-2 border-[var(--pp-border)] px-2 py-1 text-sm font-black disabled:opacity-40"
              >
                ↑
              </button>
              <button
                type="button"
                disabled={i === chapters.length - 1}
                onClick={() => moveChapter(ch, 1)}
                className="rounded-xl border-2 border-[var(--pp-border)] px-2 py-1 text-sm font-black disabled:opacity-40"
              >
                ↓
              </button>
              <Link
                href={`/admin/chapters/${ch.id}`}
                className="rounded-xl bg-[var(--pp-brand-soft)] px-3 py-1 text-sm font-black text-[var(--pp-brand)]"
              >
                Edit
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-black">Checkpoint quiz</h2>
          <button
            type="button"
            onClick={addCheckpointQuestion}
            className="rounded-2xl bg-[var(--pp-brand)] px-4 py-2 text-sm font-black text-white"
          >
            Add question
          </button>
        </div>
        <div className="space-y-4">
          {checkpoint.map((q, qi) => (
            <QuestionEditor
              key={q.id}
              index={qi}
              question={q}
              onSave={(patch) => updateQuestion(q, patch)}
              onDelete={() => deleteQuestion(q.id)}
            />
          ))}
          {checkpoint.length === 0 && (
            <p className="font-semibold text-[var(--pp-muted)]">No checkpoint questions.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function QuestionEditor({
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
        Question {index + 1}
      </div>
      <input
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="mb-2 w-full rounded-xl border-2 border-[var(--pp-border)] px-3 py-2 font-bold"
      />
      <label className="mb-2 block text-xs font-extrabold text-[var(--pp-muted)]">
        Options (one per line)
        <textarea
          value={options}
          onChange={(e) => setOptions(e.target.value)}
          rows={4}
          className="mt-1 w-full rounded-xl border-2 border-[var(--pp-border)] px-3 py-2 font-semibold"
        />
      </label>
      <label className="mb-2 block text-xs font-extrabold text-[var(--pp-muted)]">
        Correct option index (0-based)
        <input
          type="number"
          min={0}
          value={answerIndex}
          onChange={(e) => setAnswerIndex(Number(e.target.value))}
          className="mt-1 w-full rounded-xl border-2 border-[var(--pp-border)] px-3 py-2 font-bold"
        />
      </label>
      <textarea
        value={explanation}
        onChange={(e) => setExplanation(e.target.value)}
        placeholder="Explanation"
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
          Save question
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
