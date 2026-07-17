'use client';
import { useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { oneDark } from '@codemirror/theme-one-dark';
import { Play, Check, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

const LANG_EXTENSIONS: Record<string, ReturnType<typeof javascript>[]> = {
  javascript: [javascript({ jsx: false })],
  python: [python()],
};

interface CodingRendererProps {
  question: Record<string, unknown>;
  answer: unknown;
  onAnswer: (answer: { code: string; language: string }) => void;
}

export function CodingRenderer({ question, answer, onAnswer }: CodingRendererProps) {
  const payload = question.payload as Record<string, unknown>;
  const allowedLangs = (payload.allowedLanguages as string[]) || ['javascript', 'python'];
  const starterCode = (payload.starterCode as Record<string, string>) || {};
  const testCases = (payload.testCases as Array<{ input: string; expectedOutput: string; isHidden: boolean }>) || [];
  const visibleTests = testCases.filter((tc) => !tc.isHidden);

  const ans = answer as { code: string; language: string } | undefined;
  const [language, setLanguage] = useState(ans?.language || allowedLangs[0]);
  const [code, setCode] = useState(ans?.code || starterCode[language] || '');

  const handleChange = (newCode: string) => {
    setCode(newCode);
    onAnswer({ code: newCode, language });
  };

  const handleLangChange = (lang: string) => {
    setLanguage(lang);
    const newCode = starterCode[lang] || '';
    setCode(newCode);
    onAnswer({ code: newCode, language: lang });
  };

  return (
    <div className="space-y-4">
      <div className="text-[#e8eaf6] leading-relaxed" dangerouslySetInnerHTML={{ __html: payload.text as string }} />

      {/* Language selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-[#4a5568] uppercase tracking-widest font-semibold">Language:</span>
        {allowedLangs.map((lang) => (
          <button
            key={lang}
            onClick={() => handleLangChange(lang)}
            className={clsx('px-3 py-1 rounded-lg text-xs font-semibold transition-all', {
              'bg-[#4c7ef3] text-white': language === lang,
              'bg-[#1a2540] text-[#8892b0] hover:bg-[#1e2d50]': language !== lang,
            })}
          >
            {lang}
          </button>
        ))}
      </div>

      {/* Code editor */}
      <div className="rounded-xl overflow-hidden border border-[#1e2d50]">
        <CodeMirror
          value={code}
          height="360px"
          theme={oneDark}
          extensions={LANG_EXTENSIONS[language] || [javascript()]}
          onChange={handleChange}
          basicSetup={{ lineNumbers: true, foldGutter: true, autocompletion: true }}
          style={{ fontSize: '14px', fontFamily: 'JetBrains Mono, monospace' }}
        />
      </div>

      {/* Test cases */}
      {visibleTests.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-[#8892b0] uppercase tracking-widest mb-2">Sample Test Cases</h4>
          <div className="space-y-2">
            {visibleTests.map((tc, i) => (
              <div key={i} className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-xl bg-[#0f1629] border border-[#1e2d50]">
                  <p className="text-[10px] text-[#4a5568] uppercase mb-1">Input</p>
                  <pre className="text-xs text-[#e8eaf6] font-mono">{tc.input}</pre>
                </div>
                <div className="p-3 rounded-xl bg-[#0f1629] border border-[#1e2d50]">
                  <p className="text-[10px] text-[#4a5568] uppercase mb-1">Expected Output</p>
                  <pre className="text-xs text-[#e8eaf6] font-mono">{tc.expectedOutput}</pre>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-[#4a5568] mt-2">
            {testCases.filter((tc) => tc.isHidden).length} hidden test case(s) will be evaluated on submission.
          </p>
        </div>
      )}
    </div>
  );
}
