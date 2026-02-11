/**
 * POST /api/chat/{identifier} - post a question to backend
 * Minimal placeholder implementation to unblock the chat UI.
 */

import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { getVectorStoreClient } from "@/lib/vector_store";
import {
  INJECTION_BLOCK_RESPONSE,
} from "@/lib/constants";
import { isPromptInjection } from "@/lib/security/prompt_injection";
import { requireAuth } from "@/lib/auth/require_auth";
import { getLlmClient } from "@/lib/llm";

interface ChatQuestionRequest {
  question: string;
}

interface ChatResponse {
  identifier: string;
  response: string;
  contexts: {
    score: number;
    content: string;
    metadata: Record<string, unknown>;
  }[];
  status: "success" | "error" | "not_found";
  timestamp: string;
}

const vectorStoreClient = getVectorStoreClient();
const llmClient = getLlmClient();

const isRequestValid = (identifier: string, question: string) => {
  if (!identifier) {
    return false;
  }
  if (!question || !question.trim()) {
    return false;
  }
  return true;
};
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ identifier: string }> },
): Promise<NextResponse> {
  try {
    const { identifier } = await context.params;
    if (!identifier) {
      return NextResponse.json(
        { error: "Chat identifier is required." },
        { status: 400 },
      );
    }

    //== check if authorized request
    try {
      await requireAuth(request, identifier);
    } catch {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { question } = (await request.json()) as ChatQuestionRequest;
    const isValid = isRequestValid(identifier, question);

    if (!isValid) {
      return NextResponse.json(
        { error: "Missing required values." },
        { status: 400 },
      );
    }

    //== check for possible prompt injection
    if (isPromptInjection(question)) {
      return NextResponse.json({
        identifier,
        response: INJECTION_BLOCK_RESPONSE,
        contexts: [],
        status: "not_found",
        timestamp: new Date().toISOString(),
      } as ChatResponse);
    }

    //== get relevant contexts and combined contexts
    const { contexts, response: contextText, status } =
      await vectorStoreClient.search(question);

    const contextSources = Array.from(
      new Set(
        contexts
          .map((context) => context.metadata?.source)
          .filter((source): source is string => typeof source === "string"),
      ),
    );

    if (status === "not_found") {
      return NextResponse.json({
        identifier,
        response: contextText,
        contexts,
        status,
        timestamp: new Date().toISOString(),
      } as ChatResponse);
    }

    //== get response from llm and stream chunks (SSE)
    let stream: ReadableStream<Uint8Array>;
    try {
      stream = await llmClient.streamAnswer(question, contextText);
    } catch (error) {
      console.error(error);
      return NextResponse.json(
        { error: "Failed to generate response." },
        { status: 500 },
      );
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const sseStream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          //= meta event
          controller.enqueue(
            encoder.encode(
              `event: meta\ndata: ${JSON.stringify({
                status,
                sources: contextSources,
              })}\n\n`,
            ),
          );

          const reader = stream.getReader();
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            if (!chunk) continue;
            controller.enqueue(
              encoder.encode(`event: token\ndata: ${chunk}\n\n`),
            );
          }

          controller.enqueue(encoder.encode("event: done\ndata: {}\n\n"));
        } catch (error) {
          console.error(error);
          controller.enqueue(
            encoder.encode(
              `event: error\ndata: ${JSON.stringify({
                message: "Stream error",
              })}\n\n`,
            ),
          );
        } finally {
          controller.close();
        }
      },
    });

    return new NextResponse(sseStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
