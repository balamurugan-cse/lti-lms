import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  User,
  Role,
  Course,
  Quiz,
  QuizAttempt,
  Assignment,
  AssignmentSubmission,
  CourseProgress,
  NotificationItem,
  AnnouncementItem,
  AuditLogItem,
  StudentNote,
  DiscussionMessage,
} from '../types';
import { api } from '../services/api';

export type AppView =
  | 'dashboard'
  | 'courses'
  | 'course-detail'
  | 'learn'
  | 'quizzes'
  | 'assignments'
  | 'instructor-portal'
  | 'admin-portal'
  | 'certificates'
  | 'architecture'
  | 'student-login'
  | 'student-register'
  | 'instructor-login'
  | 'instructor-register'
  | 'admin-login'
  | 'admin-setup';

interface LMSContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  loginStudent: (email: string, pass: string) => Promise<void>;
  registerStudent: (data: { name: string; email: string; password: string; studentId?: string; gradeLevel?: string }) => Promise<void>;
  loginInstructor: (email: string, pass: string) => Promise<void>;
  registerInstructor: (data: { name: string; email: string; password: string; specialization?: string; department?: string }) => Promise<void>;
  loginAdmin: (email: string, pass: string) => Promise<void>;
  bootstrapAdmin: (data: { name: string; email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  
  // Theme & A11y
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  toggleDarkMode: () => void;
  highContrast: boolean;
  setHighContrast: (val: boolean) => void;

  // Navigation & Routing
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  navigate: (path: string) => void;
  selectedCourseId: string;
  setSelectedCourseId: (id: string) => void;
  selectedLessonId: string;
  setSelectedLessonId: (id: string) => void;

  // Real Database Courses & Syllabus
  courses: Course[];
  isLoadingCourses: boolean;
  refreshCourses: () => Promise<void>;
  createCourse: (data: { code: string; title: string; description: string; level?: string; durationHrs?: number }) => Promise<any>;
  createModule: (courseId: string, data: { title: string; orderIndex?: number }) => Promise<any>;
  createLesson: (moduleId: string, data: { title: string; durationMin?: number; videoUrl?: string; contentMarkdown?: string }) => Promise<any>;

  // Enrollments & Authoritative Progress
  enrolledCourseIds: string[];
  courseProgress: Record<string, CourseProgress>;
  enrollInCourse: (courseId: string) => Promise<void>;
  markLessonComplete: (courseId: string, lessonId: string) => Promise<void>;
  isLessonCompleted: (courseId: string, lessonId: string) => boolean;
  getCourseProgressPercentage: (courseId: string) => number;

  // Quizzes & Assessments
  quizzes: Quiz[];
  activeQuiz: Quiz | null;
  setActiveQuiz: (quiz: Quiz | null) => void;
  quizAttempts: QuizAttempt[];
  recordQuizAttempt: (attempt: Omit<QuizAttempt, 'id' | 'timestamp'>) => QuizAttempt;
  submitQuiz: (quizId: string, answers: Record<string, string>) => Promise<any>;

  // Assignments & Submissions
  assignments: Assignment[];
  submissions: Record<string, AssignmentSubmission>;
  submitAssignment: (assignmentId: string, text: string, fileName?: string) => Promise<void>;
  gradeSubmission: (assignmentId: string, grade: number, feedback: string) => Promise<void>;

  // Notifications & Announcements
  notifications: NotificationItem[];
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  announcements: AnnouncementItem[];

  // Student Notes
  notes: StudentNote[];
  addNote: (courseId: string, lessonId: string, text: string, timestampSec: number) => void;
  deleteNote: (id: string) => void;

  // Discussions
  discussions: DiscussionMessage[];
  addDiscussionMessage: (courseId: string, message: string, lessonId?: string) => void;

  // Audit Logs & Security
  auditLogs: AuditLogItem[];
  addAuditLog: (action: string, details: string, status?: 'SUCCESS' | 'WARNING' | 'DENIED') => void;

  // Search & Filtering
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  startLesson: (courseId: string, lessonId?: string) => void;
}

const LMSContext = createContext<LMSContextType | undefined>(undefined);

function pathToView(path: string): AppView {
  if (path === '/student/login') return 'student-login';
  if (path === '/student/register') return 'student-register';
  if (path === '/instructor/login') return 'instructor-login';
  if (path === '/instructor/register') return 'instructor-register';
  if (path === '/admin/login') return 'admin-login';
  if (path === '/admin/setup') return 'admin-setup';
  if (path === '/courses') return 'courses';
  if (path === '/learn') return 'learn';
  if (path === '/quizzes') return 'quizzes';
  if (path === '/assignments') return 'assignments';
  if (path === '/admin-portal' || path === '/instructor-portal') return 'admin-portal';
  if (path === '/architecture') return 'architecture';
  if (path === '/dashboard') return 'dashboard';
  return 'dashboard';
}

function viewToPath(view: AppView): string {
  switch (view) {
    case 'student-login': return '/student/login';
    case 'student-register': return '/student/register';
    case 'instructor-login': return '/instructor/login';
    case 'instructor-register': return '/instructor/register';
    case 'admin-login': return '/admin/login';
    case 'admin-setup': return '/admin/setup';
    case 'courses': return '/courses';
    case 'course-detail': return '/courses';
    case 'learn': return '/learn';
    case 'quizzes': return '/quizzes';
    case 'assignments': return '/assignments';
    case 'admin-portal':
    case 'instructor-portal': return '/admin-portal';
    case 'architecture': return '/architecture';
    case 'dashboard':
    default: return '/dashboard';
  }
}

export const LMSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('lti_theme');
    return saved !== null ? saved === 'dark' : true;
  });
  const [highContrast, setHighContrast] = useState<boolean>(false);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('lti_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('lti_theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);

  // Navigation State
  const [currentView, setCurrentViewInternal] = useState<AppView>(() => {
    return pathToView(window.location.pathname);
  });

  const navigate = useCallback((path: string) => {
    const nextView = pathToView(path);
    setCurrentViewInternal(nextView);
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
  }, []);

  const setCurrentView = useCallback((view: AppView) => {
    setCurrentViewInternal(view);
    const targetPath = viewToPath(view);
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentViewInternal(pathToView(window.location.pathname));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Course & Curriculum State
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState<boolean>(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedLessonId, setSelectedLessonId] = useState<string>('');

  // Enrollments & Authoritative Progress State
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<string[]>([]);
  const [courseProgress, setCourseProgress] = useState<Record<string, CourseProgress>>({});

  // Assessment & Quizzes State
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);

  // Assignments & Submissions
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, AssignmentSubmission>>({});

  // Notifications & Announcements (empty by default as per zero mock data rule)
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);

  // Student Notes
  const [notes, setNotes] = useState<StudentNote[]>(() => {
    const saved = localStorage.getItem('lti_notes');
    return saved ? JSON.parse(saved) : [];
  });

  // Discussions
  const [discussions, setDiscussions] = useState<DiscussionMessage[]>([]);

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // --- Real API Refresh Functions ---

  const refreshCourses = useCallback(async () => {
    setIsLoadingCourses(true);
    try {
      const res = await api.getCourses();
      const loadedCourses: Course[] = (res.courses || []).map((c: any) => ({
        id: c.id,
        code: c.code,
        title: c.title,
        tagline: c.description,
        description: c.description,
        category: 'Software Engineering',
        level: (c.level || 'Intermediate') as any,
        thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80',
        instructor: {
          id: c.instructorId || 'inst-default',
          name: 'Course Instructor',
          role: 'Faculty Member',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          bio: 'Verified faculty instructor in LTI Tech LMS curriculum.',
        },
        totalHours: c.durationHrs || 12,
        rating: 4.9,
        enrolledCount: c._count?.enrollments || 0,
        modules: (c.modules || []).map((m: any) => ({
          id: m.id,
          title: m.title,
          description: '',
          lessons: (m.lessons || []).map((l: any) => ({
            id: l.id,
            title: l.title,
            durationMinutes: l.durationMin || 15,
            type: 'video',
            videoUrl: l.videoUrl || '',
            summary: l.contentMarkdown || 'Lesson material provided by course faculty.',
            contentMarkdown: l.contentMarkdown || '',
            resources: [],
          })),
        })),
        prerequisites: [],
        skillsLearned: [],
        certificateAvailable: true,
      }));

      setCourses(loadedCourses);
      if (loadedCourses.length > 0 && !selectedCourseId) {
        setSelectedCourseId(loadedCourses[0].id);
        const firstLesson = loadedCourses[0].modules[0]?.lessons[0]?.id;
        if (firstLesson) setSelectedLessonId(firstLesson);
      }
    } catch (err) {
      console.warn('Could not fetch courses from backend:', err);
    } finally {
      setIsLoadingCourses(false);
    }
  }, [selectedCourseId]);

  const refreshEnrollments = useCallback(async () => {
    if (!currentUser) {
      setEnrolledCourseIds([]);
      setCourseProgress({});
      return;
    }
    try {
      const res = await api.getMyEnrollments();
      const enrollments = res.enrollments || [];
      const enrolledIds = enrollments.map((e: any) => e.courseId);
      setEnrolledCourseIds(enrolledIds);

      const progressMap: Record<string, CourseProgress> = {};
      for (const e of enrollments) {
        progressMap[e.courseId] = {
          courseId: e.courseId,
          completedLessonIds: [],
          lastAccessedAt: e.lastAccessedAt || e.enrolledAt,
          completedQuizIds: [],
          certificateIssued: false,
        };
      }
      setCourseProgress(progressMap);
    } catch (err) {
      console.warn('Could not fetch user enrollments:', err);
    }
  }, [currentUser]);

  // Load User & Catalog on Mount
  useEffect(() => {
    let isMounted = true;
    const initApp = async () => {
      setIsLoadingAuth(true);
      try {
        const token = api.getAccessToken();
        if (token) {
          const meRes = await api.getMe();
          if (isMounted && meRes.user) {
            setCurrentUser(meRes.user);
          }
        }
      } catch (err) {
        api.clearTokens();
        if (isMounted) setCurrentUser(null);
      } finally {
        if (isMounted) setIsLoadingAuth(false);
      }

      await refreshCourses();
    };

    initApp();
    return () => {
      isMounted = false;
    };
  }, [refreshCourses]);

  // When currentUser changes, refresh enrollments and audit logs
  useEffect(() => {
    if (currentUser) {
      refreshEnrollments();
      if (currentUser.role === 'ADMIN' || currentUser.role === 'INSTRUCTOR') {
        api.getAdminAuditLogs()
          .then((res) => {
            if (res.auditLogs) {
              setAuditLogs(res.auditLogs.map((l: any) => ({
                id: l.id,
                action: l.action,
                actor: l.user?.email || 'system',
                role: (l.user?.role || 'STUDENT') as Role,
                timestamp: l.createdAt,
                ipAddress: l.ipAddress || '127.0.0.1',
                details: l.details || '',
                status: 'SUCCESS',
              })));
            }
          })
          .catch(() => {});
      }
    } else {
      setEnrolledCourseIds([]);
      setCourseProgress({});
    }
  }, [currentUser, refreshEnrollments]);

  // --- Auth Handlers ---

  const loginStudent = async (email: string, pass: string) => {
    const res = await api.loginStudent(email, pass);
    setCurrentUser(res.user);
    await refreshCourses();
  };

  const registerStudent = async (data: { name: string; email: string; password: string; studentId?: string; gradeLevel?: string }) => {
    const res = await api.registerStudent(data);
    setCurrentUser(res.user);
    await refreshCourses();
  };

  const loginInstructor = async (email: string, pass: string) => {
    const res = await api.loginInstructor(email, pass);
    setCurrentUser(res.user);
    await refreshCourses();
  };

  const registerInstructor = async (data: { name: string; email: string; password: string; specialization?: string; department?: string }) => {
    const res = await api.registerInstructor(data);
    setCurrentUser(res.user);
    await refreshCourses();
  };

  const loginAdmin = async (email: string, pass: string) => {
    const res = await api.loginAdmin(email, pass);
    setCurrentUser(res.user);
    await refreshCourses();
  };

  const bootstrapAdmin = async (data: { name: string; email: string; password: string }) => {
    const res = await api.bootstrapAdmin(data);
    setCurrentUser(res.user);
    await refreshCourses();
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    } finally {
      setCurrentUser(null);
      setEnrolledCourseIds([]);
      setCourseProgress({});
      navigate('/student/login');
    }
  };

  // --- Course Creation Handlers ---

  const createCourse = async (data: { code: string; title: string; description: string; level?: string; durationHrs?: number }) => {
    const res = await api.createCourse(data);
    await refreshCourses();
    return res;
  };

  const createModule = async (courseId: string, data: { title: string; orderIndex?: number }) => {
    const res = await api.createModule(courseId, data);
    await refreshCourses();
    return res;
  };

  const createLesson = async (moduleId: string, data: { title: string; durationMin?: number; videoUrl?: string; contentMarkdown?: string }) => {
    const res = await api.createLesson(moduleId, data);
    await refreshCourses();
    return res;
  };

  // --- Enrollment & Progress Handlers ---

  const enrollInCourse = async (courseId: string) => {
    if (!currentUser) {
      navigate('/student/login');
      return;
    }
    await api.enrollInCourse(courseId);
    await refreshEnrollments();
  };

  const markLessonComplete = async (courseId: string, lessonId: string) => {
    if (!currentUser) return;
    try {
      await api.recordLessonProgress({ lessonId, courseId, isCompleted: true });
      setCourseProgress((prev) => {
        const existing = prev[courseId] || {
          courseId,
          completedLessonIds: [],
          lastAccessedAt: new Date().toISOString(),
          completedQuizIds: [],
          certificateIssued: false,
        };
        const completed = existing.completedLessonIds.includes(lessonId)
          ? existing.completedLessonIds
          : [...existing.completedLessonIds, lessonId];

        const course = courses.find((c) => c.id === courseId);
        const totalLessons = course
          ? course.modules.reduce((sum, m) => sum + m.lessons.length, 0)
          : 1;
        const isFinished = totalLessons > 0 && completed.length >= totalLessons;

        return {
          ...prev,
          [courseId]: {
            ...existing,
            completedLessonIds: completed,
            lastAccessedLessonId: lessonId,
            lastAccessedAt: new Date().toISOString(),
            certificateIssued: isFinished,
            certificateId: isFinished ? `LTI-CERT-${Math.floor(100000 + Math.random() * 900000)}` : undefined,
            issuedDate: isFinished ? new Date().toISOString() : undefined,
          },
        };
      });
    } catch (err) {
      console.error('Failed to record lesson progress:', err);
    }
  };

  const isLessonCompleted = (courseId: string, lessonId: string): boolean => {
    return !!courseProgress[courseId]?.completedLessonIds?.includes(lessonId);
  };

  const getCourseProgressPercentage = (courseId: string): number => {
    const course = courses.find((c) => c.id === courseId);
    if (!course) return 0;
    const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
    if (totalLessons === 0) return 0;
    const completedCount = courseProgress[courseId]?.completedLessonIds?.length || 0;
    return Math.min(100, Math.round((completedCount / totalLessons) * 100));
  };

  // --- Quizzes Handlers ---

  const recordQuizAttempt = (attempt: Omit<QuizAttempt, 'id' | 'timestamp'>): QuizAttempt => {
    const newAttempt: QuizAttempt = {
      ...attempt,
      id: `attempt-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    setQuizAttempts((prev) => [newAttempt, ...prev]);
    return newAttempt;
  };

  const submitQuiz = async (quizId: string, answers: Record<string, string>) => {
    const res = await api.submitQuiz(quizId, answers);
    if (res.attempt) {
      setQuizAttempts((prev) => [res.attempt, ...prev]);
    }
    return res;
  };

  // --- Assignments Handlers ---

  const submitAssignment = async (assignmentId: string, text: string, fileName?: string) => {
    if (!currentUser) return;
    await api.submitAssignment(assignmentId, { submissionText: text, fileName });
    setSubmissions((prev) => ({
      ...prev,
      [assignmentId]: {
        id: `sub-${Date.now()}`,
        assignmentId,
        userId: currentUser.id,
        submissionText: text,
        attachedFileName: fileName,
        submittedAt: new Date().toISOString(),
        status: 'submitted',
      },
    }));
  };

  const gradeSubmission = async (assignmentId: string, grade: number, feedback: string) => {
    await api.gradeSubmission(assignmentId, { grade, feedback });
    setSubmissions((prev) => {
      const existing = prev[assignmentId];
      if (!existing) return prev;
      return {
        ...prev,
        [assignmentId]: {
          ...existing,
          status: 'graded',
          grade,
          feedback,
          gradedBy: currentUser?.name || 'Instructor',
          gradedAt: new Date().toISOString(),
        },
      };
    });
  };

  // --- Notifications & Announcements ---

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // --- Student Notes ---

  const addNote = (courseId: string, lessonId: string, text: string, timestampSec: number) => {
    const newNote: StudentNote = {
      id: `note-${Date.now()}`,
      courseId,
      lessonId,
      timestampSec,
      text,
      createdAt: new Date().toISOString(),
    };
    const updated = [newNote, ...notes];
    setNotes(updated);
    localStorage.setItem('lti_notes', JSON.stringify(updated));
  };

  const deleteNote = (id: string) => {
    const updated = notes.filter((n) => n.id !== id);
    setNotes(updated);
    localStorage.setItem('lti_notes', JSON.stringify(updated));
  };

  // --- Discussions ---

  const addDiscussionMessage = (courseId: string, message: string, lessonId?: string) => {
    if (!currentUser) return;
    const newMsg: DiscussionMessage = {
      id: `disc-${Date.now()}`,
      courseId,
      lessonId,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      userAvatar: currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      message,
      timestamp: 'Just now',
      upvotes: 0,
    };
    setDiscussions((prev) => [newMsg, ...prev]);
  };

  // --- Audit Logs ---

  const addAuditLog = (
    action: string,
    details: string,
    status: 'SUCCESS' | 'WARNING' | 'DENIED' = 'SUCCESS'
  ) => {
    const newLog: AuditLogItem = {
      id: `log-${Date.now()}`,
      action,
      actor: currentUser?.email || 'Anonymous Client',
      role: (currentUser?.role || 'STUDENT') as Role,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
      ipAddress: '127.0.0.1',
      details,
      status,
    };
    setAuditLogs((prev) => [newLog, ...prev.slice(0, 49)]);
  };

  // --- Lesson Start Helper ---

  const startLesson = (courseId: string, lessonId?: string) => {
    setSelectedCourseId(courseId);
    if (lessonId) {
      setSelectedLessonId(lessonId);
    } else {
      const course = courses.find((c) => c.id === courseId);
      const firstLesson = course?.modules[0]?.lessons[0]?.id || '';
      setSelectedLessonId(firstLesson);
    }
    navigate('/learn');
  };

  return (
    <LMSContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        isAuthenticated: !!currentUser,
        isLoadingAuth,
        loginStudent,
        registerStudent,
        loginInstructor,
        registerInstructor,
        loginAdmin,
        bootstrapAdmin,
        logout,
        darkMode,
        setDarkMode,
        toggleDarkMode,
        highContrast,
        setHighContrast,
        currentView,
        setCurrentView,
        navigate,
        selectedCourseId,
        setSelectedCourseId,
        selectedLessonId,
        setSelectedLessonId,
        courses,
        isLoadingCourses,
        refreshCourses,
        createCourse,
        createModule,
        createLesson,
        enrolledCourseIds,
        courseProgress,
        enrollInCourse,
        markLessonComplete,
        isLessonCompleted,
        getCourseProgressPercentage,
        quizzes,
        activeQuiz,
        setActiveQuiz,
        quizAttempts,
        recordQuizAttempt,
        submitQuiz,
        assignments,
        submissions,
        submitAssignment,
        gradeSubmission,
        notifications,
        markNotificationRead,
        markAllNotificationsRead,
        announcements,
        notes,
        addNote,
        deleteNote,
        discussions,
        addDiscussionMessage,
        auditLogs,
        addAuditLog,
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        startLesson,
      }}
    >
      {children}
    </LMSContext.Provider>
  );
};

export const useLMS = (): LMSContextType => {
  const context = useContext(LMSContext);
  if (!context) {
    throw new Error('useLMS must be used within an LMSProvider');
  }
  return context;
};
