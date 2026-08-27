"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import type { AvatarConfig } from "@/lib/schemas/avatar";

type PreviewCourse = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  color: string;
  icon: string;
  is_published: boolean;
  professor: { name: string; tagline: string; avatar_config: AvatarConfig } | null;
  lessons: Array<{
    id: string;
    title: string;
    is_published: boolean;
    professor: { name: string; tagline: string; avatar_config: AvatarConfig } | null;
    chapters: Array<{
      id: string;
      title: string;
      is_published: boolean;
      cards: Array<{ type: string; heading: string; body: string }>;
      quiz: Array<{ prompt: string; options: string[]; answer_index: number }>;
    }>;
    checkpoint: Array<{ prompt: string }>;
  }>;
};

export default function AdminPreviewPage() {
  const { slug } = useParams<{ slug: string }>();
  const [course, setCourse] = useState<PreviewCourse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openLesson, setOpenLesson] = useState<string | null>(null);
  const [openChapter, setOpenChapter] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/admin/preview/${slug}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("Failed to load preview");
        return r.json();
      })
      .then((d) => {
        setCourse(d.course);
        if (d.course.lessons[0]) setOpenLesson(d.course.lessons[0].id);
      })
      .catch((e) => setError(e.message));
  }, [slug]);

  if (error) return <p className="font-bold text-red-600">{error}</p>;
  if (!course) return <p className="font-bold text-[var(--pp-muted)]">Loading preview…</p>;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/courses" className="text-sm font-extrabold text-[var(--pp-brand)]">
          ← Courses
        </Link>
        <div className="rounded-xl bg-amber-100 px-3 py-1 text-xs font-extrabold text-amber-800">
          Admin preview {course.is_published ? "" : "· includes unpublished"}
        </div>
      </div>

      <div
        className="mb-6 flex items-center gap-4 rounded-2xl p-5 text-white"
        style={{
          background: `linear-gradient(135deg, ${course.color}, ${course.color}cc)`,
        }}
      >
        <div className="flex-1">
          <div className="text-xs font-extrabold tracking-wide opacity-80">
            {course.icon} PREVIEW
          </div>
          <h1 className="text-2xl font-black">{course.title}</h1>
          <p className="font-semibold opacity-90">{course.subtitle}</p>
        </div>
        {course.professor && (
          <div className="text-center">
            <Avatar cfg={course.professor.avatar_config} size={72} />
            <div className="mt-1 text-xs font-bold">{course.professor.name}</div>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {course.lessons.map((lesson) => (
          <div
            key={lesson.id}
            className="rounded-2xl bg-white ring-1 ring-[var(--pp-border)]"
          >
            <button
              type="button"
              className="flex w-full items-center justify-between px-4 py-3 text-left"
              onClick={() =>
                setOpenLesson((v) => (v === lesson.id ? null : lesson.id))
              }
            >
              <div>
                <div className="font-black">{lesson.title}</div>
                <div className="text-xs font-semibold text-[var(--pp-muted)]">
                  {lesson.chapters.length} chapters · {lesson.checkpoint.length}{" "}
                  checkpoint Qs · {lesson.is_published ? "Published" : "Draft"}
                </div>
              </div>
              <span className="font-black">{openLesson === lesson.id ? "▾" : "▸"}</span>
            </button>
            {openLesson === lesson.id && (
              <div className="space-y-2 border-t border-[var(--pp-border)] px-4 py-3">
                {lesson.chapters.map((ch) => (
                  <div key={ch.id} className="rounded-xl bg-[#f7f5fc] p-3">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between text-left"
                      onClick={() =>
                        setOpenChapter((v) => (v === ch.id ? null : ch.id))
                      }
                    >
                      <span className="font-extrabold">
                        {ch.title}{" "}
                        <span className="text-xs text-[var(--pp-muted)]">
                          ({ch.is_published ? "pub" : "draft"})
                        </span>
                      </span>
                      <span>{openChapter === ch.id ? "▾" : "▸"}</span>
                    </button>
                    {openChapter === ch.id && (
                      <div className="mt-3 space-y-2">
                        {ch.cards.map((card, i) => (
                          <div
                            key={i}
                            className="rounded-lg bg-white p-3 text-sm shadow-sm"
                          >
                            <div className="text-[10px] font-extrabold tracking-wide text-[var(--pp-brand)]">
                              {card.type.toUpperCase()}
                            </div>
                            <div className="font-black">{card.heading}</div>
                            <div className="font-semibold text-[#5b5470]">{card.body}</div>
                          </div>
                        ))}
                        <div className="text-xs font-bold text-[var(--pp-muted)]">
                          Quiz: {ch.quiz.length} questions
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
