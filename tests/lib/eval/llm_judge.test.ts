import { describe, it, expect } from "vitest";
import { parseJudgeResponse } from "../../../lib/eval/llm_judge";

describe("parseJudgeResponse", () => {
  it("parses valid JSON", () => {
    const raw = `{"grounded":true,"hallucinations":[],"missingInfo":false,"score":5}`;
    const result = parseJudgeResponse(raw);
    expect(result.grounded).toBe(true);
    expect(result.hallucinations).toHaveLength(0);
    expect(result.missingInfo).toBe(false);
    expect(result.score).toBe(5);
  });

  it("extracts JSON from wrapped text", () => {
    const raw = `Result:\\n{"grounded":false,"hallucinations":["X"],"missingInfo":true,"score":1}`;
    const result = parseJudgeResponse(raw);
    expect(result.grounded).toBe(false);
    expect(result.hallucinations).toEqual(["X"]);
    expect(result.missingInfo).toBe(true);
    expect(result.score).toBe(1);
  });

  it("returns safe defaults on invalid JSON", () => {
    const raw = "not json";
    const result = parseJudgeResponse(raw);
    expect(result.grounded).toBe(false);
    expect(result.hallucinations).toHaveLength(0);
    expect(result.missingInfo).toBe(true);
    expect(result.score).toBe(0);
  });
});
