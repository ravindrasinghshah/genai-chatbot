"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import { ExternalLink, Send } from "lucide-react";
import Button from "@/components/UI/Button";
import Logout from "@/components/Logout";
import { store_getUserName } from "@/lib/client_store";
import { SuggestQuestion } from "./SuggestQuestions";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  sources?: string[];
};

const storageKeyFor = (uid: string | null) =>
  uid ? `chat_messages_${uid}` : "chat_messages_unknown";

const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}_${Math.random().toString(16).slice(2)}`;

export function Chat() {
  const searchParams = useSearchParams();
  const uid = searchParams.get("uid");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [lastStatus, setLastStatus] = useState<"success" | "not_found" | null>(
    null,
  );
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [username, setUsername] = useState("");

  useEffect(() => {
    setUsername(store_getUserName() || "");
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem(storageKeyFor(uid));
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as ChatMessage[];
        setMessages(parsed);
      } catch {
        localStorage.removeItem(storageKeyFor(uid));
      }
    } else {
      setMessages([]);
    }
  }, [uid]);

  useEffect(() => {
    if (isStreaming) {
      return;
    }
    localStorage.setItem(storageKeyFor(uid), JSON.stringify(messages));
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    }
  }, [messages, uid, isStreaming]);

  const appendMessage = (message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  };

  const updateMessageContent = (id: string, content: string) => {
    setMessages((prev) =>
      prev.map((message) =>
        message.id === id ? { ...message, content } : message,
      ),
    );
  };

  const updateMessageSources = (id: string, sources: string[]) => {
    setMessages((prev) =>
      prev.map((message) =>
        message.id === id ? { ...message, sources } : message,
      ),
    );
  };

  const handleSend = async () => {
    if (!uid) {
      toast.error("Chat session is missing. Please start again.");
      return;
    }
    const trimmed = input.trim();

    if (!trimmed) {
      toast.error("Please enter question.");
      return;
    }

    const userMessage: ChatMessage = {
      id: createId(),
      role: "user",
      content: trimmed,
      timestamp: new Date().toISOString(),
    };
    appendMessage(userMessage);
    setInput("");
    setLoading(true);

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      const response = await fetch(`/api/chat/${uid}`, {
        method: "POST",
        headers,
        body: JSON.stringify({ question: trimmed }),
      });
      if (!response.ok) {
        throw new Error("Failed to get response");
      }
      const contentType = response.headers.get("Content-Type") || "";
      if (contentType.includes("text/event-stream")) {
        setIsStreaming(true);
        const assistantId = createId();
        appendMessage({
          id: assistantId,
          role: "assistant",
          content: "",
          timestamp: new Date().toISOString(),
        });

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let accumulated = "";
        if (reader) {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const parts = buffer.split("\n\n");
            buffer = parts.pop() ?? "";

            for (const part of parts) {
              const [eventLine, dataLine] = part.split("\n");
              const event = eventLine?.replace("event: ", "").trim();
              const data = dataLine?.replace("data: ", "") ?? "";

              if (event === "meta") {
                try {
                  const meta = JSON.parse(data) as {
                    status?: "success" | "not_found";
                    sources?: string[];
                  };
                  setLastStatus(meta.status ?? "success");
                  if (meta.sources) {
                    updateMessageSources(assistantId, meta.sources);
                  }
                } catch {
                  // ignore malformed meta
                }
              }

              if (event === "token") {
                accumulated += data;
                updateMessageContent(assistantId, accumulated);
              }

              if (event === "error") {
                updateMessageContent(
                  assistantId,
                  accumulated || "The response stream encountered an error.",
                );
              }
            }
          }
        } else {
          updateMessageContent(
            assistantId,
            "No response available (stream missing).",
          );
        }
      } else {
        const data = (await response.json()) as {
          response?: string;
          message?: string;
          status?: "success" | "not_found";
          contexts?: { metadata?: { source?: string } }[];
        };
        setLastStatus(data.status ?? "success");
        const sources =
          data.contexts
            ?.map((context) => context.metadata?.source)
            .filter((source): source is string => Boolean(source)) ?? [];
        const assistantMessage: ChatMessage = {
          id: createId(),
          role: "assistant",
          content: data.response || data.message || "No response available.",
          timestamp: new Date().toISOString(),
          sources,
        };
        appendMessage(assistantMessage);
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong. Please try again.");
      setLastStatus(null);
      appendMessage({
        id: createId(),
        role: "assistant",
        content: "I ran into an issue answering that. Please try again.",
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsStreaming(false);
      setLoading(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!loading) {
        handleSend();
      }
    }
  };

  return (
    <div className="flex w-full flex-col gap-6 text-base font-medium">
      <ToastContainer />
      <div className="flex w-full items-center justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-sm uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
            Active Session
          </span>
          {username && (
            <span className="text-xl font-semibold text-black dark:text-zinc-50">
              {username}&apos;s chat
            </span>
          )}
        </div>
        <Logout />
      </div>

      <div className="flex w-full flex-col gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div
          ref={scrollerRef}
          className="flex max-h-[420px] flex-col gap-3 overflow-y-auto pr-1 pb-2"
        >
          {messages.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-200 px-4 py-3 text-center text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              Ask a question about recent financial news to get started.
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex w-full ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                    message.role === "user"
                      ? "bg-black text-white dark:bg-white dark:text-black"
                      : "bg-white text-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  {message.role === "assistant" &&
                    message.sources &&
                    message.sources.length > 0 && (
                      <details className="group mt-3 text-xs text-zinc-500 dark:text-zinc-400">
                        <summary className="cursor-pointer select-none text-[11px] uppercase tracking-[0.2em]">
                          Sources
                        </summary>
                        <div className="mt-2 grid grid-rows-[0fr] transition-[grid-template-rows,opacity] duration-300 ease-out opacity-0 group-open:grid-rows-[1fr] group-open:opacity-100">
                          <div className="min-h-0 overflow-hidden flex flex-col gap-1">
                            {message.sources.map((source) => (
                              <a
                                key={source}
                                href={source}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1 text-[11px] text-zinc-600 hover:text-zinc-800 dark:text-zinc-300 dark:hover:text-zinc-100"
                                title={source}
                              >
                                <span className="truncate">{source}</span>
                                <ExternalLink size={12} />
                              </a>
                            ))}
                          </div>
                        </div>
                      </details>
                    )}
                  <div className="mt-2 text-xs text-zinc-400 text-right">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))
          )}
          {loading && !isStreaming && (
            <div className="flex w-full justify-start">
              <div className="max-w-[80%] rounded-2xl bg-white px-4 py-3 text-sm text-zinc-500 shadow-sm dark:bg-zinc-900 dark:text-zinc-300">
                Thinking…
              </div>
            </div>
          )}
        </div>

        {lastStatus === "not_found" && (
          <SuggestQuestion clickEventHandler={setInput} />
        )}

        <div className="flex flex-col gap-3">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about recent financial news..."
            rows={4}
            maxLength={500}
            className="w-full resize-none rounded-xl border border-zinc-200 bg-white p-3 text-sm text-zinc-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-black/50 dark:border-zinc-800 dark:bg-black dark:text-zinc-100 dark:focus:ring-white/30"
          />
          <div className="flex w-full items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span>Press Enter to send, Shift + Enter for a new line.</span>
            <span>{input.trim().length}/500</span>
          </div>
          <Button
            variant="primary"
            size="full"
            onClick={handleSend}
            disabled={loading}
            className="mt-0"
          >
            {loading ? (isStreaming ? "Streaming..." : "Sending...") : "Send"}
            <Send size={24} />
          </Button>
        </div>
      </div>
    </div>
  );
}
