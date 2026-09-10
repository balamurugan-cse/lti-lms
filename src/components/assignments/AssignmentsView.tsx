import React, { useState } from 'react';
import { useLMS } from '../../context/LMSContext';
import {
  FileText,
  Calendar,
  Award,
  UploadCloud,
  CheckCircle2,
  Clock,
  Download,
  AlertCircle,
  FileCode,
  File,
  Send,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';

export const AssignmentsView: React.FC = () => {
  const {
    assignments,
    courses,
    submissions,
    submitAssignment,
    gradeSubmission,
    currentUser,
    navigate,
  } = useLMS();

  const [activeAssignmentId, setActiveAssignmentId] = useState<string>(
    assignments[0]?.id || ''
  );
  const [submissionText, setSubmissionText] = useState<string>('');
  const [attachedFileName, setAttachedFileName] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Instructor grading state
  const [instructorGrade, setInstructorGrade] = useState<number>(95);
  const [instructorFeedback, setInstructorFeedback] = useState<string>(
    'Exceptional entity-relationship architecture. The foreign key constraint with cascade rules and composite unique index prevents duplicate enrollments as specified.'
  );

  const activeAssignment =
    assignments.find((a) => a.id === activeAssignmentId) || assignments[0];
  const course = courses.find((c) => c.id === activeAssignment?.courseId);
  const currentSubmission = activeAssignment ? submissions[activeAssignment.id] : undefined;

  if (assignments.length === 0 || !activeAssignment) {
    return (
      <div className="py-20 text-center max-w-xl mx-auto space-y-4">
        <FileText className="w-12 h-12 text-slate-600 mx-auto" />
        <h2 className="text-xl font-extrabold text-white">No active assignments yet</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          There are currently no assignments published across your courses. When faculty members add assignments to course modules, they will appear here.
        </p>
        <button
          onClick={() => navigate('/courses')}
          className="px-5 py-2.5 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 transition-all shadow-md"
        >
          Browse Course Catalog
        </button>
      </div>
    );
  }

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setAttachedFileName(e.dataTransfer.files[0].name);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachedFileName(e.target.files[0].name);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!submissionText.trim() && !attachedFileName) return;
    submitAssignment(activeAssignment.id, submissionText, attachedFileName);
  };

  const handleGrade = (e: React.FormEvent) => {
    e.preventDefault();
    gradeSubmission(activeAssignment.id, instructorGrade, instructorFeedback);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded border border-amber-400/20">
            Student Assessment Portal
          </span>
          <span className="text-xs text-slate-400 font-mono">
            Encrypted Upload Pipeline • S3 Pre-Signed Integrity
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Assignments & Architectural Submissions
        </h1>
        <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
          Submit production-ready artifacts, DDL migrations, and system architecture blueprints for faculty review and quantitative grading.
        </p>
      </div>

      {/* Main Grid: Left Selector, Right Active Assignment Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Assignment List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
            Active Assignments ({assignments.length})
          </h2>

          <div className="space-y-3">
            {assignments.map((assignment) => {
              const c = courses.find((course) => course.id === assignment.courseId);
              const sub = submissions[assignment.id];
              const isSelected = assignment.id === activeAssignmentId;

              return (
                <button
                  key={assignment.id}
                  onClick={() => setActiveAssignmentId(assignment.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                    isSelected
                      ? 'bg-slate-900 border-amber-400/60 shadow-lg'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 text-amber-400">
                        {c?.code || 'LTI-TECH'}
                      </span>
                      {sub ? (
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                            sub.status === 'graded'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-sky-500/20 text-sky-400'
                          }`}
                        >
                          {sub.status.toUpperCase()}
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                          PENDING
                        </span>
                      )}
                    </div>

                    <h3 className="text-xs font-bold text-white leading-snug">
                      {assignment.title}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                    <span className="flex items-center gap-1 font-mono text-amber-400">
                      <Calendar className="w-3 h-3" />
                      Sep 18, 2026
                    </span>
                    <span>{assignment.points} Pts</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Workspace & Submission Portal (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {activeAssignment && (
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 sm:p-8 space-y-6">
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-800">
                <div>
                  <span className="text-xs font-mono font-bold text-amber-400 uppercase">
                    {course?.title}
                  </span>
                  <h2 className="text-xl font-bold text-white mt-1">
                    {activeAssignment.title}
                  </h2>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    {activeAssignment.description}
                  </p>
                </div>

                <div className="flex sm:flex-col items-end gap-2 text-right">
                  <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <div className="text-[10px] text-slate-400 uppercase font-mono">Maximum Points</div>
                    <div className="text-lg font-bold text-amber-400 font-mono">
                      {activeAssignment.points}
                    </div>
                  </div>
                </div>
              </div>

              {/* Rubric Matrix */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                  Evaluation Rubric & Weightings:
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left text-slate-300 border border-slate-800 rounded-xl overflow-hidden">
                    <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-mono">
                      <tr>
                        <th className="p-3">Criterion</th>
                        <th className="p-3 text-right">Weight</th>
                        <th className="p-3">Expectation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 bg-slate-950/40">
                      {activeAssignment.rubric.map((r, i) => (
                        <tr key={i} className="hover:bg-slate-900/50">
                          <td className="p-3 font-semibold text-white">{r.criterion}</td>
                          <td className="p-3 text-right font-mono text-amber-400">{r.weight}%</td>
                          <td className="p-3 text-slate-400">{r.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Starter File Download */}
              {activeAssignment.starterFile && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-400/10 text-amber-400">
                      <FileCode className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">
                        {activeAssignment.starterFile.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {activeAssignment.starterFile.size} • Template Specification
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => alert(`Simulating download of starter asset: ${activeAssignment.starterFile?.name}`)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-amber-400 hover:text-slate-950 text-xs font-semibold text-slate-200 transition-colors flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Starter
                  </button>
                </div>
              )}

              {/* Submission Status or Upload Form */}
              {currentSubmission ? (
                <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span className="text-xs font-bold text-white uppercase font-mono">
                        Submission Status: {currentSubmission.status.toUpperCase()}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">
                      Submitted: {new Date(currentSubmission.submittedAt).toLocaleString()}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase font-mono block mb-1">
                      Submitted Text / Architecture Explanation:
                    </span>
                    <p className="text-xs text-slate-300 p-3 rounded-lg bg-slate-900 border border-slate-800 whitespace-pre-wrap font-mono">
                      {currentSubmission.submissionText}
                    </p>
                  </div>

                  {currentSubmission.attachedFileName && (
                    <div className="flex items-center gap-2 text-xs text-slate-300">
                      <File className="w-4 h-4 text-amber-400" />
                      <span>Attached File: {currentSubmission.attachedFileName}</span>
                    </div>
                  )}

                  {/* Graded Feedback Card */}
                  {currentSubmission.status === 'graded' && (
                    <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-2 mt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-400 uppercase font-mono">
                          Official Grade: {currentSubmission.grade} / 100
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Evaluated by: {currentSubmission.gradedBy || 'Faculty'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {currentSubmission.feedback}
                      </p>
                    </div>
                  )}

                  {/* Instructor Grading Panel if Role is INSTRUCTOR */}
                  {currentUser.role === 'INSTRUCTOR' && (
                    <div className="mt-6 pt-4 border-t border-slate-800 space-y-4">
                      <div className="flex items-center gap-2 text-amber-400">
                        <Award className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase font-mono">
                          Faculty Evaluation Console (RBAC Enabled)
                        </span>
                      </div>

                      <form onSubmit={handleGrade} className="space-y-3">
                        <div>
                          <label className="text-xs text-slate-400 font-mono block mb-1">
                            Grade (0 - 100):
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={instructorGrade}
                            onChange={(e) => setInstructorGrade(Number(e.target.value))}
                            className="w-32 bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white"
                          />
                        </div>

                        <div>
                          <label className="text-xs text-slate-400 font-mono block mb-1">
                            Pedagogical Feedback:
                          </label>
                          <textarea
                            value={instructorFeedback}
                            onChange={(e) => setInstructorFeedback(e.target.value)}
                            rows={3}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                          />
                        </div>

                        <button
                          type="submit"
                          className="px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs"
                        >
                          Submit Faculty Grade
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              ) : (
                /* Submission Form */
                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                    Upload Your Architectural Artifact:
                  </h3>

                  {/* Drag and Drop Zone */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleFileDrop}
                    className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                      isDragging
                        ? 'border-amber-400 bg-amber-400/5'
                        : 'border-slate-800 hover:border-slate-700 bg-slate-950/50'
                    }`}
                  >
                    <UploadCloud className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                    <div className="text-xs text-slate-300">
                      Drag and drop your schema, migration script, or PDF architecture blueprint
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-1">
                      Supports .prisma, .sql, .ts, .pdf up to 10MB
                    </div>

                    <label className="mt-3 inline-block cursor-pointer px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700">
                      Browse Local Files
                      <input
                        type="file"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </label>

                    {attachedFileName && (
                      <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 text-xs font-mono">
                        <File className="w-3.5 h-3.5" />
                        <span>{attachedFileName}</span>
                      </div>
                    )}
                  </div>

                  {/* Text Submission / Architecture Statement */}
                  <div>
                    <label className="text-xs text-slate-400 font-mono block mb-1">
                      System Design Statement & Schema Explanation:
                    </label>
                    <textarea
                      value={submissionText}
                      onChange={(e) => setSubmissionText(e.target.value)}
                      placeholder="Outline your schema normalization reasoning, token rotation sequence, and error handling for unauthorized vs forbidden states..."
                      rows={5}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      id="assignment-submit-btn"
                      type="submit"
                      disabled={!submissionText.trim() && !attachedFileName}
                      className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-lg transition-all disabled:opacity-40 flex items-center gap-2"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Submit to PostgreSQL Registry
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
