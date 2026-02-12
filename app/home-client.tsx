"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import Login from "@/components/Login";
import Chat from "@/components/Chat";
import { store_setUsername } from "@/lib/client_store";

export default function HomeClient() {
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

  return uid ? <Chat /> : <Login handleLogin={handleLogin} />;
}
