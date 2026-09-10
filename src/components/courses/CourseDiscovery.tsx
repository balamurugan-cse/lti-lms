import React, { useState } from 'react';
import { useLMS } from '../../context/LMSContext';
import { Course } from '../../types';
import {
  Search,
  Filter,
  Clock,
  Star,
  Users,
  Award,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Play,
  X,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';

export const CourseDiscovery: React.FC = () => {
  const {
    currentUser,
    navigate,
    courses,
    isLoadingCourses,
    enrolledCourseIds,
    enrollInCourse,
    startLesson,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    getCourseProgressPercentage,
  } = useLMS();

  const [selectedLevel, setSelectedLevel] = useState<string>('All');
  const [activeCourseModal, setActiveCourseModal] = useState<Course | null>(null);

  const categories = [
    'All',
    'Full-Stack Architecture',
    'DevSecOps & Cloud',
    'Database Engineering',
    'AI Engineering',
  ];

  const levels = ['All', 'Beginner', 'Intermediate', 'Advanced'];

  // Filter courses
  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'All' || course.category === selectedCategory;

    const matchesLevel =
      selectedLevel === 'All' || course.level === selectedLevel;

    return matchesSearch && matchesCategory && matchesLevel;
  });

  return (
    <div className="space-y-8 pb-16">
      {/* Header & Title */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded border border-amber-400/20">
              Curriculum Catalog
            </span>
            <span className="text-xs text-slate-400">
              {filteredCourses.length} Production-Grade Courses Available
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Course Discovery & Syllabi
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Rigorous engineering curricula developed by industry practitioners, equipped with interactive video players, code walkthroughs, and validated assessments.
          </p>
        </div>

        {/* Level Selector */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl p-1 self-start md:self-auto">
          {levels.map((lvl) => (
            <button
              key={lvl}
              onClick={() => setSelectedLevel(lvl)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedLevel === lvl
                  ? 'bg-amber-400 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Category Pills & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white hover:border-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by keyword, code or topic..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
          />
        </div>
      </div>

      {/* Course Grid */}
      {isLoadingCourses ? (
        <div className="p-16 rounded-2xl bg-slate-900 border border-slate-800 text-center flex flex-col items-center justify-center gap-3">
          <span className="w-5 h-5 rounded-full bg-amber-400 animate-ping" />
          <span className="text-xs font-mono text-slate-400">Loading production catalog from backend...</span>
        </div>
      ) : courses.length === 0 ? (
        <div className="p-12 sm:p-16 rounded-2xl bg-slate-900 border border-slate-800 text-center max-w-xl mx-auto">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white">No courses available yet</h3>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            The LMS database is in a clean production state with zero mock data. Faculty members or curriculum administrators can publish courses via the portal.
          </p>
          {currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN') ? (
            <button
              onClick={() => navigate('/admin-portal')}
              className="mt-6 px-5 py-2.5 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 shadow-md transition-all inline-flex items-center gap-2"
            >
              Open Admin Console to Publish Course
            </button>
          ) : currentUser && currentUser.role === 'INSTRUCTOR' ? (
            <button
              onClick={() => navigate('/instructor-portal')}
              className="mt-6 px-5 py-2.5 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 shadow-md transition-all inline-flex items-center gap-2"
            >
              Open Faculty Portal to Create Course
            </button>
          ) : currentUser && currentUser.role === 'STUDENT' ? (
            <p className="mt-4 text-xs text-slate-400 italic">
              New courses will appear here once published by faculty.
            </p>
          ) : (
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => navigate('/student/login')}
                className="px-4 py-2 rounded-lg bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate('/instructor/login')}
                className="px-4 py-2 rounded-lg bg-slate-900 text-slate-300 font-semibold text-xs border border-slate-800 hover:text-white transition-colors"
              >
                Faculty Sign In
              </button>
            </div>
          )}
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="p-12 rounded-2xl bg-slate-900 border border-slate-800 text-center">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-200">No courses match your criteria</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Try resetting your search query or selecting "All" categories to view available curricula.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
              setSelectedLevel('All');
            }}
            className="mt-4 px-4 py-2 rounded-lg bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {filteredCourses.map((course) => {
            const isEnrolled = enrolledCourseIds.includes(course.id);
            const progress = getCourseProgressPercentage(course.id);
            const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);

            return (
              <div
                key={course.id}
                className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden flex flex-col justify-between hover:border-slate-700 transition-all hover:shadow-xl group"
              >
                <div>
                  {/* Thumbnail & Header Banner */}
                  <div className="relative h-48 overflow-hidden bg-slate-950">
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-85"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />

                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-md bg-slate-950/90 text-amber-400 font-mono text-xs font-bold border border-amber-400/30 backdrop-blur-sm">
                        {course.code}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-900/90 text-slate-300 text-[11px] font-medium backdrop-blur-sm">
                        {course.level}
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs text-slate-200">
                      <span className="flex items-center gap-1 font-semibold">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        {course.totalHours} Hours
                      </span>
                      <span className="flex items-center gap-1 font-semibold">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />
                        {course.rating.toFixed(2)} ({course.enrolledCount} enrolled)
                      </span>
                    </div>
                  </div>

                  {/* Body Details */}
                  <div className="p-6">
                    <span className="text-xs font-semibold text-amber-400/90 uppercase tracking-wider font-mono">
                      {course.category}
                    </span>
                    <h3 className="text-lg font-bold text-white mt-1 group-hover:text-amber-300 transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-xs text-slate-300 mt-2 leading-relaxed line-clamp-2">
                      {course.description}
                    </p>

                    {/* Instructor Info */}
                    <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-800/80">
                      <img
                        src={course.instructor.avatar}
                        alt={course.instructor.name}
                        className="w-8 h-8 rounded-full object-cover border border-amber-400/30"
                      />
                      <div className="text-xs">
                        <div className="font-bold text-slate-200">{course.instructor.name}</div>
                        <div className="text-[11px] text-slate-400">{course.instructor.role}</div>
                      </div>
                    </div>

                    {/* Modules & Key Competencies */}
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {course.skillsLearned.slice(0, 3).map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded text-[11px] bg-slate-800/80 text-slate-300 border border-slate-700/60"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 pt-0 flex items-center justify-between gap-3">
                  <button
                    onClick={() => setActiveCourseModal(course)}
                    className="text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1 py-2 px-3 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <Layers className="w-3.5 h-3.5 text-amber-400" />
                    Syllabus ({course.modules.length} Modules)
                  </button>

                  {isEnrolled ? (
                    <button
                      onClick={() => startLesson(course.id)}
                      className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Continue ({progress}%)
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        enrollInCourse(course.id);
                        startLesson(course.id);
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-amber-400 hover:text-slate-950 text-slate-100 font-bold text-xs flex items-center gap-1.5 transition-all border border-slate-700"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Enroll in Track
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Syllabus Modal / Drawer */}
      {activeCourseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 sm:p-8">
            <button
              onClick={() => setActiveCourseModal(null)}
              className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Close syllabus modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded font-mono text-xs bg-amber-400/10 text-amber-400 border border-amber-400/20 font-bold">
                {activeCourseModal.code}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {activeCourseModal.level} • {activeCourseModal.totalHours} Hours
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-white">
              {activeCourseModal.title}
            </h2>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              {activeCourseModal.description}
            </p>

            {/* Prerequisites */}
            <div className="mt-4 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block mb-1">
                Prerequisites & Knowledge Base:
              </span>
              <ul className="text-xs text-slate-300 list-disc list-inside space-y-1">
                {activeCourseModal.prerequisites.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>

            {/* Modules and Detailed Lessons */}
            <div className="mt-6 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Curriculum Breakdown
              </h3>

              {activeCourseModal.modules.map((mod, modIdx) => (
                <div
                  key={mod.id}
                  className="p-4 rounded-xl bg-slate-950/50 border border-slate-800"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h4 className="text-sm font-bold text-amber-400">
                      {mod.title}
                    </h4>
                    <span className="text-xs text-slate-400 font-mono">
                      {mod.lessons.length} Lessons
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-3">{mod.description}</p>

                  <div className="space-y-2">
                    {mod.lessons.map((lesson) => (
                      <div
                        key={lesson.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-slate-800/80 text-xs text-slate-300"
                      >
                        <div className="flex items-center gap-2">
                          <Play className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                          <span>{lesson.title}</span>
                        </div>
                        <span className="text-slate-400 font-mono text-[11px]">
                          {lesson.durationMinutes} min
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Action Bottom */}
            <div className="mt-8 pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                onClick={() => setActiveCourseModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Close
              </button>

              <button
                onClick={() => {
                  enrollInCourse(activeCourseModal.id);
                  startLesson(activeCourseModal.id);
                  setActiveCourseModal(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg"
              >
                <Play className="w-4 h-4 fill-current" />
                {enrolledCourseIds.includes(activeCourseModal.id)
                  ? 'Resume Course'
                  : 'Enroll and Start Learning'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
