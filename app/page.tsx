"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import Login from "@/components/Login";
import Chat from "@/components/Chat";
import { store_setUsername } from "@/lib/client_store";

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const uid = searchParams.get("uid");

  const handleLogin = async (username: string, password: string) => {
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }
      const data = await response.json();
      const identifier = data.identifier;
      store_setUsername(username); // persist information
      // redirect to the chat page with identifier
      router.push(`?uid=${identifier}`);
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error ? error.message : "Failed to start chat";
      toast.error(`Error: ${message}`);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between p-16 bg-white dark:bg-black sm:items-start">
        <div className="w-full flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          {uid ? <Chat /> : <Login handleLogin={handleLogin} />}
        </div>
      </main>
    </div>
  );
}
