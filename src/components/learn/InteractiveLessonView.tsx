import React, { useState, useEffect, useRef } from 'react';
import { useLMS } from '../../context/LMSContext';
import { Lesson, CourseModule, Quiz } from '../../types';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  CheckCircle2,
  Circle,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  FileCode,
  Image,
  Clock,
  MessageSquare,
  Bookmark,
  Share2,
  ThumbsUp,
  Send,
  Trash2,
  ShieldCheck,
  Award,
  BookOpen,
  Sparkles,
  Layers,
  ChevronDown,
} from 'lucide-react';

interface InteractiveLessonViewProps {
  onOpenQuiz: (quizId: string) => void;
  onOpenCertificate: (courseId: string) => void;
}

export const InteractiveLessonView: React.FC<InteractiveLessonViewProps> = ({
  onOpenQuiz,
  onOpenCertificate,
}) => {
  const {
    courses,
    selectedCourseId,
    setSelectedCourseId,
    selectedLessonId,
    setSelectedLessonId,
    markLessonComplete,
    isLessonCompleted,
    getCourseProgressPercentage,
    courseProgress,
    notes,
    addNote,
    deleteNote,
    discussions,
    addDiscussionMessage,
    navigate,
    quizzes,
  } = useLMS();

  // Find course and active lesson
  const course =
    courses.find((c) => c.id === selectedCourseId) || courses[0];

  if (!course) {
    return (
      <div className="py-20 text-center max-w-xl mx-auto space-y-4">
        <BookOpen className="w-12 h-12 text-slate-600 mx-auto" />
        <h2 className="text-xl font-extrabold text-white">No active course selected</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          The LMS catalog is currently empty or you haven't selected a course to begin learning yet.
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

  // Flatten lessons to easily calculate prev/next
  const allLessons: { lesson: Lesson; module: CourseModule }[] = [];
  (course.modules || []).forEach((mod) => {
    (mod.lessons || []).forEach((l) => allLessons.push({ lesson: l, module: mod }));
  });

  const activeIndex = allLessons.findIndex((item) => item.lesson.id === selectedLessonId);
  const currentItem = allLessons[activeIndex >= 0 ? activeIndex : 0];
  const activeLesson = currentItem?.lesson;
  const activeModule = currentItem?.module;

  if (allLessons.length === 0 || !activeLesson) {
    return (
      <div className="py-20 text-center max-w-xl mx-auto space-y-4">
        <BookOpen className="w-12 h-12 text-slate-600 mx-auto" />
        <h2 className="text-xl font-extrabold text-white">No lessons in this course yet</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          The instructor has not added lesson content to this syllabus yet.
        </p>
        <button
          onClick={() => navigate('/courses')}
          className="px-5 py-2.5 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 transition-all shadow-md"
        >
          Back to Course Catalog
        </button>
      </div>
    );
  }

  const prevLesson = activeIndex > 0 ? allLessons[activeIndex - 1].lesson : null;
  const nextLesson = activeIndex < allLessons.length - 1 ? allLessons[activeIndex + 1].lesson : null;

  const isCompleted = isLessonCompleted(course.id, activeLesson?.id || '');
  const coursePercent = getCourseProgressPercentage(course.id);

  // Video player interactive simulation state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTimeSec, setCurrentTimeSec] = useState<number>(0);
  const durationSec = (activeLesson?.durationMinutes || 20) * 60;
  const [volume, setVolume] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  // Tabs: 'overview' | 'notes' | 'resources' | 'discussion'
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'resources' | 'discussion'>('overview');

  // Sidebar collapsible state
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  // Notes state
  const [newNoteText, setNewNoteText] = useState<string>('');

  // Discussion question input
  const [newQuestionText, setNewQuestionText] = useState<string>('');

  // Video progress timer simulation
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTimeSec((prev) => {
          if (prev >= durationSec) {
            setIsPlaying(false);
            // auto-complete on reaching end
            markLessonComplete(course.id, activeLesson.id);
            return durationSec;
          }
          return prev + 1 * playbackRate;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, durationSec, playbackRate, course.id, activeLesson?.id, markLessonComplete]);

  // Reset video time when switching lessons
  useEffect(() => {
    setCurrentTimeSec(0);
    setIsPlaying(false);
  }, [selectedLessonId]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    addNote(course.id, activeLesson.id, newNoteText.trim(), Math.floor(currentTimeSec));
    setNewNoteText('');
  };

  const handlePostQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim()) return;
    addDiscussionMessage(course.id, newQuestionText.trim(), activeLesson.id);
    setNewQuestionText('');
  };

  const lessonNotes = notes.filter(
    (n) => n.courseId === course.id && n.lessonId === activeLesson?.id
  );

  const courseDiscussions = discussions.filter(
    (d) => d.courseId === course.id
  );

  // Check if current module has a quiz
  const moduleQuiz = quizzes.find((q) => q.id === activeModule?.quizId);

  return (
    <div className="flex flex-col h-full space-y-4 pb-12">
      {/* Top Breadcrumb & Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-amber-400 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Dashboard
          </button>
          <span className="text-slate-600">/</span>
          <span className="text-xs font-bold text-slate-200 truncate max-w-xs sm:max-w-md">
            {course.title}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400">Course Completion:</span>
            <span className="text-xs font-mono font-bold text-amber-400">
              {coursePercent}%
            </span>
            <div className="w-24 bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-amber-400 h-full rounded-full transition-all"
                style={{ width: `${coursePercent}%` }}
              />
            </div>
          </div>

          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium flex items-center gap-1.5 transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            {isSidebarOpen ? 'Hide Curriculum' : 'Show Curriculum'}
          </button>
        </div>
      </div>

      {/* Main 2-Column Area: Video Player/Tabs + Curriculum Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left / Center: Interactive Video Player & Lecture Materials (8 cols or 12 if sidebar collapsed) */}
        <div className={isSidebarOpen ? 'lg:col-span-8 space-y-6' : 'lg:col-span-12 space-y-6'}>
          {/* Interactive Player Container */}
          <div
            ref={playerContainerRef}
            className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl group select-none"
          >
            {/* Screen Area / Interactive Visualizer */}
            <div className="relative aspect-video w-full flex items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
              {/* Dynamic Animated Wave & Architectural Blueprint Visualizer */}
              <div className="absolute inset-0 opacity-15 flex items-center justify-center">
                <div className="w-[120%] h-[120%] border border-amber-500/30 rounded-full animate-spin duration-[60s]" />
                <div className="absolute w-[80%] h-[80%] border border-dashed border-amber-400/20 rounded-full animate-spin duration-[40s]" />
              </div>

              {/* Lecture Slide Canvas / Video Simulation */}
              <div className="relative z-10 text-center max-w-lg p-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-amber-500/30 text-amber-400 text-xs font-mono mb-4 shadow-lg">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Production Lecture Stream • S3 Signed URL Verified</span>
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-md">
                  {activeLesson?.title}
                </h2>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed max-w-md mx-auto line-clamp-2">
                  {activeLesson?.summary}
                </p>

                {/* Simulated Audio Frequency Visualizer */}
                <div className="flex items-center justify-center gap-1 mt-6 h-8">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-1 rounded-full bg-amber-400 transition-all duration-300 ${
                        isPlaying ? 'animate-pulse' : 'opacity-30'
                      }`}
                      style={{
                        height: isPlaying
                          ? `${Math.max(12, Math.sin((currentTimeSec + i) * 0.8) * 32)}px`
                          : '8px',
                        animationDelay: `${i * 50}ms`,
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Big Center Play/Pause Overlay Button */}
              <button
                id="video-center-play-btn"
                onClick={() => setIsPlaying(!isPlaying)}
                className={`absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/30 transition-all ${
                  isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
                }`}
                aria-label={isPlaying ? 'Pause video' : 'Play video'}
              >
                <div className="w-16 h-16 rounded-full bg-amber-400/90 hover:bg-amber-300 text-slate-950 flex items-center justify-center shadow-2xl transform group-hover:scale-105 transition-transform">
                  {isPlaying ? (
                    <Pause className="w-8 h-8 fill-current" />
                  ) : (
                    <Play className="w-8 h-8 fill-current ml-1" />
                  )}
                </div>
              </button>
            </div>

            {/* Video Player Scrub Bar & Controls Strip */}
            <div className="p-4 bg-slate-950 border-t border-slate-800/80 space-y-3">
              {/* Progress Scrubbing Bar */}
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono text-slate-400 w-12 text-right">
                  {formatTime(currentTimeSec)}
                </span>
                <div className="relative flex-1 group/bar py-1">
                  <input
                    type="range"
                    min={0}
                    max={durationSec}
                    value={currentTimeSec}
                    onChange={(e) => setCurrentTimeSec(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400 focus:outline-none"
                  />
                </div>
                <span className="text-[11px] font-mono text-slate-400 w-12">
                  {formatTime(durationSec)}
                </span>
              </div>

              {/* Controls: Left (Play, Rewind, Volume), Right (Speed, Timestamps, Fullscreen) */}
              <div className="flex items-center justify-between text-slate-300">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-1.5 rounded-lg hover:text-amber-400 hover:bg-slate-900 transition-colors"
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                  </button>

                  <button
                    onClick={() => setCurrentTimeSec((prev) => Math.max(0, prev - 10))}
                    className="p-1.5 rounded-lg hover:text-amber-400 hover:bg-slate-900 transition-colors"
                    title="Rewind 10s"
                    aria-label="Rewind 10 seconds"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  {/* Volume Slider */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className="p-1.5 rounded-lg hover:text-amber-400 transition-colors"
                      aria-label="Toggle mute"
                    >
                      {isMuted || volume === 0 ? (
                        <VolumeX className="w-4 h-4 text-rose-400" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={isMuted ? 0 : volume}
                      onChange={(e) => {
                        setVolume(Number(e.target.value));
                        setIsMuted(false);
                      }}
                      className="w-16 h-1 bg-slate-800 rounded appearance-none accent-amber-400 cursor-pointer hidden sm:block"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Playback Speed Selector */}
                  <div className="flex items-center gap-1 bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-[11px] font-mono">
                    {[0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => setPlaybackRate(rate)}
                        className={`px-1.5 py-0.5 rounded ${
                          playbackRate === rate
                            ? 'bg-amber-400 text-slate-950 font-bold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>

                  {/* Fullscreen Button */}
                  <button
                    onClick={toggleFullscreen}
                    className="p-1.5 rounded-lg hover:text-amber-400 hover:bg-slate-900 transition-colors"
                    title="Toggle Fullscreen"
                    aria-label="Toggle Fullscreen"
                  >
                    {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Clickable Key Timestamps */}
              {activeLesson?.keyTimestamps && activeLesson.keyTimestamps.length > 0 && (
                <div className="pt-2 border-t border-slate-900 flex items-center gap-2 overflow-x-auto text-[11px]">
                  <span className="text-slate-400 font-mono text-[10px] uppercase">Chapters:</span>
                  {activeLesson.keyTimestamps.map((ts, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setCurrentTimeSec(ts.timeSec);
                        setIsPlaying(true);
                      }}
                      className="px-2 py-0.5 rounded bg-slate-900 hover:bg-amber-400/20 text-slate-300 hover:text-amber-400 border border-slate-800 text-xs whitespace-nowrap transition-colors"
                    >
                      <span className="font-mono text-amber-400 mr-1">{formatTime(ts.timeSec)}</span>
                      {ts.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Lesson Action Controls: Prev, Complete, Next */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
            <button
              disabled={!prevLesson}
              onClick={() => prevLesson && setSelectedLessonId(prevLesson.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                prevLesson
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  : 'opacity-40 cursor-not-allowed bg-slate-900 text-slate-600'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous Lesson
            </button>

            {/* Authoritative Mark Complete Button */}
            <button
              id="mark-lesson-complete-btn"
              onClick={() => markLessonComplete(course.id, activeLesson.id)}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
                isCompleted
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-amber-400 hover:bg-amber-300 text-slate-950 hover:shadow-[0_0_20px_rgba(250,204,21,0.3)]'
              }`}
            >
              {isCompleted ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Completed (Recorded in DB)
                </>
              ) : (
                <>
                  <Circle className="w-4 h-4" />
                  Mark Lesson Complete
                </>
              )}
            </button>

            <button
              disabled={!nextLesson}
              onClick={() => nextLesson && setSelectedLessonId(nextLesson.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                nextLesson
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  : 'opacity-40 cursor-not-allowed bg-slate-900 text-slate-600'
              }`}
            >
              Next Lesson
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Tab Navigation: Overview, Notes, Resources, Q&A */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
              {[
                { id: 'overview', label: 'Overview & Transcript', icon: FileText },
                { id: 'notes', label: `My Notes (${lessonNotes.length})`, icon: Bookmark },
                { id: 'resources', label: `Resources (${activeLesson?.resources?.length || 0})`, icon: Download },
                { id: 'discussion', label: `Q&A Forum (${courseDiscussions.length})`, icon: MessageSquare },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                      activeTab === tab.id
                        ? 'bg-amber-400/15 text-amber-400 border border-amber-400/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab 1: Overview & Notes */}
            {activeTab === 'overview' && (
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 text-xs text-slate-300 leading-relaxed">
                <h3 className="text-base font-bold text-white">Lesson Summary</h3>
                <p>{activeLesson?.summary}</p>

                {activeLesson?.contentMarkdown && (
                  <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs overflow-x-auto text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {activeLesson.contentMarkdown}
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Interactive Notes */}
            {activeTab === 'notes' && (
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
                <div>
                  <h3 className="text-base font-bold text-white mb-1">
                    Timestamped Learning Notes
                  </h3>
                  <p className="text-xs text-slate-400">
                    Capture notes pinned to specific timestamps in the lecture. All notes are saved to your account.
                  </p>
                </div>

                <form onSubmit={handleAddNote} className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span>Active Video Timestamp:</span>
                    <span className="text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded">
                      {formatTime(currentTimeSec)}
                    </span>
                  </div>
                  <textarea
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder="Type key takeaway, architectural insight, or reminder..."
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-amber-400"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={!newNoteText.trim()}
                      className="px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs disabled:opacity-50 transition-colors"
                    >
                      Save Timestamped Note
                    </button>
                  </div>
                </form>

                <div className="space-y-3 pt-4 border-t border-slate-800">
                  {lessonNotes.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">
                      No notes taken for this lesson yet.
                    </p>
                  ) : (
                    lessonNotes.map((note) => (
                      <div
                        key={note.id}
                        className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/90 flex items-start justify-between gap-3 group"
                      >
                        <div>
                          <button
                            onClick={() => {
                              setCurrentTimeSec(note.timestampSec);
                              setIsPlaying(true);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-400/10 text-amber-400 font-mono text-[10px] font-bold hover:underline mb-1"
                          >
                            <Clock className="w-3 h-3" />
                            {formatTime(note.timestampSec)}
                          </button>
                          <p className="text-xs text-slate-300">{note.text}</p>
                        </div>

                        <button
                          onClick={() => deleteNote(note.id)}
                          className="text-slate-400 hover:text-rose-400 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Delete note"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Tab 3: Resources & Downloads */}
            {activeTab === 'resources' && (
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <div>
                  <h3 className="text-base font-bold text-white mb-1">
                    Lesson Resources & Starter Assets
                  </h3>
                  <p className="text-xs text-slate-400">
                    Protected course assets authorized via pre-signed URLs.
                  </p>
                </div>

                {!activeLesson?.resources || activeLesson.resources.length === 0 ? (
                  <p className="text-xs text-slate-400">No supplementary downloads for this lesson.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeLesson.resources.map((res) => (
                      <div
                        key={res.id}
                        className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-amber-400/10 text-amber-400">
                            {res.type === 'pdf' && <FileText className="w-4 h-4" />}
                            {res.type === 'code' && <FileCode className="w-4 h-4" />}
                            {res.type === 'diagram' && <Image className="w-4 h-4" />}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-200">{res.title}</h4>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {res.size || '1.2 MB'} • Verified
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => alert(`Simulating download for signed S3 asset: ${res.title}`)}
                          className="p-2 rounded-lg bg-slate-800 hover:bg-amber-400 hover:text-slate-950 text-slate-300 text-xs transition-colors"
                          title="Download Resource"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 4: Q&A Community Discussion */}
            {activeTab === 'discussion' && (
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
                <div>
                  <h3 className="text-base font-bold text-white mb-1">
                    Course Q&A & Architecture Discussion
                  </h3>
                  <p className="text-xs text-slate-400">
                    Engage with faculty and fellow engineers on distributed patterns and edge cases.
                  </p>
                </div>

                <form onSubmit={handlePostQuestion} className="space-y-3">
                  <textarea
                    value={newQuestionText}
                    onChange={(e) => setNewQuestionText(e.target.value)}
                    placeholder="Ask a technical question regarding this lesson or architecture..."
                    rows={2}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-amber-400"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={!newQuestionText.trim()}
                      className="px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs disabled:opacity-50 transition-colors flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Post Question
                    </button>
                  </div>
                </form>

                <div className="space-y-4 pt-4 border-t border-slate-800">
                  {courseDiscussions.map((msg) => (
                    <div
                      key={msg.id}
                      className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={msg.userAvatar}
                            alt={msg.userName}
                            className="w-6 h-6 rounded-full object-cover border border-amber-400/30"
                          />
                          <div>
                            <span className="text-xs font-bold text-slate-200 mr-2">
                              {msg.userName}
                            </span>
                            <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-slate-800 text-amber-400">
                              {msg.userRole}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">{msg.message}</p>

                      {/* Instructor Replies */}
                      {msg.replies && msg.replies.length > 0 && (
                        <div className="mt-3 pl-4 border-l-2 border-amber-400/40 space-y-2">
                          {msg.replies.map((reply) => (
                            <div key={reply.id} className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold text-amber-400">
                                  {reply.userName}
                                </span>
                                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-mono font-bold">
                                  FACULTY
                                </span>
                              </div>
                              <p className="text-xs text-slate-300 leading-relaxed">
                                {reply.message}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Collapsible Curriculum Sidebar (4 cols) */}
        {isSidebarOpen && (
          <aside className="lg:col-span-4 rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-5 sticky top-20 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white">Course Curriculum</h3>
                <span className="text-xs text-slate-400 font-mono">
                  {allLessons.length} Total Lessons
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">
                {coursePercent}% Complete
              </span>
            </div>

            {/* Modules Accordion List */}
            <div className="space-y-4">
              {course.modules.map((mod, modIdx) => {
                const modQuiz = quizzes.find((q) => q.id === mod.quizId);
                return (
                  <div
                    key={mod.id}
                    className="rounded-xl bg-slate-950/60 border border-slate-800/80 overflow-hidden"
                  >
                    <div className="p-3.5 bg-slate-900/90 border-b border-slate-800/80">
                      <div className="text-[10px] font-mono uppercase text-amber-400 font-semibold">
                        Module {modIdx + 1}
                      </div>
                      <h4 className="text-xs font-bold text-slate-200 mt-0.5">
                        {mod.title.replace(/^Module \d+:\s*/, '')}
                      </h4>
                    </div>

                    <div className="divide-y divide-slate-800/60">
                      {mod.lessons.map((les) => {
                        const active = les.id === activeLesson?.id;
                        const completed = isLessonCompleted(course.id, les.id);

                        return (
                          <button
                            key={les.id}
                            onClick={() => setSelectedLessonId(les.id)}
                            className={`w-full text-left p-3 flex items-start justify-between gap-3 transition-colors ${
                              active
                                ? 'bg-amber-400/10 border-l-2 border-amber-400 text-white'
                                : 'hover:bg-slate-900/60 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              {completed ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                              ) : (
                                <Circle className="w-4 h-4 text-slate-600 flex-shrink-0 mt-0.5" />
                              )}
                              <div>
                                <span className={`text-xs ${active ? 'font-bold text-amber-300' : 'font-medium'}`}>
                                  {les.title}
                                </span>
                                <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                                  <span>{les.durationMinutes} min</span>
                                  <span>•</span>
                                  <span className="uppercase">{les.type}</span>
                                </div>
                              </div>
                            </div>

                            {active && (
                              <Play className="w-3 h-3 text-amber-400 fill-current flex-shrink-0 mt-1" />
                            )}
                          </button>
                        );
                      })}

                      {/* Module Assessment Trigger */}
                      {modQuiz && (
                        <div className="p-3 bg-slate-900/40 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-amber-400" />
                            <div>
                              <div className="text-xs font-bold text-slate-200">
                                Module Assessment
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                {modQuiz.questions.length} questions • 75% to pass
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => onOpenQuiz(modQuiz.id)}
                            className="px-2.5 py-1 rounded bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-[11px] transition-colors"
                          >
                            Take Quiz
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Certificate Unlock Banner if completed */}
            {courseProgress[course.id]?.certificateIssued && (
              <div className="p-4 rounded-xl bg-gradient-to-br from-amber-950/40 to-slate-950 border border-amber-400/40 text-center space-y-2">
                <Award className="w-6 h-6 text-amber-400 mx-auto" />
                <h4 className="text-xs font-bold text-white">Track Completed!</h4>
                <p className="text-[11px] text-slate-300">
                  You have earned your verified LTI Tech Certificate of Completion.
                </p>
                <button
                  onClick={() => onOpenCertificate(course.id)}
                  className="w-full py-1.5 rounded-lg bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300"
                >
                  View Certificate
                </button>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
};
