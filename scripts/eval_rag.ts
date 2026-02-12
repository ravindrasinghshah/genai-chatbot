import "dotenv/config";
import { readFile } from "fs/promises";
import path from "path";
import { OpenAiLlmJudge } from "@/lib/eval/llm_judge";

type EvalItem = {
  question: string;
  context: string;
  answer: string;
};

const loadEvalItems = async (): Promise<EvalItem[]> => {
  const filePath = path.join(process.cwd(), "data", "eval_samples.json");
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as EvalItem[];
};

const run = async () => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing.");
  }

  const judge = new OpenAiLlmJudge();
  const items = await loadEvalItems();
  if (items.length === 0) {
    console.log("No eval samples found.");
    return;
  }

  const results: Array<{
    question: string;
    grounded: boolean;
    hallucinationCount: number;
    missingInfo: boolean;
    score: number;
  }> = [];
  
  for (const item of items) {
    const result = await judge.judge(item.question, item.context, item.answer);
    results.push({
      question: item.question,
      grounded: result.grounded,
      hallucinationCount: result.hallucinations.length,
      missingInfo: result.missingInfo,
      score: result.score,
    });
    console.log(
      `[score=${result.score}] grounded=${result.grounded} missingInfo=${result.missingInfo}`,
    );
  }

  const outPath = path.join(process.cwd(), "data", "eval_results.json");
  await import("fs/promises").then((fs) =>
    fs.writeFile(outPath, JSON.stringify(results, null, 2), "utf8"),
  );
  console.log(`Saved results to ${outPath}`);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
