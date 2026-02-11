import { SUGGEST_QUESTIONS_PROMPTS } from "@/lib/constants";

type SuggestQuestionProps = {
  clickEventHandler: (value: string) => void;
};

export function SuggestQuestion({ clickEventHandler }: SuggestQuestionProps) {
  const handleClick = (question: string) => {
    clickEventHandler(question);
  };
  return (
    <div className="flex flex-wrap gap-2">
      {SUGGEST_QUESTIONS_PROMPTS.map((question) => (
        <button
          key={question}
          type="button"
          onClick={() => {
            handleClick(question);
          }}
          className="cursor-pointer rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-700"
        >
          {question}
        </button>
      ))}
    </div>
  );
}
