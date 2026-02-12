import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { CHAT_MODEL } from "@/lib/constants";

export type LlmJudgeResult = {
  grounded: boolean;
  hallucinations: string[];
  missingInfo: boolean;
  score: number;
};

export interface LlmJudge {
  judge(question: string, context: string, answer: string): Promise<LlmJudgeResult>;
}

const judgePrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    "You are a strict evaluator of RAG answers. Only use the provided context.",
  ],
  [
    "human",
    `Question:
{question}

Context:
{context}

Answer:
{answer}

Return JSON with keys:
grounded (boolean),
hallucinations (array of unsupported sentences),
missingInfo (boolean),
score (0-5).`,
  ],
]);

export class OpenAiLlmJudge implements LlmJudge {
  private model = new ChatOpenAI({ model: CHAT_MODEL, temperature: 0 });

  async judge(question: string, context: string, answer: string) {
    const response = await judgePrompt.pipe(this.model).invoke({
      question,
      context,
      answer,
    });
    const content =
      typeof response.content === "string"
        ? response.content
        : JSON.stringify(response.content);
    return parseJudgeResponse(content);
  }
}

export const parseJudgeResponse = (raw: string): LlmJudgeResult => {
  try {
    const jsonStart = raw.indexOf("{");
    const jsonEnd = raw.lastIndexOf("}");
    const slice =
      jsonStart >= 0 && jsonEnd >= jsonStart ? raw.slice(jsonStart, jsonEnd + 1) : raw;
    const data = JSON.parse(slice) as LlmJudgeResult;
    return {
      grounded: Boolean(data.grounded),
      hallucinations: Array.isArray(data.hallucinations) ? data.hallucinations : [],
      missingInfo: Boolean(data.missingInfo),
      score: Number.isFinite(data.score) ? data.score : 0,
    };
  } catch {
    return {
      grounded: false,
      hallucinations: [],
      missingInfo: true,
      score: 0,
    };
  }
};
