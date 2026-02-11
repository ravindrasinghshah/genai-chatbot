import { INJECTION_PATTERNS } from "@/lib/constants";

export const isPromptInjection = (input: string) =>
  INJECTION_PATTERNS.some((pattern) => pattern.test(input));
