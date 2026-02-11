import "server-only";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import {
  CHAT_MODEL,
  CHAT_SYSTEM_PROMPT,
  CHAT_TEMPERATURE,
  CHAT_USER_PROMPT,
} from "@/lib/constants";
import type { LlmAdapter } from "../types";

const chatModel = new ChatOpenAI({
  model: CHAT_MODEL,
  temperature: CHAT_TEMPERATURE,
});
const chatPrompt = ChatPromptTemplate.fromMessages([
  ["system", CHAT_SYSTEM_PROMPT],
  ["human", CHAT_USER_PROMPT],
]);
const encoder = new TextEncoder();

export class OpenAiLlmAdapter implements LlmAdapter {
  async streamAnswer(
    question: string,
    context: string,
  ): Promise<ReadableStream<Uint8Array>> {
    const llmStream = await chatPrompt.pipe(chatModel).stream({
      question,
      context,
    });

    return new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of llmStream) {
            const text =
              typeof chunk.content === "string"
                ? chunk.content
                : JSON.stringify(chunk.content);
            controller.enqueue(encoder.encode(text));
          }
        } catch (error) {
          console.error(error);
          const fallback =
            "\n\n[The response stream encountered an error. Please try again.]";
          controller.enqueue(encoder.encode(fallback));
        } finally {
          controller.close();
        }
      },
    });
  }
}
