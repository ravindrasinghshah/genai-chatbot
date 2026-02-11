import type { LlmAdapter } from "./types";
import { OpenAiLlmAdapter } from "./adapters/openai";

export class LlmClient {
  constructor(private readonly adapter: LlmAdapter) {}

  streamAnswer(question: string, context: string) {
    return this.adapter.streamAnswer(question, context);
  }
}

export const createLlmClient = (adapter: LlmAdapter = new OpenAiLlmAdapter()) =>
  new LlmClient(adapter);

let defaultClient: LlmClient | null = null;

export const getLlmClient = () => {
  if (!defaultClient) {
    defaultClient = createLlmClient();
  }
  return defaultClient;
};
