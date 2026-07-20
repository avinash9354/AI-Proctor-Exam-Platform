'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { examClient } from '@/lib/apiClient';
import { HelpCircle, Search, Plus, Trash2, Edit2, CheckCircle, Code, FileText, CheckSquare, Layers, Filter, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';

export default function AdminQuestionBankPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [difficultyFilter, setDifficultyFilter] = useState('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const queryClient = useQueryClient();

  const [newQuestion, setNewQuestion] = useState({
    type: 'mcq',
    points: 10,
    marks: 10,
    difficulty: 'medium',
    payload: {
      prompt: '',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctOption: 0,
    } as any,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-questions'],
    queryFn: () => examClient.get('/questions').then((r) => r.data.data).catch(() => []),
  });

  const questions = (Array.isArray(data) ? data : []).filter((q: any) => {
    const prompt = q.payload?.text || q.payload?.prompt || q.payload?.question || '';
    const matchesSearch = !search || prompt.toLowerCase().includes(search.toLowerCase());
    const matchesType =
      typeFilter === 'ALL' ||
      q.type === typeFilter ||
      (typeFilter === 'mcq' && q.type === 'multiple_choice') ||
      (typeFilter === 'subjective' && q.type === 'essay');
    const matchesDiff = difficultyFilter === 'ALL' || q.difficulty === difficultyFilter;
    return matchesSearch && matchesType && matchesDiff;
  });

  const createMutation = useMutation({
    mutationFn: async (questionData: typeof newQuestion) => {
      const qType =
        questionData.type === 'multiple_choice'
          ? 'mcq'
          : questionData.type === 'essay'
          ? 'subjective'
          : questionData.type;

      const promptText = questionData.payload.prompt || questionData.payload.text || 'Untitled Question';

      let formattedPayload: any = {
        type: qType,
        text: promptText,
      };

      if (qType === 'mcq') {
        const rawOptions = Array.isArray(questionData.payload.options)
          ? questionData.payload.options
          : ['Option A', 'Option B', 'Option C', 'Option D'];
        const correctIdx = questionData.payload.correctOption ?? 0;
        formattedPayload.options = rawOptions.map((opt: any, idx: number) => {
          if (typeof opt === 'string') {
            return { id: `opt-${idx}`, text: opt, isCorrect: idx === correctIdx };
          }
          return {
            id: opt.id || `opt-${idx}`,
            text: opt.text || '',
            isCorrect: Boolean(opt.isCorrect || idx === correctIdx),
          };
        });
      } else if (qType === 'coding') {
        formattedPayload.testCases = [
          { input: 'sample input', expectedOutput: 'sample output', isHidden: false },
        ];
        formattedPayload.timeLimit = 2000;
        formattedPayload.memoryLimit = 256;
        formattedPayload.allowedLanguages = ['javascript', 'python', 'java', 'cpp'];
      }

      const payloadToSend = {
        examId: null,
        type: qType,
        marks: Number(questionData.marks ?? questionData.points ?? 10),
        negativeMarks: 0,
        payload: formattedPayload,
      };

      const res = await examClient.post('/questions', payloadToSend);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-questions'] });
      setIsCreateModalOpen(false);
      setNewQuestion({
        type: 'mcq',
        points: 10,
        marks: 10,
        difficulty: 'medium',
        payload: { prompt: '', options: ['Option A', 'Option B', 'Option C', 'Option D'], correctOption: 0 },
      });
      setErrorMsg('');
    },
    onError: (err: any) => {
      setErrorMsg(err?.response?.data?.error || 'Failed to create question');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await examClient.delete(`/questions/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-questions'] });
    },
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'coding': return <Code className="w-4 h-4 text-purple-400" />;
      case 'subjective':
      case 'essay': return <FileText className="w-4 h-4 text-amber-400" />;
      default: return <CheckSquare className="w-4 h-4 text-[#4c7ef3]" />;
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#e8eaf6]">
            Central <span className="gradient-text">Question Bank</span>
          </h1>
          <p className="text-[#8892b0] mt-1 text-sm">Create, manage, and categorize reusable examination items and AI assessments</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#1a2540] border border-[#1e2d50]">
            <Search className="w-4 h-4 text-[#4a5568]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search prompt..."
              className="bg-transparent text-sm text-[#e8eaf6] outline-none w-44 placeholder:text-[#4a5568]"
              id="question-search"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#1a2540] border border-[#1e2d50] text-sm text-[#e8eaf6] outline-none capitalize"
            id="type-filter"
          >
            <option value="ALL">All Types</option>
            <option value="mcq">Multiple Choice</option>
            <option value="subjective">Essay / Free Text</option>
            <option value="coding">Coding Challenge</option>
          </select>
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#1a2540] border border-[#1e2d50] text-sm text-[#e8eaf6] outline-none capitalize"
            id="difficulty-filter"
          >
            <option value="ALL">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn-primary flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-[#4c7ef3] to-[#7c3aed] text-white hover:opacity-90 transition-opacity"
            id="create-question-btn"
          >
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card p-5 border border-[#1e2d50] rounded-2xl bg-[#0f1629]">
          <div className="text-[#4c7ef3] mb-3 flex items-center justify-between">
            <Layers className="w-5 h-5" />
            <span className="text-xs bg-[#4c7ef3]/10 text-[#4c7ef3] px-2.5 py-1 rounded-full font-semibold">Total</span>
          </div>
          <div className="text-2xl font-bold text-[#e8eaf6]">{data?.length || 0}</div>
          <div className="text-xs text-[#8892b0] mt-0.5">Total Questions in Repository</div>
        </div>
        <div className="card p-5 border border-[#1e2d50] rounded-2xl bg-[#0f1629]">
          <div className="text-blue-400 mb-3 flex items-center justify-between">
            <CheckSquare className="w-5 h-5" />
            <span className="text-xs bg-blue-400/10 text-blue-400 px-2.5 py-1 rounded-full font-semibold">MCQ</span>
          </div>
          <div className="text-2xl font-bold text-[#e8eaf6]">
            {(data || []).filter((q: any) => q.type === 'mcq' || q.type === 'multiple_choice').length}
          </div>
          <div className="text-xs text-[#8892b0] mt-0.5">Multiple Choice Items</div>
        </div>
        <div className="card p-5 border border-[#1e2d50] rounded-2xl bg-[#0f1629]">
          <div className="text-purple-400 mb-3 flex items-center justify-between">
            <Code className="w-5 h-5" />
            <span className="text-xs bg-purple-400/10 text-purple-400 px-2.5 py-1 rounded-full font-semibold">Coding</span>
          </div>
          <div className="text-2xl font-bold text-[#e8eaf6]">
            {(data || []).filter((q: any) => q.type === 'coding').length}
          </div>
          <div className="text-xs text-[#8892b0] mt-0.5">Programming Problems</div>
        </div>
        <div className="card p-5 border border-[#1e2d50] rounded-2xl bg-[#0f1629]">
          <div className="text-amber-400 mb-3 flex items-center justify-between">
            <FileText className="w-5 h-5" />
            <span className="text-xs bg-amber-400/10 text-amber-400 px-2.5 py-1 rounded-full font-semibold">Essay</span>
          </div>
          <div className="text-2xl font-bold text-[#e8eaf6]">
            {(data || []).filter((q: any) => q.type === 'subjective' || q.type === 'essay').length}
          </div>
          <div className="text-xs text-[#8892b0] mt-0.5">Long-form Written Responses</div>
        </div>
      </div>

      {/* Questions Table / List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="card h-20 animate-pulse bg-[#1a2540] rounded-2xl border border-[#1e2d50]" />)}
        </div>
      ) : questions.length === 0 ? (
        <div className="card flex flex-col items-center py-16 text-center border border-[#1e2d50] rounded-2xl bg-[#0f1629]">
          <HelpCircle className="w-12 h-12 text-[#1e2d50] mb-4" />
          <p className="text-[#8892b0] font-medium">{search || typeFilter !== 'ALL' || difficultyFilter !== 'ALL' ? 'No questions match your current filters.' : 'Your question bank is empty.'}</p>
          {!search && typeFilter === 'ALL' && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-[#4c7ef3]/20 text-[#4c7ef3] border border-[#4c7ef3]/30 hover:bg-[#4c7ef3]/30 transition-colors"
            >
              Create First Question
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((question: any) => {
            const prompt = question.payload?.text || question.payload?.prompt || question.payload?.question || 'Untitled Question';
            const marksVal = question.marks ?? question.points ?? 0;
            return (
              <div key={question.id} className="card p-5 border border-[#1e2d50] rounded-2xl bg-[#0f1629] hover:border-[#4c7ef3]/40 transition-colors flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[#1a2540] border border-[#1e2d50] flex items-center justify-center flex-shrink-0 mt-0.5">
                    {getTypeIcon(question.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs uppercase tracking-wider font-bold text-[#4c7ef3] bg-[#4c7ef3]/10 px-2 py-0.5 rounded">
                        {(question.type === 'mcq' || question.type === 'multiple_choice') ? 'MCQ' : question.type.replace('_', ' ')}
                      </span>
                      <span className={`text-xs capitalize font-semibold px-2 py-0.5 rounded ${
                        question.difficulty === 'hard' ? 'bg-red-900/30 text-red-400' :
                        question.difficulty === 'medium' ? 'bg-amber-900/30 text-amber-400' :
                        'bg-emerald-900/30 text-emerald-400'
                      }`}>
                        {question.difficulty || 'medium'}
                      </span>
                      <span className="text-xs font-semibold text-[#8892b0] bg-[#1a2540] px-2 py-0.5 rounded">
                        {marksVal} {marksVal === 1 ? 'pt' : 'pts'}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-[#e8eaf6] break-words line-clamp-2">{prompt}</h3>
                    {(question.type === 'mcq' || question.type === 'multiple_choice') && Array.isArray(question.payload?.options) && (
                      <div className="mt-2.5 grid grid-cols-2 gap-2">
                        {question.payload.options.map((opt: any, i: number) => {
                          const optText = typeof opt === 'string' ? opt : opt?.text;
                          const isCorrect = typeof opt === 'string' ? i === question.payload?.correctOption : opt?.isCorrect;
                          return (
                            <div key={i} className={`text-xs px-2.5 py-1.5 rounded-lg border ${
                              isCorrect ? 'bg-emerald-900/20 border-emerald-500/40 text-emerald-300 font-medium' : 'bg-[#1a2540]/60 border-[#1e2d50] text-[#8892b0]'
                            }`}>
                              {String.fromCharCode(65 + i)}. {optText}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => deleteMutation.mutate(question.id)}
                    disabled={deleteMutation.isPending}
                    className="p-2 rounded-xl border border-[#1e2d50] hover:bg-red-900/20 hover:border-red-700/40 text-[#8892b0] hover:text-red-400 transition-colors"
                    title="Delete Question"
                    id={`delete-q-${question.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Question Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f1629] border border-[#1e2d50] rounded-2xl p-6 w-full max-w-xl shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-4 border-b border-[#1e2d50] pb-3">
              <h3 className="text-lg font-bold text-[#e8eaf6] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#4c7ef3]" /> Add Question to Bank
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-[#4a5568] hover:text-[#e8eaf6]">✕</button>
            </div>
            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-red-900/30 border border-red-700/30 text-red-400 text-xs">
                {errorMsg}
              </div>
            )}
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(newQuestion); }} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#8892b0] block mb-1">Type</label>
                  <select
                    value={newQuestion.type}
                    onChange={(e) => {
                      const t = e.target.value;
                      setNewQuestion({
                        ...newQuestion,
                        type: t,
                        payload: (t === 'mcq' || t === 'multiple_choice') ? { prompt: newQuestion.payload.prompt, options: ['Option A', 'Option B', 'Option C', 'Option D'], correctOption: 0 } : { prompt: newQuestion.payload.prompt },
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-[#1a2540] border border-[#1e2d50] text-sm text-[#e8eaf6] outline-none"
                  >
                    <option value="mcq">Multiple Choice</option>
                    <option value="subjective">Essay / Free Text</option>
                    <option value="coding">Coding Challenge</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#8892b0] block mb-1">Difficulty</label>
                  <select
                    value={newQuestion.difficulty}
                    onChange={(e) => setNewQuestion({ ...newQuestion, difficulty: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#1a2540] border border-[#1e2d50] text-sm text-[#e8eaf6] outline-none"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#8892b0] block mb-1">Points</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={newQuestion.marks ?? newQuestion.points ?? 10}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setNewQuestion({ ...newQuestion, points: val, marks: val });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-[#1a2540] border border-[#1e2d50] text-sm text-[#e8eaf6] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#8892b0] block mb-1">Question Prompt</label>
                <textarea
                  required
                  rows={3}
                  value={newQuestion.payload.prompt}
                  onChange={(e) => setNewQuestion({ ...newQuestion, payload: { ...newQuestion.payload, prompt: e.target.value } })}
                  placeholder="Enter the main question prompt or scenario here..."
                  className="w-full px-3 py-2 rounded-xl bg-[#1a2540] border border-[#1e2d50] text-sm text-[#e8eaf6] outline-none focus:border-[#4c7ef3]"
                />
              </div>

              {(newQuestion.type === 'mcq' || newQuestion.type === 'multiple_choice') && (
                <div className="space-y-3 bg-[#1a2540]/40 p-4 rounded-xl border border-[#1e2d50]">
                  <label className="text-xs font-semibold text-[#e8eaf6] block">Answer Options & Correct Key</label>
                  {(newQuestion.payload.options || []).map((opt: any, i: number) => {
                    const optText = typeof opt === 'string' ? opt : opt?.text || '';
                    return (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="correctOpt"
                          checked={newQuestion.payload.correctOption === i}
                          onChange={() => setNewQuestion({ ...newQuestion, payload: { ...newQuestion.payload, correctOption: i } })}
                          className="text-[#4c7ef3] focus:ring-0 cursor-pointer"
                          title={`Select option ${String.fromCharCode(65 + i)} as correct`}
                        />
                        <span className="text-xs font-bold text-[#8892b0] w-5">{String.fromCharCode(65 + i)}.</span>
                        <input
                          type="text"
                          required
                          value={optText}
                          onChange={(e) => {
                            const nextOpts = [...(newQuestion.payload.options || [])];
                            nextOpts[i] = typeof nextOpts[i] === 'string' ? e.target.value : { ...nextOpts[i], text: e.target.value };
                            setNewQuestion({ ...newQuestion, payload: { ...newQuestion.payload, options: nextOpts } });
                          }}
                          className="flex-1 px-3 py-1.5 rounded-lg bg-[#0f1629] border border-[#1e2d50] text-xs text-[#e8eaf6] outline-none"
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-[#1e2d50]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#8892b0] hover:bg-[#1a2540]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-[#4c7ef3] to-[#7c3aed] text-white hover:opacity-90 disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Saving...' : 'Save Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
