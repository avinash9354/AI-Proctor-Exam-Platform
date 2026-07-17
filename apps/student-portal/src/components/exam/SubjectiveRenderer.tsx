'use client';
interface SubjectiveRendererProps {
  question: Record<string, unknown>;
  answer: string;
  onAnswer: (answer: string) => void;
}
export function SubjectiveRenderer({ question, answer, onAnswer }: SubjectiveRendererProps) {
  const payload = question.payload as Record<string, unknown>;
  const wordLimit = payload.wordLimit as number | undefined;
  const wordCount = (answer || '').trim().split(/\s+/).filter(Boolean).length;
  return (
    <div className="space-y-4">
      <div className="text-[#e8eaf6] leading-relaxed" dangerouslySetInnerHTML={{ __html: payload.text as string }} />
      {payload.rubric && <div className="p-3 rounded-xl bg-[#0f1629] border border-[#1e2d50] text-xs text-[#8892b0]"><strong className="text-[#4c7ef3]">Rubric:</strong> {payload.rubric as string}</div>}
      <textarea value={answer || ''} onChange={(e) => onAnswer(e.target.value)} rows={12} placeholder="Type your answer here…" className="input resize-none font-sans leading-relaxed" id="subjective-answer" />
      {wordLimit && <p className="text-xs text-[#4a5568] text-right">{wordCount} / {wordLimit} words</p>}
    </div>
  );
}
