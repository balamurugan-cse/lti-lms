import React, { useState, useEffect } from 'react';
import { useLMS } from '../../context/LMSContext';
import { Quiz, Question, QuizAttempt } from '../../types';
import confetti from 'canvas-confetti';
import {
  X,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Award,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Code,
} from 'lucide-react';

interface QuizModalProps {
  quizId: string;
  onClose: () => void;
  onViewCertificate?: (courseId: string) => void;
}

export const QuizModal: React.FC<QuizModalProps> = ({
  quizId,
  onClose,
  onViewCertificate,
}) => {
  const { quizzes, currentUser, recordQuizAttempt, quizAttempts } = useLMS();

  const quiz = quizzes.find((q) => q.id === quizId) || quizzes[0];

  if (!quiz) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
        <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 text-center space-y-4">
          <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
          <h3 className="text-base font-bold text-white">Assessment Not Found</h3>
          <p className="text-xs text-slate-400">
            This quiz is currently unavailable or has not been published yet.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // State machine: 'intro' | 'active' | 'results'
  const [stage, setStage] = useState<'intro' | 'active' | 'results'>('intro');
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [timeLeftSec, setTimeLeftSec] = useState<number>((quiz.timeLimitMinutes || 15) * 60);
  const [latestAttemptResult, setLatestAttemptResult] = useState<QuizAttempt | null>(null);

  // Past attempts for this quiz
  const pastAttempts = quizAttempts.filter((a) => a.quizId === quiz.id);
  const attemptsRemaining = Math.max(0, (quiz.maxAttempts || 3) - pastAttempts.length);

  // Timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (stage === 'active' && timeLeftSec > 0) {
      interval = setInterval(() => {
        setTimeLeftSec((prev) => {
          if (prev <= 1) {
            handleFinalSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [stage, timeLeftSec]);

  const handleStartQuiz = () => {
    setSelectedAnswers({});
    setCurrentQIndex(0);
    setTimeLeftSec(quiz.timeLimitMinutes * 60);
    setStage('active');
  };

  const handleSelectOption = (questionId: string, optionId: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleFinalSubmit = () => {
    // Calculate authoritative score
    let earnedPoints = 0;
    let totalPoints = 0;

    quiz.questions.forEach((q) => {
      totalPoints += q.points;
      const chosenOptionId = selectedAnswers[q.id];
      const correctOption = q.options.find((opt) => opt.isCorrect);
      if (chosenOptionId && correctOption && chosenOptionId === correctOption.id) {
        earnedPoints += q.points;
      }
    });

    const percentage = Math.round((earnedPoints / (totalPoints || 1)) * 100);
    const passed = percentage >= quiz.passingScorePercent;

    const attempt = recordQuizAttempt({
      quizId: quiz.id,
      userId: currentUser.id,
      score: earnedPoints,
      totalPoints,
      percentage,
      passed,
      answers: selectedAnswers,
    });

    setLatestAttemptResult(attempt);
    setStage('results');

    if (passed) {
      // Trigger festive celebration confetti
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FACC15', '#EAB308', '#FFFFFF', '#38BDF8'],
        });
      } catch {
        // Safe fallback
      }
    }
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentQuestion = quiz.questions[currentQIndex];
  const allAnswered = quiz.questions.every((q) => !!selectedAnswers[q.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Strip */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-400/10 text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-white">
                {quiz.title}
              </h2>
              <span className="text-[11px] text-slate-400 font-mono">
                Passing Grade: {quiz.passingScorePercent}% • LTI Certified
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {stage === 'active' && (
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-mono text-xs font-bold ${
                  timeLeftSec < 120
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse'
                    : 'bg-slate-800 text-amber-400 border border-slate-700'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                {formatTimer(timeLeftSec)}
              </div>
            )}

            <button
              id="quiz-modal-close-btn"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Close Quiz"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body Based on Stage */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* STAGE 1: INTRO */}
          {stage === 'intro' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <p className="text-xs text-slate-300 leading-relaxed">
                  {quiz.description}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-mono">Questions</div>
                  <div className="text-lg font-bold text-white font-mono mt-1">
                    {quiz.questions.length}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-mono">Time Limit</div>
                  <div className="text-lg font-bold text-amber-400 font-mono mt-1">
                    {quiz.timeLimitMinutes} min
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-mono">Attempts Left</div>
                  <div className="text-lg font-bold text-white font-mono mt-1">
                    {attemptsRemaining} / {quiz.maxAttempts}
                  </div>
                </div>
              </div>

              {pastAttempts.length > 0 && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-slate-300 uppercase font-mono">
                    Previous Attempts History:
                  </span>
                  <div className="divide-y divide-slate-800/80">
                    {pastAttempts.map((att, idx) => (
                      <div key={att.id} className="py-2 flex items-center justify-between text-xs">
                        <span className="text-slate-400">
                          Attempt #{pastAttempts.length - idx} ({new Date(att.timestamp).toLocaleDateString()})
                        </span>
                        <span
                          className={`font-mono font-bold ${
                            att.passed ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {att.percentage}% — {att.passed ? 'PASSED' : 'NOT PASSED'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  id="quiz-start-attempt-btn"
                  disabled={attemptsRemaining <= 0}
                  onClick={handleStartQuiz}
                  className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-lg transition-all disabled:opacity-40"
                >
                  {attemptsRemaining <= 0 ? 'No Attempts Remaining' : 'Begin Assessment Now'}
                </button>
              </div>
            </div>
          )}

          {/* STAGE 2: ACTIVE QUESTIONS */}
          {stage === 'active' && currentQuestion && (
            <div className="space-y-6">
              {/* Question Index Progress Dots */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono text-slate-400">
                  Question <span className="text-amber-400 font-bold">{currentQIndex + 1}</span> of {quiz.questions.length}
                </span>

                <div className="flex items-center gap-1.5">
                  {quiz.questions.map((q, idx) => {
                    const isAnswered = !!selectedAnswers[q.id];
                    const isCurrent = idx === currentQIndex;
                    return (
                      <button
                        key={q.id}
                        onClick={() => setCurrentQIndex(idx)}
                        className={`w-6 h-6 rounded-md text-[11px] font-mono font-bold transition-all ${
                          isCurrent
                            ? 'bg-amber-400 text-slate-950'
                            : isAnswered
                            ? 'bg-slate-800 text-amber-300 border border-amber-400/40'
                            : 'bg-slate-950 text-slate-500 border border-slate-800'
                        }`}
                        title={`Go to Question ${idx + 1}`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Question Card */}
              <div className="space-y-4">
                <h3 className="text-sm sm:text-base font-bold text-white leading-relaxed">
                  {currentQuestion.prompt}
                </h3>

                {/* Optional Code Snippet */}
                {currentQuestion.codeSnippet && (
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-amber-300/90 overflow-x-auto">
                    <div className="flex items-center gap-1 text-slate-500 mb-1">
                      <Code className="w-3 h-3" />
                      <span className="text-[10px] uppercase font-mono">Code Reference</span>
                    </div>
                    <pre>{currentQuestion.codeSnippet}</pre>
                  </div>
                )}

                {/* Multiple Choice Options */}
                <div className="space-y-2.5 pt-2">
                  {currentQuestion.options.map((opt, optIdx) => {
                    const isSelected = selectedAnswers[currentQuestion.id] === opt.id;
                    const letter = String.fromCharCode(65 + optIdx);

                    return (
                      <button
                        key={opt.id}
                        onClick={() => handleSelectOption(currentQuestion.id, opt.id)}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
                          isSelected
                            ? 'bg-amber-400/15 border-amber-400 text-white shadow-[0_0_12px_rgba(250,204,21,0.15)]'
                            : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300 hover:bg-slate-950'
                        }`}
                      >
                        <span
                          className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono text-xs font-bold flex-shrink-0 mt-0.5 ${
                            isSelected
                              ? 'bg-amber-400 text-slate-950'
                              : 'bg-slate-900 text-slate-400 border border-slate-800'
                          }`}
                        >
                          {letter}
                        </span>
                        <span className="text-xs sm:text-sm leading-relaxed">{opt.text}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Navigation & Submit Bottom */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  disabled={currentQIndex === 0}
                  onClick={() => setCurrentQIndex((p) => p - 1)}
                  className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white disabled:opacity-30 flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>

                {currentQIndex < quiz.questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentQIndex((p) => p + 1)}
                    className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    id="quiz-submit-final-btn"
                    onClick={handleFinalSubmit}
                    className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                      allAnswered
                        ? 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                        : 'bg-amber-400/70 text-slate-950'
                    }`}
                  >
                    Submit Assessment ({Object.keys(selectedAnswers).length}/{quiz.questions.length})
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STAGE 3: RESULTS & EXPLANATIONS */}
          {stage === 'results' && latestAttemptResult && (
            <div className="space-y-6">
              {/* Score Card */}
              <div
                className={`p-6 rounded-2xl border text-center space-y-2 ${
                  latestAttemptResult.passed
                    ? 'bg-gradient-to-b from-emerald-950/40 to-slate-950 border-emerald-500/40'
                    : 'bg-gradient-to-b from-rose-950/40 to-slate-950 border-rose-500/40'
                }`}
              >
                <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center">
                  {latestAttemptResult.passed ? (
                    <Award className="w-10 h-10 text-amber-400" />
                  ) : (
                    <AlertTriangle className="w-10 h-10 text-rose-400" />
                  )}
                </div>

                <div className="text-3xl font-extrabold font-mono text-white">
                  {latestAttemptResult.percentage}%
                </div>
                <div
                  className={`text-xs font-mono font-bold uppercase tracking-wider ${
                    latestAttemptResult.passed ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {latestAttemptResult.passed
                    ? 'Assessment Passed • Criterion Met'
                    : `Score Below ${quiz.passingScorePercent}% Passing Standard`}
                </div>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {latestAttemptResult.passed
                    ? 'Excellent work! Your authoritative assessment score has been recorded into the database.'
                    : 'Review the detailed pedagogical explanations below and retake the assessment.'}
                </p>
              </div>

              {/* Detailed Question Review */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                  Detailed Answer Key & Security Rationale:
                </h4>

                <div className="space-y-4">
                  {quiz.questions.map((q, idx) => {
                    const selectedId = latestAttemptResult.answers[q.id];
                    const selectedOpt = q.options.find((o) => o.id === selectedId);
                    const correctOpt = q.options.find((o) => o.isCorrect);
                    const isUserCorrect = selectedOpt?.isCorrect;

                    return (
                      <div
                        key={q.id}
                        className={`p-4 rounded-xl bg-slate-950 border ${
                          isUserCorrect ? 'border-emerald-500/30' : 'border-rose-500/30'
                        } space-y-3`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <span className="text-xs font-bold text-slate-200">
                            Q{idx + 1}: {q.prompt}
                          </span>
                          {isUserCorrect ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold whitespace-nowrap">
                              +{q.points} PTS
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[10px] font-mono font-bold whitespace-nowrap">
                              0 PTS
                            </span>
                          )}
                        </div>

                        <div className="text-xs space-y-1">
                          <div className="text-slate-400">
                            <span className="font-semibold text-slate-300">Your choice:</span>{' '}
                            {selectedOpt ? selectedOpt.text : 'None selected'}
                          </div>
                          {!isUserCorrect && (
                            <div className="text-emerald-400 font-semibold">
                              <span>Correct answer:</span> {correctOpt?.text}
                            </div>
                          )}
                        </div>

                        {/* Pedagogical Explanation */}
                        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 leading-relaxed">
                          <span className="text-amber-400 font-bold block mb-0.5">
                            Why this matters:
                          </span>
                          {correctOpt?.explanation}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white"
                >
                  Close
                </button>

                <div className="flex items-center gap-2">
                  {attemptsRemaining > 0 && !latestAttemptResult.passed && (
                    <button
                      onClick={handleStartQuiz}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                      Retake ({attemptsRemaining} left)
                    </button>
                  )}

                  {latestAttemptResult.passed && (
                    <button
                      onClick={onClose}
                      className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs"
                    >
                      Continue Learning →
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
