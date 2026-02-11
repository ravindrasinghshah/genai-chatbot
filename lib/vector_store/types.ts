export type ContextResult = {
  score: number;
  content: string;
  metadata: Record<string, unknown>;
};

export type ContextSearchResult = {
  contexts: ContextResult[];
  response: string;
  status: "success" | "not_found";
};

export interface VectorStoreAdapter {
  search(query: string): Promise<ContextSearchResult>;
}
