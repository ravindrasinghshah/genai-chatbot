/**
 * Generate indexes for vector store
 */

import { HNSWLib } from "@langchain/community/vectorstores/hnswlib";
import type { Document } from "@langchain/core/documents";
import { OpenAIEmbeddings } from "@langchain/openai";
import "dotenv/config";
import { promises as fs } from "fs";
import path from "path";
import { VECTOR_DB_PATH } from "@/lib/constants";

const DATA_FILE_PATH = path.join(process.cwd(), "data", "stock_news_sanitized.json");

type StockNewsItem = {
    title: string;
    link: string;
    ticker?: string;
    full_text?: string;
};

type StockNewsMap = Record<string, StockNewsItem[]>;

async function loadDocuments(): Promise<Document[]> {
    const raw = await fs.readFile(DATA_FILE_PATH, "utf-8");
    const data = JSON.parse(raw) as StockNewsMap;
    const documents: Document[] = [];

    for (const [symbol, items] of Object.entries(data)) {
        for (const item of items) {
            const contentParts = [item.title, item.full_text].filter(Boolean);
            const pageContent = contentParts.join("\n\n");
            if (!pageContent.trim()) {
                continue;
            }

            documents.push({
                pageContent,
                metadata: {
                    ticker: item.ticker ?? symbol,
                    title: item.title,
                    source: item.link,
                },
            });
        }
    }

    return documents;
}

export async function GenerateEmbeddings() {
    console.log("==== START: Data indexing ====");
    if (!process.env.OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY is missing. Add it to .env before running.");
    }
    const embeddings = new OpenAIEmbeddings({
        model: "text-embedding-3-small",
    });
    const documents = await loadDocuments();
    if (documents.length === 0) {
        throw new Error("No documents found in stock_news.json.");
    }
    console.log(`Loaded Documents: ${documents.length}`);

    await fs.mkdir(VECTOR_DB_PATH, { recursive: true });
    const vectorStore = await HNSWLib.fromDocuments(documents, embeddings);
    await vectorStore.save(VECTOR_DB_PATH);
    console.log("==== END: Data indexing ====");
    return documents.length;
}

//== run only if called as a script
if (process.argv[1]?.includes("index_docs")) {
    GenerateEmbeddings()
        .then((count) => {
            console.log(`Indexed ${count} documents into ${VECTOR_DB_PATH}`);
        })
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}
