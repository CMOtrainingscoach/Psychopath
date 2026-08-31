"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/Avatar";
import type { AvatarConfig } from "@/lib/schemas/avatar";
import type { ChatMessage } from "@/lib/schemas/chat";
import type { Professor } from "@/lib/types/learner";

export type ProfessorChatContext = {
  course_title?: string;
  lesson_title?: string;
  chapter_title?: string;
};

type Props = {
  professor: Professor;
  courseColor: string;
  context: ProfessorChatContext;
  onClose: () => void;
};

function greeting(professor: Professor, context: ProfessorChatContext) {
  const topic =
    context.chapter_title || context.lesson_title || context.course_title || "psychology";
  const sample = professor.sample_phrases?.[0];
  if (sample) return sample;
  return `Ask me anything about ${topic} — I'm here to help you think it through.`;
}

export function ProfessorChat({ professor, courseColor, context, onClose }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: greeting(professor, context) },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function send(e?: FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || busy) return;

    if (!navigator.onLine) {
      setError("You're offline — chat needs a connection.");
      return;
    }

    setError(null);
    setInput("");
    const history = messages;
    const userMsg: ChatMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setBusy(true);

    try {
      const res = await fetch("/api/chat/professor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          professor_id: professor.id,
          message: text,
          history,
          context,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          typeof data.error === "string" ? data.error : "Could not reach professor",
        );
      }
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chat failed");
      setMessages(history);
      setInput(text);
    } finally {
      setBusy(false);
    }
  }

  const cfg = (professor.avatar_config ?? {}) as AvatarConfig;
  const topicLabel =
    context.chapter_title || context.lesson_title || context.course_title || "this course";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="professor-chat-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        background: "rgba(47, 42, 61, 0.45)",
        padding: "0 0 max(0px, env(safe-area-inset-bottom))",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          maxHeight: "min(88vh, 720px)",
          background: "#f7f5fc",
          borderRadius: "24px 24px 0 0",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 -8px 40px rgba(47,42,61,0.18)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "14px 16px",
            background: `linear-gradient(135deg, ${courseColor}, ${courseColor}dd)`,
            color: "#fff",
          }}
        >
          <Avatar cfg={cfg} size={48} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div id="professor-chat-title" style={{ fontWeight: 900, fontSize: 17 }}>
              {professor.name}
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.9 }}>
              Chat about {topicLabel}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close chat"
            style={{
              border: "none",
              background: "rgba(255,255,255,0.2)",
              color: "#fff",
              width: 36,
              height: 36,
              borderRadius: 12,
              fontWeight: 900,
              fontSize: 18,
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                maxWidth: "88%",
                padding: "10px 14px",
                borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                background: m.role === "user" ? courseColor : "#fff",
                color: m.role === "user" ? "#fff" : "#2f2a3d",
                fontWeight: 700,
                fontSize: 14,
                lineHeight: 1.45,
                boxShadow: m.role === "assistant" ? "0 2px 8px rgba(47,42,61,0.06)" : "none",
              }}
            >
              {m.content}
            </div>
          ))}
          {busy && (
            <div
              style={{
                alignSelf: "flex-start",
                padding: "10px 14px",
                borderRadius: "18px 18px 18px 4px",
                background: "#fff",
                color: "#8b86a5",
                fontWeight: 800,
                fontSize: 14,
              }}
            >
              Thinking…
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {error && (
          <p
            style={{
              margin: "0 16px 8px",
              padding: "8px 12px",
              borderRadius: 12,
              background: "#fdecec",
              color: "#c62828",
              fontWeight: 800,
              fontSize: 13,
            }}
          >
            {error}
          </p>
        )}

        <form
          onSubmit={send}
          style={{
            display: "flex",
            gap: 8,
            padding: "12px 16px 16px",
            borderTop: "1px solid #eceaf5",
            background: "#fff",
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask ${professor.name.split(" ").pop()}…`}
            disabled={busy}
            maxLength={2000}
            style={{
              flex: 1,
              border: "2px solid #eceaf5",
              borderRadius: 16,
              padding: "12px 14px",
              fontWeight: 700,
              fontSize: 14,
              outline: "none",
            }}
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            style={{
              border: "none",
              borderRadius: 16,
              padding: "0 18px",
              background: courseColor,
              color: "#fff",
              fontWeight: 900,
              fontSize: 14,
              cursor: busy ? "wait" : "pointer",
              opacity: busy || !input.trim() ? 0.6 : 1,
            }}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
