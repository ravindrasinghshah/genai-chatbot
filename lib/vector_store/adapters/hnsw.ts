import "server-only";
import { promises as fs } from "fs";
import { HNSWLib } from "@langchain/community/vectorstores/hnswlib";
import { OpenAIEmbeddings } from "@langchain/openai";
import type { Document } from "@langchain/core/documents";
import {
  DEFAULT_CONTEXT_RESPONSE,
  MAX_DISTANCE,
  MAX_RESULTS,
  VECTOR_DB_PATH,
} from "@/lib/constants";
import type { ContextSearchResult, VectorStoreAdapter } from "../types";

type SearchResult = [Document, number];

type HnswAdapterOptions = {
  maxResults?: number;
  maxDistance?: number;
  vectorDbPath?: string;
  embeddingsModel?: string;
};

const formatContext = (content: string) => content.trim();

export class HnswVectorStoreAdapter implements VectorStoreAdapter {
  private vectorStorePromise: Promise<HNSWLib> | null = null;
  private readonly maxResults: number;
  private readonly maxDistance: number;
  private readonly vectorDbPath: string;
  private readonly embeddingsModel: string;

  constructor(options: HnswAdapterOptions = {}) {
    this.maxResults = options.maxResults ?? MAX_RESULTS;
    this.maxDistance = options.maxDistance ?? MAX_DISTANCE;
    this.vectorDbPath = options.vectorDbPath ?? VECTOR_DB_PATH;
    this.embeddingsModel = options.embeddingsModel ?? "text-embedding-3-small";
  }

  private async getVectorStore(): Promise<HNSWLib> {
    if (this.vectorStorePromise) {
      return this.vectorStorePromise;
    }

    this.vectorStorePromise = (async () => {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY is missing.");
      }

      await fs.access(this.vectorDbPath);
      const embeddings = new OpenAIEmbeddings({
        model: this.embeddingsModel,
      });
      return HNSWLib.load(this.vectorDbPath, embeddings);
    })().catch((error) => {
      this.vectorStorePromise = null;
      throw error;
    });

    return this.vectorStorePromise;
  }

  async search(query: string): Promise<ContextSearchResult> {
    const vectorStore = await this.getVectorStore();
    const results = (await vectorStore.similaritySearchWithScore(
      query,
      this.maxResults,
    )) as SearchResult[];

    const relevant = results.filter(
      ([, score]) => Math.abs(score) <= this.maxDistance,
    );
    if (relevant.length === 0) {
      return {
        contexts: [],
        response: DEFAULT_CONTEXT_RESPONSE,
        status: "not_found",
      };
    }

    const contexts = relevant.map(([doc, score]) => ({
      score,
      content: formatContext(doc.pageContent ?? ""),
      metadata: doc.metadata ?? {},
    }));
    const combinedContext = contexts
      .map((ctx, index) => `Context ${index + 1}:\n${ctx.content}`)
      .join("\n\n");

    return {
      contexts,
      response: combinedContext,
      status: "success",
    };
  }
}
