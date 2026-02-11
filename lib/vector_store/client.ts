import type { ContextSearchResult, VectorStoreAdapter } from "./types";
import { HnswVectorStoreAdapter } from "./adapters/hnsw";

export class VectorStoreClient {
  constructor(private readonly adapter: VectorStoreAdapter) {}

  search(query: string): Promise<ContextSearchResult> {
    return this.adapter.search(query);
  }
}

export const createVectorStoreClient = (
  adapter: VectorStoreAdapter = new HnswVectorStoreAdapter(),
) => new VectorStoreClient(adapter);

let defaultClient: VectorStoreClient | null = null;

export const getVectorStoreClient = () => {
  if (!defaultClient) {
    defaultClient = createVectorStoreClient();
  }
  return defaultClient;
};
