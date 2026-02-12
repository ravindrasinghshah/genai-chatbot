import { Suspense } from "react";
import HomeClient from "./home-client";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between p-16 bg-white dark:bg-black sm:items-start">
        <div className="w-full flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <Suspense fallback={null}>
            <HomeClient />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
