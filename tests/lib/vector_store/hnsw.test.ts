import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { fsMocks, hnswMocks } = vi.hoisted(() => ({
  fsMocks: {
    access: vi.fn(),
  },
  hnswMocks: {
    load: vi.fn(),
    similaritySearch: vi.fn(),
  },
}));

vi.mock("fs", () => ({
  promises: fsMocks,
}));

vi.mock("@langchain/community/vectorstores/hnswlib", () => ({
  HNSWLib: {
    load: hnswMocks.load,
  },
}));

vi.mock("@langchain/openai", () => ({
  OpenAIEmbeddings: class OpenAIEmbeddingsMock {
    constructor() {}
  },
}));

import { HnswVectorStoreAdapter } from "../../../lib/vector_store/adapters/hnsw";
import { DEFAULT_CONTEXT_RESPONSE } from "../../../lib/constants";

describe("HnswVectorStoreAdapter", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, OPENAI_API_KEY: "test-key" };
    fsMocks.access.mockReset();
    hnswMocks.load.mockReset();
    hnswMocks.similaritySearch.mockReset();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns not_found when no relevant results", async () => {
    hnswMocks.load.mockResolvedValue({
      similaritySearchWithScore: hnswMocks.similaritySearch.mockResolvedValue([]),
    });
    const adapter = new HnswVectorStoreAdapter({ maxDistance: 0.1 });
    const result = await adapter.search("test query");

    expect(result.status).toBe("not_found");
    expect(result.response).toBe(DEFAULT_CONTEXT_RESPONSE);
    expect(result.contexts).toHaveLength(0);
  });

  it("returns contexts and combined response", async () => {
    hnswMocks.load.mockResolvedValue({
      similaritySearchWithScore: hnswMocks.similaritySearch.mockResolvedValue([
        [
          { pageContent: "Doc A", metadata: { source: "a" } },
          0.05,
        ],
        [
          { pageContent: "Doc B", metadata: { source: "b" } },
          0.08,
        ],
      ]),
    });
    const adapter = new HnswVectorStoreAdapter({ maxDistance: 0.1 });
    const result = await adapter.search("test query");

    expect(result.status).toBe("success");
    expect(result.contexts).toHaveLength(2);
    expect(result.response).toContain("Context 1:\nDoc A");
    expect(result.response).toContain("Context 2:\nDoc B");
  });
});
