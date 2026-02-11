export interface LlmAdapter {
  streamAnswer(question: string, context: string): Promise<ReadableStream<Uint8Array>>;
}
