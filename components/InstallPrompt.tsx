"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setHidden(true);
      return;
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setDeferred(null);
      setHidden(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (hidden || !deferred) return null;

  return (
    <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[var(--pp-border)]">
      <p className="mb-3 text-sm font-extrabold text-[var(--pp-ink)]">
        Install PsychPath for quick access and offline reading.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          className="rounded-xl bg-[var(--pp-brand)] px-4 py-2 text-sm font-black text-white"
          onClick={async () => {
            await deferred.prompt();
            const choice = await deferred.userChoice;
            if (choice.outcome === "accepted") setHidden(true);
            setDeferred(null);
          }}
        >
          Install app
        </button>
        <button
          type="button"
          className="rounded-xl border-2 border-[var(--pp-border)] px-4 py-2 text-sm font-extrabold"
          onClick={() => setHidden(true)}
        >
          Not now
        </button>
      </div>
    </div>
  );
}
