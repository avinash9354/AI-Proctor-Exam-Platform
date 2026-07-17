'use client';
import clsx from 'clsx';
import { CheckCircle } from 'lucide-react';

interface MCQRendererProps {
  question: Record<string, unknown>;
  answer: unknown;
  onAnswer: (answer: string | string[]) => void;
  multiSelect?: boolean;
}

export function MCQRenderer({ question, answer, onAnswer, multiSelect = false }: MCQRendererProps) {
  const payload = question.payload as Record<string, unknown>;
  const options = payload.options as Array<{ id: string; text: string }>;
  const selected = multiSelect
    ? (answer as string[] || [])
    : (answer as string || null);

  const handleSelect = (optId: string) => {
    if (multiSelect) {
      const arr = answer as string[] || [];
      const next = arr.includes(optId) ? arr.filter((x) => x !== optId) : [...arr, optId];
      onAnswer(next);
    } else {
      onAnswer(optId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-[#e8eaf6] leading-relaxed text-base" dangerouslySetInnerHTML={{ __html: payload.text as string }} />

      <div className="space-y-3">
        {options?.map((opt) => {
          const isSelected = multiSelect
            ? (selected as string[]).includes(opt.id)
            : selected === opt.id;

          return (
            <button
              key={opt.id}
              onClick={() => handleSelect(opt.id)}
              className={clsx(
                'w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-all duration-150',
                isSelected
                  ? 'border-[#4c7ef3] bg-[#4c7ef3]/10 text-[#e8eaf6]'
                  : 'border-[#1e2d50] bg-[#0f1629] text-[#8892b0] hover:border-[#4c7ef3]/40 hover:bg-[#141d33]'
              )}
              id={`option-${opt.id}`}
            >
              <div className={clsx(
                'w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border-2 transition-all',
                isSelected ? 'border-[#4c7ef3] bg-[#4c7ef3]' : 'border-[#4a5568]',
                multiSelect ? 'rounded' : 'rounded-full'
              )}>
                {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
              </div>
              <span className="text-sm leading-relaxed">{opt.text}</span>
            </button>
          );
        })}
      </div>

      {multiSelect && (
        <p className="text-xs text-[#4a5568]">Select all that apply</p>
      )}
    </div>
  );
}
