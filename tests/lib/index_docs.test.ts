import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const { fsMocks, hnswMocks } = vi.hoisted(() => ({
  fsMocks: {
    readFile: vi.fn(),
    mkdir: vi.fn(),
  },
  hnswMocks: {
    save: vi.fn(),
    fromDocuments: vi.fn(),
  },
}));

vi.mock("fs", () => ({
  promises: fsMocks,
}));

vi.mock("@langchain/community/vectorstores/hnswlib", () => ({
  HNSWLib: {
    fromDocuments: hnswMocks.fromDocuments,
  },
}));

vi.mock("@langchain/openai", () => ({
  OpenAIEmbeddings: class OpenAIEmbeddingsMock {
    constructor() {}
  },
}));

import { promises as fs } from "fs";
import { GenerateEmbeddings } from "../../lib/index_docs";
import { VECTOR_DB_PATH } from "../../lib/constants";

describe("GenerateEmbeddings", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, OPENAI_API_KEY: "test-key" };
    hnswMocks.save.mockClear();
    hnswMocks.fromDocuments.mockClear();
    fsMocks.readFile.mockReset();
    fsMocks.mkdir.mockReset();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("builds documents and saves the vector store", async () => {
    const payload = {
      AAPL: [
        {
          title: "Apple headline",
          link: "https://example.com/aapl",
          ticker: "AAPL",
          full_text: "Apple details",
        },
        {
          title: "",
          link: "https://example.com/empty",
          full_text: "",
        },
      ],
      MSFT: [
        {
          title: "Microsoft headline",
          link: "https://example.com/msft",
          full_text: "",
        },
      ],
    };

    (fs.readFile as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      JSON.stringify(payload),
    );

    hnswMocks.fromDocuments.mockResolvedValue({ save: hnswMocks.save });
    const count = await GenerateEmbeddings();

    expect(count).toBe(2);
    expect(fs.mkdir).toHaveBeenCalledWith(VECTOR_DB_PATH, { recursive: true });
    expect(hnswMocks.fromDocuments).toHaveBeenCalledTimes(1);
    const docs = hnswMocks.fromDocuments.mock.calls[0][0];
    expect(docs).toHaveLength(2);
    expect(docs[0]).toMatchObject({
      pageContent: "Apple headline\n\nApple details",
      metadata: { ticker: "AAPL", title: "Apple headline", source: "https://example.com/aapl" },
    });
    expect(docs[1]).toMatchObject({
      pageContent: "Microsoft headline",
      metadata: { ticker: "MSFT", title: "Microsoft headline", source: "https://example.com/msft" },
    });
    expect(hnswMocks.save).toHaveBeenCalledWith(VECTOR_DB_PATH);
  });

  it("throws when OPENAI_API_KEY is missing", async () => {
    delete process.env.OPENAI_API_KEY;
    await expect(GenerateEmbeddings()).rejects.toThrow("OPENAI_API_KEY is missing");
  });
});
