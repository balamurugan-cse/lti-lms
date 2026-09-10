import React from 'react';
import { useLMS } from '../../context/LMSContext';
import {
  Play,
  CheckCircle,
  Clock,
  Award,
  BookOpen,
  Calendar,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  FileCheck,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  GraduationCap,
} from 'lucide-react';

interface StudentDashboardProps {
  onOpenQuiz: (quizId: string) => void;
  onOpenCertificate: (courseId: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  onOpenQuiz,
  onOpenCertificate,
}) => {
  const {
    currentUser,
    courses,
    enrolledCourseIds,
    courseProgress,
    getCourseProgressPercentage,
    startLesson,
    navigate,
    quizzes,
    assignments,
    submissions,
    announcements,
    quizAttempts,
  } = useLMS();

  // If user is not authenticated, show welcoming login prompt
  if (!currentUser) {
    return (
      <div className="py-12 space-y-8">
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-slate-800 p-8 sm:p-12 shadow-2xl text-center max-w-3xl mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Student Learning Portal
          </h1>
          <p className="text-sm text-slate-300 mt-2 max-w-xl mx-auto leading-relaxed">
            Sign in with your student credentials to view enrolled courses, resume active modules, submit assignments, and earn verified certificates.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => navigate('/student/login')}
              className="px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-lg transition-all"
            >
              Sign In as Student
            </button>
            <button
              onClick={() => navigate('/student/register')}
              className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-colors"
            >
              Create Account
            </button>
            <button
              onClick={() => navigate('/courses')}
              className="px-6 py-3 rounded-xl bg-slate-900/60 hover:bg-slate-900 text-slate-400 hover:text-slate-200 font-semibold text-xs border border-slate-800 transition-colors"
            >
              Browse Catalog
            </button>
          </div>
        </section>
      </div>
    );
  }

  const enrolledCourses = courses.filter((c) => enrolledCourseIds.includes(c.id));

  // Only display Continue Learning banner if student has actually enrolled in at least one course
  const primaryCourse = enrolledCourses[0] || null;
  const primaryProgressPercent = primaryCourse
    ? getCourseProgressPercentage(primaryCourse.id)
    : 0;
  const primaryProgress = primaryCourse ? courseProgress[primaryCourse.id] : null;

  // Determine current lesson
  const currentLessonId = primaryProgress?.lastAccessedLessonId || primaryCourse?.modules[0]?.lessons[0]?.id;
  let currentLessonTitle = 'First Module Lesson';
  if (primaryCourse) {
    for (const mod of primaryCourse.modules) {
      const found = mod.lessons.find((l) => l.id === currentLessonId);
      if (found) {
        currentLessonTitle = found.title;
        break;
      }
    }
  }

  // Calculate real metrics from authentic state
  const totalCompletedLessons = Object.values(courseProgress).reduce(
    (acc, p) => acc + (p.completedLessonIds?.length || 0),
    0
  );

  const totalPossibleLessons = enrolledCourses.reduce(
    (acc, c) => acc + c.modules.reduce((mAcc, m) => mAcc + m.lessons.length, 0),
    0
  );

  const passedQuizzesCount = quizAttempts.filter((a) => a.passed).length;

  const earnedCertificates = enrolledCourses.filter(
    (c) => courseProgress[c.id]?.certificateIssued
  );

  return (
    <div className="space-y-8 pb-16">
      {/* Top Welcome & Session Track Bar */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-slate-800 p-6 sm:p-8 shadow-xl">
        <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-amber-400/10 text-amber-400 border border-amber-400/20">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Active Session • RBAC Verified ({currentUser.role})
              </span>
              <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                ID: {currentUser.studentId || currentUser.id}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, <span className="text-amber-400">{currentUser.name}</span>
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Track your coursework, access interactive lesson modules, and complete assessments evaluated by authoritative backend logic.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {primaryCourse ? (
              <button
                id="dashboard-resume-hero-btn"
                onClick={() => startLesson(primaryCourse.id, currentLessonId)}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm shadow-md transition-all transform hover:-translate-y-0.5"
              >
                <Play className="w-4 h-4 fill-current" />
                Resume Learning
              </button>
            ) : null}

            <button
              id="dashboard-browse-courses-btn"
              onClick={() => navigate('/courses')}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold border border-slate-700 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              Explore Catalog
            </button>
          </div>
        </div>
      </section>

      {/* Quantitative Real Metrics */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm relative overflow-hidden group hover:border-amber-400/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Lessons Completed</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
            {totalCompletedLessons}
            <span className="text-xs text-slate-400 font-normal ml-1">
              / {totalPossibleLessons}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
            <span className="text-emerald-400 font-semibold">Authoritative</span> progress
          </div>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm relative overflow-hidden group hover:border-amber-400/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Track Progress</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono">
            {primaryProgressPercent}%
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-amber-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${primaryProgressPercent}%` }}
            />
          </div>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm relative overflow-hidden group hover:border-amber-400/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Quizzes Passed</span>
            <ShieldCheck className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
            {passedQuizzesCount}
            <span className="text-xs text-slate-400 font-normal ml-1">
              / {quizzes.length}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
            Server-evaluated
          </div>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm relative overflow-hidden group hover:border-amber-400/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Certificates</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
            {earnedCertificates.length}
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            {earnedCertificates.length > 0 ? (
              <button
                onClick={() => onOpenCertificate(earnedCertificates[0].id)}
                className="text-amber-400 hover:underline font-medium"
              >
                View verified certificate →
              </button>
            ) : (
              'Complete all lessons to unlock'
            )}
          </div>
        </div>
      </section>

      {/* Continue Learning Active Course Card */}
      {primaryCourse && (
        <section className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-md hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono">
                Continue Learning
              </span>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Course Code: {primaryCourse.code}
            </span>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <img
                src={primaryCourse.thumbnail}
                alt={primaryCourse.title}
                className="w-20 h-20 sm:w-28 sm:h-24 rounded-xl object-cover border border-slate-700 flex-shrink-0"
              />
              <div>
                <span className="text-xs font-medium text-slate-400">
                  {primaryCourse.category} • {primaryCourse.level}
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-white mt-0.5">
                  {primaryCourse.title}
                </h3>
                <p className="text-xs text-slate-300 mt-1 flex items-center gap-2">
                  <span className="font-semibold text-amber-400">Current:</span>
                  <span className="truncate max-w-md">{currentLessonTitle}</span>
                </p>

                <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {primaryCourse.totalHours} hours total
                  </span>
                  <span>•</span>
                  <span>{primaryCourse.instructor?.name || 'Faculty Member'}</span>
                </div>
              </div>
            </div>

            <div className="w-full md:w-64 flex flex-col items-end gap-3">
              <div className="w-full text-right">
                <span className="text-xs font-mono text-slate-400">Track Progress: </span>
                <span className="text-sm font-bold font-mono text-amber-400">
                  {primaryProgressPercent}%
                </span>
                <div className="w-full bg-slate-800 h-2 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className="bg-amber-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${primaryProgressPercent}%` }}
                  />
                </div>
              </div>

              <button
                id="continue-course-action-btn"
                onClick={() => startLesson(primaryCourse.id, currentLessonId)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-all shadow-md"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Go to Lesson Player
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Enrolled Courses Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              My Enrolled Courses
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Authoritative state retrieved from user enrollment registry
            </p>
          </div>
          <button
            onClick={() => navigate('/courses')}
            className="text-xs font-semibold text-amber-400 hover:underline flex items-center gap-1"
          >
            All Courses ({courses.length})
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {enrolledCourses.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center">
            <BookOpen className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-200">No courses enrolled yet.</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Browse the course catalog and enroll to begin tracking real database progress.
            </p>
            <button
              onClick={() => navigate('/courses')}
              className="mt-4 px-4 py-2 rounded-lg bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300"
            >
              Browse Catalog
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {enrolledCourses.map((course) => {
              const pct = getCourseProgressPercentage(course.id);
              const progressObj = courseProgress[course.id];
              const completedCount = progressObj?.completedLessonIds?.length || 0;
              const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);

              return (
                <div
                  key={course.id}
                  className="rounded-xl bg-slate-900 border border-slate-800 p-5 flex flex-col justify-between hover:border-slate-700 transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-20 h-20 rounded-lg object-cover border border-slate-700 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                          {course.code}
                        </span>
                        <span className="text-xs text-slate-400">{course.level}</span>
                      </div>
                      <h3 className="text-sm font-bold text-white mt-1 group-hover:text-amber-400 transition-colors line-clamp-1">
                        {course.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                        {course.tagline}
                      </p>

                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-slate-400 font-mono text-[11px]">
                            {completedCount} / {totalLessons} Lessons
                          </span>
                          <span className="font-mono font-bold text-amber-400 text-[11px]">
                            {pct}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-amber-400 h-full rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <div className="text-[11px] text-slate-400">
                      Instructor: <span className="text-slate-300">{course.instructor?.name || 'Faculty'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {progressObj?.certificateIssued && (
                        <button
                          onClick={() => onOpenCertificate(course.id)}
                          className="px-2.5 py-1 rounded bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 text-xs font-semibold border border-amber-400/30 flex items-center gap-1"
                        >
                          <Award className="w-3 h-3" />
                          Certificate
                        </button>
                      )}
                      <button
                        onClick={() => startLesson(course.id)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-amber-400 hover:text-slate-950 text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5"
                      >
                        Launch
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Two-Column Area: Left: Quizzes & Assignments, Right: Announcements & Security */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Quizzes */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">
                  Assessments & Quizzes
                </h3>
              </div>
              <button
                onClick={() => navigate('/quizzes')}
                className="text-xs text-amber-400 hover:underline font-semibold"
              >
                View all ({quizzes.length})
              </button>
            </div>

            {quizzes.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No quizzes or assessments published yet.
              </div>
            ) : (
              <div className="space-y-3">
                {quizzes.map((quiz) => {
                  const latestAttempt = quizAttempts.find((a) => a.quizId === quiz.id);
                  return (
                    <div
                      key={quiz.id}
                      className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-700 transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-100">{quiz.title}</h4>
                          {latestAttempt && (
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                                latestAttempt.passed
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              }`}
                            >
                              {latestAttempt.passed ? 'PASSED' : 'RETRY NEEDED'} ({latestAttempt.percentage}%)
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-1">{quiz.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                          <span className="flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {quiz.timeLimitMinutes} mins
                          </span>
                          <span>•</span>
                          <span>{quiz.questions?.length || 0} Questions</span>
                          <span>•</span>
                          <span>Passing: {quiz.passingScorePercent}%</span>
                        </div>
                      </div>

                      <button
                        id={`start-quiz-${quiz.id}-btn`}
                        onClick={() => onOpenQuiz(quiz.id)}
                        className="px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 flex-shrink-0 transition-colors"
                      >
                        {latestAttempt ? 'Retake Quiz' : 'Start Assessment'}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active Assignments */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Active Assignments</h3>
              </div>
              <button
                onClick={() => navigate('/assignments')}
                className="text-xs text-amber-400 hover:underline font-semibold"
              >
                View assignments ({assignments.length})
              </button>
            </div>

            {assignments.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No assignments active in your enrolled courses.
              </div>
            ) : (
              <div className="space-y-3">
                {assignments.map((assignment) => {
                  const submission = submissions[assignment.id];
                  return (
                    <div
                      key={assignment.id}
                      className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-700 transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-100">{assignment.title}</h4>
                          {submission && (
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                                submission.status === 'graded'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                              }`}
                            >
                              {submission.status.toUpperCase()}
                              {submission.grade !== undefined && ` (${submission.grade}/100)`}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                          {assignment.description}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                          <span className="flex items-center gap-1 font-mono text-amber-400">
                            <Calendar className="w-3 h-3" />
                            Due: {assignment.dueDate || 'Open'}
                          </span>
                          <span>•</span>
                          <span>{assignment.points} Points</span>
                        </div>
                      </div>

                      <button
                        onClick={() => navigate('/assignments')}
                        className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 flex-shrink-0 border border-slate-700"
                      >
                        {submission ? 'View Submission' : 'Submit Work'}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Announcements & Architecture */}
        <div className="space-y-6">
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">Announcements</h3>
              <span className="text-[10px] uppercase font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-800">
                Official
              </span>
            </div>

            {announcements.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No announcements published yet.
              </div>
            ) : (
              <div className="space-y-4">
                {announcements.map((ann) => (
                  <div key={ann.id} className="pb-4 border-b border-slate-800/80 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-400/10 text-amber-400 border border-amber-400/20 font-semibold">
                        {ann.badge || 'Update'}
                      </span>
                      <span className="text-[11px] text-slate-400">{ann.date}</span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-200 mt-2 leading-snug">
                      {ann.title}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {ann.content}
                    </p>

                    <div className="flex items-center gap-2 mt-2 pt-1 text-[11px] text-slate-400">
                      <img
                        src={ann.authorAvatar}
                        alt={ann.author}
                        className="w-4 h-4 rounded-full object-cover"
                      />
                      <span>{ann.author}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-amber-500/20 p-5">
            <div className="flex items-center gap-2 text-amber-400 mb-2">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider font-mono">
                LTI DevSecOps Audit
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Every course module completion, and assessment submission is validated against server-side authorization matrices to eliminate mock vulnerabilities.
            </p>
            <button
              onClick={() => navigate('/architecture')}
              className="mt-3 text-xs text-amber-400 hover:underline font-semibold flex items-center gap-1"
            >
              Inspect Architecture Specification PDF →
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
