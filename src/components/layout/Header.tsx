import React, { useState } from 'react';
import { useLMS } from '../../context/LMSContext';
import { LTILogo } from '../common/LTILogo';
import {
  BookOpen,
  LayoutDashboard,
  GraduationCap,
  ClipboardCheck,
  FileText,
  Shield,
  Sun,
  Moon,
  Bell,
  Search,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  UserCheck,
  Keyboard,
  Eye,
  LogOut,
  User as UserIcon,
  Award,
  KeyRound,
} from 'lucide-react';

interface HeaderProps {
  onOpenAccessibilityModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAccessibilityModal }) => {
  const {
    currentUser,
    logout,
    darkMode,
    toggleDarkMode,
    currentView,
    navigate,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    searchQuery,
    setSearchQuery,
    enrolledCourseIds,
    startLesson,
  } = useLMS();

  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleNav = (path: string) => {
    if (path === '/learn') {
      if (enrolledCourseIds.length > 0) {
        startLesson(enrolledCourseIds[0]);
      } else {
        navigate('/courses');
      }
    } else {
      navigate(path);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md text-slate-100 transition-colors dark:border-slate-800 dark:bg-slate-950/95 light:border-slate-200 light:bg-white/95 light:text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & Monogram Logo */}
        <div className="flex items-center gap-6">
          <button
            id="header-brand-logo-btn"
            onClick={() => handleNav(currentUser ? '/dashboard' : '/courses')}
            className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-amber-400 rounded-lg p-1"
            aria-label="Go to LTI Tech LMS Home"
          >
            <LTILogo size="sm" showTagline={false} />
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-wider text-amber-400 group-hover:text-amber-300 transition-colors">
                  LTI<span className="text-white font-medium">TECH</span>
                </span>
                <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono font-semibold">
                  LMS
                </span>
              </div>
              <p className="text-[9px] uppercase tracking-widest text-slate-400 font-mono hidden sm:block">
                LEARN • THINK • INOVATE
              </p>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            <button
              id="nav-dashboard-btn"
              onClick={() => handleNav('/dashboard')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                currentView === 'dashboard'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Dashboard
            </button>

            <button
              id="nav-courses-btn"
              onClick={() => handleNav('/courses')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                currentView === 'courses' || currentView === 'course-detail'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Browse Courses
            </button>

            <button
              id="nav-learn-btn"
              onClick={() => handleNav('/learn')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                currentView === 'learn'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              Learning Player
            </button>

            <button
              id="nav-assessments-btn"
              onClick={() => handleNav('/quizzes')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                currentView === 'quizzes'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              Assessments
            </button>

            <button
              id="nav-assignments-btn"
              onClick={() => handleNav('/assignments')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                currentView === 'assignments'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Assignments
            </button>

            <button
              id="nav-architecture-btn"
              onClick={() => handleNav('/architecture')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                currentView === 'architecture'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
              title="View production architecture specifications from PDF"
            >
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              Architecture Spec
            </button>

            {/* Role-Specific Consoles - Only shown to authenticated staff */}
            {currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN') && (
              <button
                id="nav-admin-portal-btn"
                onClick={() => handleNav('/admin/portal')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  currentView === 'admin-portal'
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    : 'text-amber-300 hover:text-amber-200 hover:bg-amber-500/10'
                }`}
                title="Open Administrative Security & Operations Portal"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                Admin Console
              </button>
            )}

            {currentUser && currentUser.role === 'INSTRUCTOR' && (
              <button
                id="nav-instructor-portal-btn"
                onClick={() => handleNav('/instructor/portal')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  currentView === 'instructor-portal'
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
                title="Open Instructor Teaching Portal"
              >
                <Award className="w-3.5 h-3.5 text-amber-400" />
                Faculty Portal
              </button>
            )}
          </nav>
        </div>

        {/* Global Search & Action Controls */}
        <div className="flex items-center gap-3">
          {/* Quick Course Filter Search */}
          <div className="relative hidden md:block w-48 lg:w-60">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <input
              id="header-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (currentView !== 'courses') navigate('/courses');
              }}
              placeholder="Search syllabus, topics..."
              className="w-full bg-slate-900/80 border border-slate-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
            />
          </div>

          {/* Accessibility Shortcuts Button */}
          <button
            id="header-accessibility-btn"
            onClick={onOpenAccessibilityModal}
            className="p-2 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800/60 transition-colors focus:ring-2 focus:ring-amber-400"
            title="Accessibility & Keyboard Shortcuts (WCAG AA)"
            aria-label="Open accessibility options"
          >
            <Keyboard className="w-4 h-4" />
          </button>

          {/* Dark / Light Mode Toggle */}
          <button
            id="header-theme-toggle-btn"
            onClick={toggleDarkMode}
            className="p-2 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800/60 transition-colors focus:ring-2 focus:ring-amber-400"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme mode"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              id="header-notifications-btn"
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              className="relative p-2 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800/60 transition-colors focus:ring-2 focus:ring-amber-400"
              aria-label="View notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px] flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifMenu && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Notifications
                    </span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-400/20 text-amber-400 font-semibold">
                        {unreadCount} unread
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      id="notif-mark-all-read-btn"
                      onClick={() => markAllNotificationsRead()}
                      className="text-[11px] text-amber-400 hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="divide-y divide-slate-800/60 max-h-72 overflow-y-auto mt-2">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                      No notifications yet.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markNotificationRead(n.id)}
                        className={`p-2.5 rounded-lg cursor-pointer transition-colors ${
                          n.read ? 'opacity-70 hover:bg-slate-800/40' : 'bg-amber-500/5 hover:bg-amber-500/10'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                            <span className="text-xs font-semibold text-slate-200">{n.title}</span>
                          </div>
                          <span className="text-[10px] text-slate-400">{n.timestamp}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile or Separate Login Portals */}
          {currentUser ? (
            <div className="relative">
              <button
                id="header-user-profile-btn"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-400/50 transition-colors focus:ring-2 focus:ring-amber-400"
                aria-label="User profile menu"
              >
                <img
                  src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                  alt={currentUser.name}
                  className="w-7 h-7 rounded-full object-cover border border-amber-400/50"
                />
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold leading-none text-slate-200 flex items-center gap-1">
                    {currentUser.name.split(' ')[0]}
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </div>
                  <div className="text-[10px] font-mono text-amber-400 font-medium">
                    {currentUser.role}
                  </div>
                </div>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-3 z-50">
                  <div className="p-2 border-b border-slate-800 mb-2">
                    <div className="text-xs font-bold text-slate-200">{currentUser.name}</div>
                    <div className="text-[11px] text-slate-400 truncate">{currentUser.email}</div>
                    <div className="mt-1.5 text-[10px] font-mono text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded inline-block font-semibold">
                      Role: {currentUser.role}
                    </div>
                  </div>

                  <div className="space-y-1 text-xs">
                    {(currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN') && (
                      <button
                        id="user-menu-admin-portal-btn"
                        onClick={() => {
                          navigate('/admin-portal');
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-2.5 py-2 hover:bg-slate-800 rounded-lg flex items-center gap-2 text-amber-300"
                      >
                        <Shield className="w-4 h-4 text-amber-400" />
                        <span>Administrative Console</span>
                      </button>
                    )}

                    {currentUser.role === 'INSTRUCTOR' && (
                      <button
                        id="user-menu-instructor-portal-btn"
                        onClick={() => {
                          navigate('/instructor-portal');
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-2.5 py-2 hover:bg-slate-800 rounded-lg flex items-center gap-2 text-slate-200"
                      >
                        <Award className="w-4 h-4 text-amber-400" />
                        <span>Faculty Console</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        navigate('/dashboard');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-2.5 py-2 hover:bg-slate-800 rounded-lg flex items-center gap-2 text-slate-200"
                    >
                      <LayoutDashboard className="w-4 h-4 text-sky-400" />
                      <span>Learner Dashboard</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }}
                      className="w-full text-left px-2.5 py-2 hover:bg-rose-500/10 hover:text-rose-400 rounded-lg flex items-center gap-2 text-slate-300 border-t border-slate-800 mt-1"
                    >
                      <LogOut className="w-4 h-4 text-rose-400" />
                      <span>End Authenticated Session</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Unauthenticated Navigation: Discreet, No Public Admin Links */
            <div className="flex items-center gap-2">
              <button
                id="header-student-login-link-btn"
                onClick={() => navigate('/student/login')}
                className="px-3.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-md transition-colors"
              >
                Sign In
              </button>

              <button
                id="header-instructor-login-link-btn"
                onClick={() => navigate('/instructor/login')}
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs flex items-center gap-1.5 transition-colors"
                title="Instructor / Faculty Portal"
              >
                <Award className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">Faculty</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation Strip */}
      <div className="lg:hidden flex items-center justify-around border-t border-slate-800/80 px-2 py-1.5 bg-slate-950/80 text-[11px] overflow-x-auto">
        <button
          onClick={() => handleNav('/dashboard')}
          className={`px-2.5 py-1 rounded font-semibold whitespace-nowrap ${
            currentView === 'dashboard' ? 'text-amber-400 bg-amber-400/10' : 'text-slate-400'
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => handleNav('/courses')}
          className={`px-2.5 py-1 rounded font-semibold whitespace-nowrap ${
            currentView === 'courses' ? 'text-amber-400 bg-amber-400/10' : 'text-slate-400'
          }`}
        >
          Courses
        </button>
        <button
          onClick={() => handleNav('/learn')}
          className={`px-2.5 py-1 rounded font-semibold whitespace-nowrap ${
            currentView === 'learn' ? 'text-amber-400 bg-amber-400/10' : 'text-slate-400'
          }`}
        >
          Player
        </button>
        <button
          onClick={() => handleNav('/quizzes')}
          className={`px-2.5 py-1 rounded font-semibold whitespace-nowrap ${
            currentView === 'quizzes' ? 'text-amber-400 bg-amber-400/10' : 'text-slate-400'
          }`}
        >
          Assessments
        </button>
        <button
          onClick={() => handleNav('/assignments')}
          className={`px-2.5 py-1 rounded font-semibold whitespace-nowrap ${
            currentView === 'assignments' ? 'text-amber-400 bg-amber-400/10' : 'text-slate-400'
          }`}
        >
          Assignments
        </button>
        <button
          onClick={() => handleNav('/architecture')}
          className={`px-2.5 py-1 rounded font-semibold whitespace-nowrap ${
            currentView === 'architecture' ? 'text-amber-400 bg-amber-400/10' : 'text-slate-400'
          }`}
        >
          Architecture
        </button>
        {currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN') && (
          <button
            id="mobile-nav-admin-portal-btn"
            onClick={() => handleNav('/admin/portal')}
            className={`px-2.5 py-1 rounded font-semibold whitespace-nowrap ${
              currentView === 'admin-portal'
                ? 'text-amber-400 bg-amber-400/10'
                : 'text-amber-300'
            }`}
          >
            Admin Console
          </button>
        )}
        {currentUser && currentUser.role === 'INSTRUCTOR' && (
          <button
            id="mobile-nav-instructor-portal-btn"
            onClick={() => handleNav('/instructor/portal')}
            className={`px-2.5 py-1 rounded font-semibold whitespace-nowrap ${
              currentView === 'instructor-portal'
                ? 'text-amber-400 bg-amber-400/10'
                : 'text-slate-400'
            }`}
          >
            Faculty
          </button>
        )}
      </div>
    </header>
  );
};
