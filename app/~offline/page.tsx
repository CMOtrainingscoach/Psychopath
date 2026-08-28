import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col items-center justify-center px-5 py-16 text-center">
      <div
        className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl text-4xl shadow-lg"
        style={{
          background: "linear-gradient(145deg, #7b6cf0, #6c5ce7)",
          boxShadow: "0 14px 32px rgba(108, 92, 231, 0.28)",
        }}
        aria-hidden
      >
        📡
      </div>
      <h1 className="mb-3 text-3xl font-black text-[var(--pp-ink)]">You&apos;re offline</h1>
      <p className="mb-8 font-semibold leading-relaxed text-[var(--pp-muted)]">
        Open PsychPath while online first so your courses can be cached. Previously loaded
        lessons stay readable offline.
      </p>
      <Link
        href="/learn"
        className="rounded-2xl bg-[var(--pp-brand)] px-5 py-3 text-base font-black text-white"
      >
        Back to learn
      </Link>
    </main>
  );
}
