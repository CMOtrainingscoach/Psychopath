import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-full w-full max-w-md items-center justify-center px-5 py-12">
          <div className="pp-pulse text-4xl">🧠</div>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
