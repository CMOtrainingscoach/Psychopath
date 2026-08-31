"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { InstallPrompt } from "@/components/InstallPrompt";
import { OfflineBanner } from "@/components/OfflineBanner";
import {
  ProfessorChat,
  type ProfessorChatContext,
} from "@/components/ProfessorChat";
import { PASS_RATIO, levelFromXP } from "@/lib/gamification";
import { shade } from "@/lib/learner";
import { createClient } from "@/lib/supabase/client";
import type {
  Chapter,
  CourseDetail,
  CourseListItem,
  CourseProgress,
  Lesson,
  MeResponse,
  Professor,
  QuizQuestionPublic,
} from "@/lib/types/learner";
import type { AvatarConfig } from "@/lib/schemas/avatar";
import type { ContentCard } from "@/lib/schemas/content";

type View = "home" | "chapter" | "quiz" | "result" | "profile";

type PathNode =
  | { kind: "chapter"; id: string; chapter: Chapter; lesson: Lesson }
  | { kind: "test"; id: string; lesson: Lesson };

type QuizState = {
  lesson: Lesson;
  chapter: Chapter | null;
  mode: "small" | "big";
  qs: QuizQuestionPublic[];
  ownerType: "chapter" | "lesson";
  ownerId: string;
  answers: number[];
  i: number;
  picked: number | null;
  revealed: boolean;
  wrong: boolean;
  latest?: {
    correct: boolean;
    answer_index: number;
    explanation: string;
  };
  done?: boolean;
  earned?: number;
  passed?: boolean;
  total?: number;
  correctFinal?: number;
};

function asCards(raw: unknown): ContentCard[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((c) => {
    const obj = c as Record<string, unknown>;
    return {
      type: (obj.type ?? obj.t ?? "idea") as ContentCard["type"],
      heading: String(obj.heading ?? obj.h ?? ""),
      body: String(obj.body ?? obj.b ?? ""),
    };
  });
}

function professorCfg(p: Professor | null | undefined): AvatarConfig {
  return (p?.avatar_config ?? {}) as AvatarConfig;
}

function ProfessorAvatarButton({
  professor,
  size,
  ringColor,
  onChat,
}: {
  professor: Professor | null | undefined;
  size: number;
  ringColor?: string;
  onChat: () => void;
}) {
  if (!professor) {
    return <Avatar cfg={{}} size={size} />;
  }
  return (
    <button
      type="button"
      className="pp-press"
      onClick={onChat}
      aria-label={`Chat with ${professor.name}`}
      title={`Chat with ${professor.name}`}
      style={{
        border: "none",
        background: "transparent",
        padding: 0,
        borderRadius: "50%",
        cursor: "pointer",
        boxShadow: ringColor ? `0 0 0 4px ${ringColor}33` : undefined,
      }}
    >
      <Avatar cfg={professorCfg(professor)} size={size} />
    </button>
  );
}

export function PsychPathApp() {
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState<View>("home");
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [slug, setSlug] = useState<string>("foundations");
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [progress, setProgress] = useState<CourseProgress>({
    chapters: {},
    lessons: {},
  });
  const [me, setMe] = useState<MeResponse | null>(null);
  const [showPaths, setShowPaths] = useState(false);
  const [active, setActive] = useState<{
    lesson: Lesson;
    chapter: Chapter;
  } | null>(null);
  const [quiz, setQuiz] = useState<QuizState | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chat, setChat] = useState<{
    professor: Professor;
    context: ProfessorChatContext;
  } | null>(null);

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const openProfessorChat = (
    professor: Professor | null | undefined,
    context: ProfessorChatContext,
  ) => {
    if (!professor) return;
    setChat({ professor, context });
  };

  const loadMe = useCallback(async () => {
    const res = await fetch("/api/me");
    if (!res.ok) throw new Error("Failed to load profile");
    const data = (await res.json()) as MeResponse;
    setMe(data);
    return data;
  }, []);

  const loadCourses = useCallback(async () => {
    const res = await fetch("/api/courses");
    if (!res.ok) throw new Error("Failed to load courses");
    const data = (await res.json()) as { courses: CourseListItem[] };
    setCourses(data.courses);
    return data.courses;
  }, []);

  const loadCourse = useCallback(async (courseSlug: string) => {
    const res = await fetch(`/api/courses/${courseSlug}`);
    if (!res.ok) throw new Error("Failed to load course");
    const data = (await res.json()) as {
      course: CourseDetail;
      progress: CourseProgress;
    };
    const normalized: CourseDetail = {
      ...data.course,
      lessons: data.course.lessons.map((l) => ({
        ...l,
        chapters: l.chapters.map((ch) => ({
          ...ch,
          cards: asCards(ch.cards),
        })),
      })),
    };
    setCourse(normalized);
    setProgress(data.progress);
    setSlug(courseSlug);
    return normalized;
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [list] = await Promise.all([loadCourses(), loadMe()]);
        const initial = list.find((c) => c.slug === "foundations")?.slug ?? list[0]?.slug;
        if (initial) await loadCourse(initial);
        setLoaded(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
        setLoaded(true);
      }
    })();
  }, [loadCourses, loadCourse, loadMe]);

  const pathNodes: PathNode[] = useMemo(() => {
    if (!course) return [];
    const out: PathNode[] = [];
    for (const lesson of course.lessons) {
      for (const chapter of lesson.chapters) {
        out.push({ kind: "chapter", id: chapter.id, chapter, lesson });
      }
      out.push({ kind: "test", id: `${lesson.id}-test`, lesson });
    }
    return out;
  }, [course]);

  const isChapterDone = (id: string) => !!progress.chapters[id];
  const isTestPassed = (lessonId: string) => !!progress.lessons[lessonId]?.passed;

  const nodeStatus = (i: number): "done" | "current" | "locked" => {
    const n = pathNodes[i]!;
    const done =
      n.kind === "chapter" ? isChapterDone(n.id) : isTestPassed(n.lesson.id);
    if (done) return "done";
    if (i === 0) return "current";
    const prev = pathNodes[i - 1]!;
    const prevDone =
      prev.kind === "chapter"
        ? isChapterDone(prev.id)
        : isTestPassed(prev.lesson.id);
    return prevDone ? "current" : "locked";
  };

  const startQuiz = (lesson: Lesson, chapter: Chapter | null, mode: "small" | "big") => {
    const qs = mode === "big" ? lesson.checkpoint : chapter!.quiz;
    setQuiz({
      lesson,
      chapter,
      mode,
      qs,
      ownerType: mode === "big" ? "lesson" : "chapter",
      ownerId: mode === "big" ? lesson.id : chapter!.id,
      answers: [],
      i: 0,
      picked: null,
      revealed: false,
      wrong: false,
    });
    setView("quiz");
  };

  const openChapter = (chapter: Chapter, lesson: Lesson) => {
    setActive({ lesson, chapter });
    setView("chapter");
  };

  const pick = async (idx: number) => {
    if (!quiz || quiz.revealed) return;
    if (!navigator.onLine) {
      flash("You're offline — quiz grading needs a connection.");
      return;
    }
    const answers = [...quiz.answers, idx];
    setQuiz({ ...quiz, picked: idx, revealed: false, wrong: false });

    const res = await fetch("/api/quiz/grade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ownerType: quiz.ownerType,
        ownerId: quiz.ownerId,
        answers,
      }),
    });
    if (!res.ok) {
      flash("Could not grade answer");
      setQuiz({ ...quiz, picked: null });
      return;
    }
    const data = await res.json();

    if (!data.complete) {
      const latest = data.latest as {
        correct: boolean;
        answer_index: number;
        explanation: string;
      };
      setQuiz({
        ...quiz,
        answers,
        picked: idx,
        revealed: true,
        wrong: !latest.correct,
        latest,
      });
      return;
    }

    // Full quiz graded
    setQuiz({
      ...quiz,
      answers,
      picked: idx,
      revealed: true,
      wrong: !data.results[data.results.length - 1]?.correct,
      latest: {
        correct: data.results[data.results.length - 1].correct,
        answer_index: data.results[data.results.length - 1].answer_index,
        explanation: data.results[data.results.length - 1].explanation,
      },
      done: true,
      earned: data.earned,
      passed: data.passed,
      total: data.total,
      correctFinal: data.correct,
    });
    if (me && data.stats) {
      const lv = levelFromXP(data.stats.total_xp);
      setMe({
        ...me,
        stats: {
          ...me.stats,
          total_xp: data.stats.total_xp,
          streak: data.stats.streak,
          level: lv.level,
          level_into: lv.into,
          level_span: lv.span,
        },
      });
    }
  };

  const nextQ = async () => {
    if (!quiz) return;
    if (quiz.done && quiz.revealed) {
      // Refresh course progress then show result
      await loadCourse(slug);
      await loadMe();
      await loadCourses();
      setView("result");
      return;
    }
    if (quiz.i + 1 < quiz.qs.length) {
      setQuiz({
        ...quiz,
        i: quiz.i + 1,
        picked: null,
        revealed: false,
        wrong: false,
        latest: undefined,
      });
    }
  };

  const backHome = () => {
    setView("home");
    setActive(null);
    setQuiz(null);
  };

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/");
    router.refresh();
  };

  if (!loaded) {
    return (
      <div style={S.appWrap}>
        <div style={{ ...S.center, minHeight: 480 }}>
          <div className="pp-pulse" style={{ fontSize: 46 }}>
            🧠
          </div>
          <div style={{ color: "#8b86a5", fontWeight: 800, marginTop: 10 }}>
            Loading your journey…
          </div>
        </div>
      </div>
    );
  }

  if (error || !course || !me) {
    return (
      <div style={S.appWrap}>
        <div style={{ ...S.center, minHeight: 480, padding: 24 }}>
          <div style={{ fontWeight: 900, fontSize: 20 }}>Couldn’t load PsychPath</div>
          <p style={{ color: "#8b86a5", fontWeight: 700, marginTop: 8 }}>
            {error ?? "Missing course data"}
          </p>
          <button
            className="pp-press"
            style={{ ...S.btnMain, background: "#6C5CE7", marginTop: 16 }}
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={S.appWrap}>
      <OfflineBanner />
      <div style={S.hud}>
        <button
          className="pp-chip"
          onClick={() => setShowPaths((v) => !v)}
          style={{ ...S.pathChip, background: course.color }}
          aria-label="Switch learning path"
        >
          <span style={{ fontSize: 18 }}>{course.icon}</span>
          <span style={{ fontWeight: 900 }}>{course.title}</span>
          <span style={{ opacity: 0.85, fontWeight: 800, fontSize: 12 }}>▾</span>
        </button>
        <div style={S.stats}>
          <Stat icon="🔥" value={me.stats.streak} color="#ff7a3d" />
          <Stat icon="⭐" value={me.stats.total_xp} color="#f6b93b" />
          <button
            className="pp-chip"
            onClick={() => setView("profile")}
            style={S.lvlBtn}
            aria-label="View profile"
          >
            <span style={{ fontWeight: 900 }}>Lv {me.stats.level}</span>
          </button>
        </div>
      </div>

      {showPaths && (
        <div style={S.sheetWrap} onClick={() => setShowPaths(false)}>
          <div style={S.sheet} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 4 }}>
              Choose a path
            </div>
            <div style={{ color: "#8b86a5", fontSize: 13, marginBottom: 12 }}>
              Every path is open — follow whichever calls to you.
            </div>
            <div style={S.pathGrid}>
              {courses.map((p) => (
                <button
                  key={p.id}
                  className="pp-press"
                  onClick={async () => {
                    setShowPaths(false);
                    setView("home");
                    await loadCourse(p.slug);
                  }}
                  style={{
                    ...S.pathCard,
                    borderColor: p.slug === slug ? p.color : "#eceaf5",
                    boxShadow: p.slug === slug ? `0 0 0 3px ${p.color}22` : "none",
                  }}
                >
                  <div
                    style={{
                      ...S.pathIcon,
                      background: `${p.color}1f`,
                      color: p.color,
                    }}
                  >
                    {p.icon}
                  </div>
                  <div style={{ flex: 1, textAlign: "left" }}>
                    <div style={{ fontWeight: 900, fontSize: 15 }}>{p.title}</div>
                    <div style={{ color: "#9c97b3", fontSize: 12, marginBottom: 6 }}>
                      {p.subtitle}
                    </div>
                    <div style={S.barBg}>
                      <div
                        style={{
                          ...S.barFill,
                          width: `${p.progress_percent}%`,
                          background: p.color,
                        }}
                      />
                    </div>
                  </div>
                  <div style={{ fontWeight: 900, color: p.color, fontSize: 13 }}>
                    {p.progress_percent}%
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={S.main}>
        {view === "home" && (
          <HomeMap
            course={course}
            pathNodes={pathNodes}
            nodeStatus={nodeStatus}
            progress={progress}
            onChapter={openChapter}
            onTest={(lesson) => startQuiz(lesson, null, "big")}
            onProfessorChat={(professor, context) => openProfessorChat(professor, context)}
          />
        )}
        {view === "chapter" && active && (
          <ChapterView
            key={active.chapter.id}
            course={course}
            active={active}
            onQuiz={() => startQuiz(active.lesson, active.chapter, "small")}
            onBack={backHome}
            onProfessorChat={(professor, context) => openProfessorChat(professor, context)}
          />
        )}
        {view === "quiz" && quiz && (
          <QuizView
            course={course}
            quiz={quiz}
            onPick={pick}
            onNext={nextQ}
            onQuit={backHome}
          />
        )}
        {view === "result" && quiz?.done && (
          <ResultView
            course={course}
            quiz={quiz}
            onHome={backHome}
            onRetry={() => startQuiz(quiz.lesson, quiz.chapter, quiz.mode)}
            onProfessorChat={(professor, context) => openProfessorChat(professor, context)}
          />
        )}
        {view === "profile" && (
          <ProfileView me={me} onBack={backHome} onSignOut={signOut} />
        )}
      </div>

      {toast && <div style={S.toast}>{toast}</div>}

      {chat && (
        <ProfessorChat
          professor={chat.professor}
          courseColor={course?.color ?? "#6c5ce7"}
          context={chat.context}
          onClose={() => setChat(null)}
        />
      )}
    </div>
  );
}

function HomeMap({
  course,
  pathNodes,
  nodeStatus,
  progress,
  onChapter,
  onTest,
  onProfessorChat,
}: {
  course: CourseDetail;
  pathNodes: PathNode[];
  nodeStatus: (i: number) => "done" | "current" | "locked";
  progress: CourseProgress;
  onChapter: (chapter: Chapter, lesson: Lesson) => void;
  onTest: (lesson: Lesson) => void;
  onProfessorChat: (professor: Professor | null | undefined, context: ProfessorChatContext) => void;
}) {
  const teacher = course.professor;

  return (
    <div style={{ paddingBottom: 40 }}>
      <div
        style={{
          ...S.banner,
          background: `linear-gradient(135deg, ${course.color}, ${shade(course.color, -18)})`,
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.85, letterSpacing: 1 }}>
            YOUR GUIDE
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, marginTop: 2 }}>
            {teacher?.name ?? "Professor"}
          </div>
          <div style={{ fontSize: 13, opacity: 0.9 }}>{teacher?.tagline}</div>
          {teacher && (
            <div style={{ fontSize: 11, fontWeight: 800, opacity: 0.8, marginTop: 6 }}>
              Tap avatar to chat
            </div>
          )}
        </div>
        <div className="pp-float">
          <ProfessorAvatarButton
            professor={teacher}
            size={84}
            ringColor="#fff"
            onChat={() =>
              onProfessorChat(teacher, { course_title: course.title })
            }
          />
        </div>
      </div>

      {course.lessons.map((lesson) => {
        const items = pathNodes
          .map((n, gi) => ({ n, gi }))
          .filter(({ n }) => n.lesson.id === lesson.id);
        const passed = progress.lessons[lesson.id]?.passed;
        return (
          <div key={lesson.id} style={{ marginTop: 22 }}>
            <div style={S.lessonHead}>
              <div style={{ ...S.lessonDot, background: course.color }} />
              <div style={{ fontWeight: 900, fontSize: 15 }}>{lesson.title}</div>
              {passed && <span style={S.crown}>👑</span>}
            </div>
            <div style={S.track}>
              {items.map(({ n, gi }, idx) => {
                const status = nodeStatus(gi);
                const offset = Math.sin(idx * 1.1) * 46;
                return (
                  <div key={n.id} style={{ ...S.nodeRow, transform: `translateX(${offset}px)` }}>
                    <PathNode
                      node={n}
                      status={status}
                      color={course.color}
                      onClick={() => {
                        if (status === "locked") return;
                        if (n.kind === "chapter") onChapter(n.chapter, n.lesson);
                        else onTest(n.lesson);
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PathNode({
  node,
  status,
  color,
  onClick,
}: {
  node: PathNode;
  status: "done" | "current" | "locked";
  color: string;
  onClick: () => void;
}) {
  const isTest = node.kind === "test";
  const label = isTest ? "Checkpoint" : node.chapter.title;
  const face = status === "done" ? "✓" : isTest ? "🏆" : "★";
  const bg = status === "locked" ? "#e7e4f0" : status === "done" ? "#f6b93b" : color;
  const ring = status === "current" ? `0 0 0 6px ${color}22` : "none";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      {status === "current" && (
        <div style={S.startPill}>{isTest ? "TEST" : "START"}</div>
      )}
      <button
        className={status === "locked" ? "" : "pp-press pp-node"}
        onClick={onClick}
        disabled={status === "locked"}
        aria-label={`${label} (${status})`}
        style={{
          ...S.node,
          background: bg,
          boxShadow:
            status === "locked"
              ? "0 5px 0 #cdc8dc"
              : `0 6px 0 ${shade(bg, -20)}, ${ring}`,
          cursor: status === "locked" ? "not-allowed" : "pointer",
          opacity: status === "locked" ? 0.75 : 1,
        }}
      >
        <span
          style={{
            fontSize: isTest ? 30 : 28,
            filter: status === "locked" ? "grayscale(1)" : "none",
          }}
        >
          {status === "locked" ? "🔒" : face}
        </span>
      </button>
      <div
        style={{
          ...S.nodeLabel,
          color: status === "locked" ? "#b3aec6" : "#5b5470",
        }}
      >
        {label}
      </div>
    </div>
  );
}

function ChapterView({
  course,
  active,
  onQuiz,
  onBack,
  onProfessorChat,
}: {
  course: CourseDetail;
  active: { lesson: Lesson; chapter: Chapter };
  onQuiz: () => void;
  onBack: () => void;
  onProfessorChat: (professor: Professor | null | undefined, context: ProfessorChatContext) => void;
}) {
  const { chapter, lesson } = active;
  const teacher = lesson.professor ?? course.professor;
  const [i, setI] = useState(0);
  const cards = chapter.cards;
  const card = cards[i];
  const last = i === cards.length - 1;
  if (!card) return null;

  const kindStyle =
    {
      idea: { tag: "CORE IDEA", color: course.color },
      eg: { tag: "EXAMPLE", color: "#0984E3" },
      tip: { tag: "TIP", color: "#12B3A6" },
      name: { tag: "KEY TERM", color: "#9B59B6" },
    }[card.type] || { tag: "NOTE", color: course.color };

  return (
    <div style={{ paddingBottom: 24 }}>
      <TopBar
        onBack={onBack}
        title={chapter.title}
        sub={lesson.title}
        color={course.color}
      />
      <div style={S.progressLine}>
        {cards.map((_, k) => (
          <div
            key={k}
            style={{
              ...S.progDot,
              background: k <= i ? course.color : "#e7e4f0",
              flex: 1,
            }}
          />
        ))}
      </div>

      <div style={S.teachRow}>
        <div className="pp-float-s">
          <ProfessorAvatarButton
            professor={teacher}
            size={64}
            ringColor={course.color}
            onChat={() =>
              onProfessorChat(teacher, {
                course_title: course.title,
                lesson_title: lesson.title,
                chapter_title: chapter.title,
              })
            }
          />
        </div>
        <div style={S.speech}>
          <div
            style={{
              fontWeight: 900,
              fontSize: 12,
              color: kindStyle.color,
              letterSpacing: 0.6,
            }}
          >
            {kindStyle.tag}
          </div>
          <div style={{ fontWeight: 900, fontSize: 17, marginTop: 2 }}>
            {card.heading}
          </div>
        </div>
      </div>

      <div key={i} className="pp-fade" style={S.cardBody}>
        {card.body}
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
        {i > 0 && (
          <button className="pp-press" onClick={() => setI(i - 1)} style={S.btnGhost}>
            Back
          </button>
        )}
        {!last ? (
          <button
            className="pp-press"
            onClick={() => setI(i + 1)}
            style={{
              ...S.btnMain,
              background: course.color,
              boxShadow: `0 5px 0 ${shade(course.color, -22)}`,
              flex: 1,
            }}
          >
            Continue
          </button>
        ) : (
          <button
            className="pp-press"
            onClick={onQuiz}
            style={{
              ...S.btnMain,
              background: "#f6b93b",
              boxShadow: "0 5px 0 #d89a1f",
              flex: 1,
            }}
          >
            Take the quick test →
          </button>
        )}
      </div>
    </div>
  );
}

function QuizView({
  course,
  quiz,
  onPick,
  onNext,
  onQuit,
}: {
  course: CourseDetail;
  quiz: QuizState;
  onPick: (idx: number) => void;
  onNext: () => void;
  onQuit: () => void;
}) {
  const q = quiz.qs[quiz.i]!;
  const isBig = quiz.mode === "big";
  const pct = (quiz.i / quiz.qs.length) * 100;
  const answerIndex = quiz.latest?.answer_index;

  return (
    <div className={quiz.wrong ? "pp-shake" : ""} style={{ paddingBottom: 24 }}>
      <div style={S.quizTop}>
        <button className="pp-press" onClick={onQuit} style={S.xBtn} aria-label="Quit">
          ✕
        </button>
        <div style={S.quizBarBg}>
          <div
            style={{
              ...S.quizBarFill,
              width: `${pct}%`,
              background: isBig ? "#f6b93b" : course.color,
            }}
          />
        </div>
        <div
          style={{
            fontWeight: 900,
            color: "#9c97b3",
            fontSize: 13,
            width: 40,
            textAlign: "right",
          }}
        >
          {quiz.i + 1}/{quiz.qs.length}
        </div>
      </div>

      <div style={{ ...S.quizTag, color: isBig ? "#d89a1f" : course.color }}>
        {isBig ? "🏆 LESSON CHECKPOINT" : "QUICK TEST"}
      </div>
      <div style={S.question}>{q.prompt}</div>

      <div style={{ display: "grid", gap: 12, marginTop: 18 }}>
        {q.options.map((opt, idx) => {
          let bg = "#fff";
          let border = "#e7e4f0";
          let col = "#3a3550";
          if (quiz.revealed && answerIndex !== undefined) {
            if (idx === answerIndex) {
              bg = "#e9f9ef";
              border = "#39c46a";
              col = "#1f8a45";
            } else if (idx === quiz.picked) {
              bg = "#fdecec";
              border = "#ef5350";
              col = "#c62828";
            }
          } else if (quiz.picked === idx) {
            border = course.color;
          }
          return (
            <button
              key={idx}
              className={quiz.revealed ? "" : "pp-press"}
              onClick={() => onPick(idx)}
              disabled={quiz.revealed}
              style={{
                ...S.option,
                background: bg,
                borderColor: border,
                color: col,
                cursor: quiz.revealed ? "default" : "pointer",
              }}
            >
              <span style={{ ...S.optKey, borderColor: border, color: col }}>
                {"ABCD"[idx]}
              </span>
              <span style={{ fontWeight: 800, textAlign: "left" }}>{opt}</span>
              {quiz.revealed && idx === answerIndex && (
                <span style={{ marginLeft: "auto" }}>✓</span>
              )}
            </button>
          );
        })}
      </div>

      {quiz.revealed && quiz.latest && (
        <div
          className="pp-fade"
          style={{
            ...S.explain,
            background: quiz.latest.correct ? "#e9f9ef" : "#fff6f6",
            borderColor: quiz.latest.correct ? "#bfe9cd" : "#f8c9c9",
          }}
        >
          <div
            style={{
              fontWeight: 900,
              color: quiz.latest.correct ? "#1f8a45" : "#c62828",
              marginBottom: 4,
            }}
          >
            {quiz.latest.correct ? "Correct!" : "Not quite"}
          </div>
          <div style={{ color: "#5b5470", fontSize: 14 }}>{quiz.latest.explanation}</div>
        </div>
      )}

      {quiz.revealed && (
        <button
          className="pp-press"
          onClick={onNext}
          style={{
            ...S.btnMain,
            width: "100%",
            marginTop: 16,
            background: quiz.latest?.correct ? "#39c46a" : course.color,
            boxShadow: `0 5px 0 ${shade(quiz.latest?.correct ? "#39c46a" : course.color, -22)}`,
          }}
        >
          {quiz.i + 1 === quiz.qs.length ? "Finish" : "Continue"}
        </button>
      )}
    </div>
  );
}

function ResultView({
  course,
  quiz,
  onHome,
  onRetry,
  onProfessorChat,
}: {
  course: CourseDetail;
  quiz: QuizState;
  onHome: () => void;
  onRetry: () => void;
  onProfessorChat: (professor: Professor | null | undefined, context: ProfessorChatContext) => void;
}) {
  const teacher = quiz.lesson.professor ?? course.professor;
  const total = quiz.total ?? quiz.qs.length;
  const correct = quiz.correctFinal ?? 0;
  const acc = Math.round((correct / total) * 100);
  const isBig = quiz.mode === "big";
  const good = !!quiz.passed && (!isBig || acc >= 70);
  const line = isBig
    ? quiz.passed
      ? "Checkpoint cleared. The next lesson is open."
      : `You need ${Math.ceil(total * PASS_RATIO)}/${total} to pass — give it another go.`
    : acc === 100
      ? "Flawless. That concept is yours."
      : "Nice work — chapter complete.";

  return (
    <div style={S.center}>
      <div className="pp-pop" style={{ fontSize: 64, marginBottom: 4 }}>
        {good ? (isBig ? "🏆" : "🎉") : "💪"}
      </div>
      <div style={{ fontWeight: 900, fontSize: 24 }}>
        {good ? (isBig ? "Checkpoint passed!" : "Chapter done!") : "Almost there"}
      </div>

      <div style={{ display: "flex", gap: 12, margin: "18px 0 6px" }}>
        <ResultStat label="Accuracy" value={`${acc}%`} color={course.color} />
        <ResultStat label="XP earned" value={`+${quiz.earned ?? 0}`} color="#f6b93b" />
        <ResultStat label="Score" value={`${correct}/${total}`} color="#12B3A6" />
      </div>

      <div style={S.teachCard}>
        <ProfessorAvatarButton
          professor={teacher}
          size={52}
          ringColor={course.color}
          onChat={() =>
            onProfessorChat(teacher, {
              course_title: course.title,
              lesson_title: quiz.lesson.title,
              chapter_title: quiz.chapter?.title,
            })
          }
        />
        <div style={{ fontSize: 14, color: "#5b5470", fontWeight: 700 }}>{line}</div>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 18, width: "100%" }}>
        {!good && (
          <button
            className="pp-press"
            onClick={onRetry}
            style={{
              ...S.btnMain,
              flex: 1,
              background: course.color,
              boxShadow: `0 5px 0 ${shade(course.color, -22)}`,
            }}
          >
            Try again
          </button>
        )}
        <button
          className="pp-press"
          onClick={onHome}
          style={{
            ...S.btnMain,
            flex: 1,
            background: good ? "#39c46a" : "#fff",
            color: good ? "#fff" : "#5b5470",
            border: good ? "none" : "2px solid #e7e4f0",
            boxShadow: good ? "0 5px 0 #2ba557" : "none",
          }}
        >
          {good ? "Continue" : "Back to path"}
        </button>
      </div>
    </div>
  );
}

function ProfileView({
  me,
  onBack,
  onSignOut,
}: {
  me: MeResponse;
  onBack: () => void;
  onSignOut: () => void;
}) {
  const intoPct = Math.min(100, (me.stats.level_into / me.stats.level_span) * 100);
  return (
    <div style={{ paddingBottom: 24 }}>
      <TopBar
        onBack={onBack}
        title="Your progress"
        sub={`${me.profile.display_name} · Master Psychology prep`}
        color="#6C5CE7"
      />

      <div style={{ padding: "0 16px" }}>
        <InstallPrompt />
      </div>

      <div style={S.levelCard}>
        <div style={{ fontSize: 46 }}>🧠</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 900, fontSize: 20 }}>Level {me.stats.level}</div>
          <div style={S.barBg}>
            <div style={{ ...S.barFill, width: `${intoPct}%`, background: "#6C5CE7" }} />
          </div>
          <div style={{ color: "#9c97b3", fontSize: 12, marginTop: 4 }}>
            {me.stats.level_into} / {me.stats.level_span} XP to level {me.stats.level + 1}
          </div>
        </div>
      </div>

      <div style={S.metricRow}>
        <Metric icon="⭐" value={me.stats.total_xp} label="Total XP" />
        <Metric icon="🔥" value={me.stats.streak} label="Day streak" />
        <Metric icon="📖" value={me.chapters_completed} label="Chapters" />
        <Metric icon="🏆" value={me.checkpoints_passed} label="Checkpoints" />
      </div>

      <div style={{ fontWeight: 900, fontSize: 15, margin: "22px 0 10px" }}>Paths</div>
      {me.courses.map((p) => (
        <div key={p.slug} style={S.pathProgRow}>
          <div
            style={{
              ...S.pathIcon,
              background: `${p.color}1f`,
              color: p.color,
              width: 40,
              height: 40,
              fontSize: 20,
            }}
          >
            {p.icon}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 14 }}>{p.title}</div>
            <div style={S.barBg}>
              <div
                style={{ ...S.barFill, width: `${p.percent}%`, background: p.color }}
              />
            </div>
          </div>
          <div
            style={{
              fontWeight: 900,
              color: p.color,
              fontSize: 13,
              width: 40,
              textAlign: "right",
            }}
          >
            {p.percent}%
          </div>
        </div>
      ))}

      <button
        className="pp-press"
        onClick={onSignOut}
        style={{ ...S.btnGhost, width: "100%", marginTop: 24 }}
      >
        Sign out
      </button>

      {me.profile.role === "admin" && (
        <a
          href="/admin"
          style={{
            ...S.btnMain,
            display: "block",
            width: "100%",
            marginTop: 10,
            background: "#6C5CE7",
            textAlign: "center",
            textDecoration: "none",
          }}
        >
          Open admin
        </a>
      )}
    </div>
  );
}

function Stat({ icon, value, color }: { icon: string; value: number; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span style={{ fontWeight: 900, color }}>{value}</span>
    </div>
  );
}

function ResultStat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div style={S.resultStat}>
      <div style={{ fontWeight: 900, fontSize: 18, color }}>{value}</div>
      <div style={{ color: "#9c97b3", fontSize: 11, fontWeight: 800 }}>{label}</div>
    </div>
  );
}

function Metric({
  icon,
  value,
  label,
}: {
  icon: string;
  value: number;
  label: string;
}) {
  return (
    <div style={S.metric}>
      <div style={{ fontSize: 18 }}>{icon}</div>
      <div style={{ fontWeight: 900, fontSize: 16 }}>{value}</div>
      <div style={{ color: "#9c97b3", fontSize: 10, fontWeight: 800 }}>{label}</div>
    </div>
  );
}

function TopBar({
  onBack,
  title,
  sub,
  color,
}: {
  onBack: () => void;
  title: string;
  sub: string;
  color: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
      <button className="pp-press" onClick={onBack} style={S.backBtn} aria-label="Back">
        ←
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 900, fontSize: 16, color }}>{title}</div>
        <div style={{ color: "#9c97b3", fontSize: 12, fontWeight: 700 }}>{sub}</div>
      </div>
    </div>
  );
}

const S: Record<string, CSSProperties> = {
  appWrap: {
    fontFamily:
      "var(--font-nunito), ui-rounded, 'SF Pro Rounded', system-ui, -apple-system, sans-serif",
    maxWidth: 480,
    margin: "0 auto",
    minHeight: "100vh",
    background: "#f7f5fc",
    color: "#2f2a3d",
    position: "relative",
    overflow: "hidden",
  },
  hud: {
    position: "sticky",
    top: 0,
    zIndex: 20,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    padding: "12px 16px",
    background: "rgba(247,245,252,.92)",
    backdropFilter: "blur(8px)",
    borderBottom: "1px solid #eceaf5",
  },
  pathChip: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    color: "#fff",
    padding: "8px 12px",
    borderRadius: 14,
    fontSize: 14,
    maxWidth: 200,
  },
  stats: { display: "flex", alignItems: "center", gap: 12 },
  lvlBtn: {
    background: "#efeaff",
    color: "#6C5CE7",
    padding: "7px 11px",
    borderRadius: 12,
    fontSize: 13,
  },
  main: { padding: "16px 18px 90px" },
  banner: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    color: "#fff",
    padding: "16px 18px",
    borderRadius: 22,
    boxShadow: "0 10px 24px rgba(80,60,160,.18)",
  },
  lessonHead: { display: "flex", alignItems: "center", gap: 8, margin: "0 0 6px 4px" },
  lessonDot: { width: 10, height: 10, borderRadius: 6 },
  crown: { marginLeft: 4 },
  track: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    padding: "8px 0",
  },
  nodeRow: { transition: "transform .3s ease" },
  node: {
    width: 78,
    height: 72,
    borderRadius: 40,
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
  },
  nodeLabel: {
    fontSize: 11.5,
    fontWeight: 800,
    maxWidth: 120,
    textAlign: "center",
    lineHeight: 1.2,
  },
  startPill: {
    background: "#fff",
    color: "#39c46a",
    fontWeight: 900,
    fontSize: 11,
    letterSpacing: 1,
    padding: "3px 10px",
    borderRadius: 10,
    boxShadow: "0 3px 8px rgba(0,0,0,.08)",
  },
  progressLine: { display: "flex", gap: 5, margin: "0 0 18px" },
  progDot: { height: 7, borderRadius: 4 },
  teachRow: { display: "flex", alignItems: "flex-end", gap: 10, marginBottom: 6 },
  speech: {
    background: "#fff",
    borderRadius: "16px 16px 16px 4px",
    padding: "12px 14px",
    boxShadow: "0 4px 14px rgba(80,60,160,.08)",
    flex: 1,
  },
  cardBody: {
    background: "#fff",
    borderRadius: 18,
    padding: "18px 18px",
    fontSize: 16,
    lineHeight: 1.55,
    color: "#3a3550",
    fontWeight: 600,
    boxShadow: "0 4px 14px rgba(80,60,160,.06)",
    marginTop: 8,
  },
  quizTop: { display: "flex", alignItems: "center", gap: 12, marginBottom: 18 },
  xBtn: {
    background: "none",
    border: "none",
    fontSize: 20,
    color: "#b3aec6",
    cursor: "pointer",
    fontWeight: 900,
  },
  quizBarBg: {
    flex: 1,
    height: 14,
    background: "#e7e4f0",
    borderRadius: 8,
    overflow: "hidden",
  },
  quizBarFill: { height: "100%", borderRadius: 8, transition: "width .3s ease" },
  quizTag: { fontWeight: 900, fontSize: 12, letterSpacing: 1, marginBottom: 8 },
  question: { fontSize: 21, fontWeight: 900, lineHeight: 1.3, color: "#2f2a3d" },
  option: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "15px 15px",
    borderRadius: 16,
    border: "2px solid",
    fontSize: 15.5,
    fontWeight: 800,
    fontFamily: "inherit",
  },
  optKey: {
    width: 28,
    height: 28,
    borderRadius: 8,
    border: "2px solid",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 900,
    fontSize: 14,
    flexShrink: 0,
  },
  explain: { marginTop: 16, padding: "13px 15px", borderRadius: 14, border: "2px solid" },
  center: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    paddingTop: 24,
  },
  resultStat: {
    background: "#fff",
    borderRadius: 16,
    padding: "12px 8px",
    minWidth: 92,
    flex: 1,
    boxShadow: "0 4px 14px rgba(80,60,160,.06)",
  },
  teachCard: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    background: "#fff",
    borderRadius: 16,
    padding: "12px 14px",
    boxShadow: "0 4px 14px rgba(80,60,160,.06)",
    marginTop: 8,
    width: "100%",
    textAlign: "left",
  },
  btnMain: {
    border: "none",
    color: "#fff",
    fontWeight: 900,
    fontSize: 16,
    padding: "14px 18px",
    borderRadius: 16,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  btnGhost: {
    border: "2px solid #e7e4f0",
    background: "#fff",
    color: "#5b5470",
    fontWeight: 900,
    fontSize: 15,
    padding: "12px 18px",
    borderRadius: 16,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    border: "2px solid #e7e4f0",
    background: "#fff",
    fontSize: 18,
    fontWeight: 900,
    color: "#5b5470",
    cursor: "pointer",
  },
  sheetWrap: {
    position: "fixed",
    inset: 0,
    background: "rgba(30,20,60,.35)",
    zIndex: 40,
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    padding: "72px 14px 14px",
  },
  sheet: {
    background: "#fff",
    borderRadius: 22,
    padding: 18,
    width: "100%",
    maxWidth: 452,
    boxShadow: "0 20px 50px rgba(30,20,60,.3)",
    maxHeight: "80vh",
    overflowY: "auto",
  },
  pathGrid: { display: "flex", flexDirection: "column", gap: 10 },
  pathCard: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 16,
    border: "2px solid #eceaf5",
    background: "#fff",
    cursor: "pointer",
    fontFamily: "inherit",
    textAlign: "left",
  },
  pathIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 22,
    flexShrink: 0,
  },
  barBg: { height: 8, background: "#eceaf5", borderRadius: 6, overflow: "hidden", marginTop: 4 },
  barFill: { height: "100%", borderRadius: 6, transition: "width .4s ease" },
  levelCard: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    background: "#fff",
    borderRadius: 20,
    padding: 16,
    boxShadow: "0 6px 18px rgba(80,60,160,.08)",
  },
  metricRow: { display: "flex", gap: 10, marginTop: 12 },
  metric: {
    flex: 1,
    background: "#fff",
    borderRadius: 16,
    padding: "12px 6px",
    textAlign: "center",
    boxShadow: "0 4px 12px rgba(80,60,160,.05)",
  },
  pathProgRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    background: "#fff",
    borderRadius: 14,
    padding: "10px 12px",
    marginBottom: 8,
    boxShadow: "0 3px 10px rgba(80,60,160,.04)",
  },
  toast: {
    position: "fixed",
    bottom: 24,
    left: "50%",
    transform: "translateX(-50%)",
    background: "#2f2a3d",
    color: "#fff",
    padding: "10px 18px",
    borderRadius: 14,
    fontWeight: 800,
    fontSize: 14,
    zIndex: 60,
    boxShadow: "0 8px 24px rgba(0,0,0,.25)",
  },
};
