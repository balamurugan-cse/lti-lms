export type Role = 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';

export type CourseLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export type LessonType = 'video' | 'reading' | 'interactive';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl: string;
  title?: string;
  studentId?: string;
  joinedDate: string;
}

export interface LessonResource {
  id: string;
  title: string;
  type: 'pdf' | 'code' | 'diagram' | 'link';
  size?: string;
  url: string;
}

export interface Lesson {
  id: string;
  title: string;
  durationMinutes: number;
  type: LessonType;
  videoUrl?: string;
  posterUrl?: string;
  summary: string;
  contentMarkdown?: string;
  resources: LessonResource[];
  keyTimestamps?: { timeSec: number; label: string }[];
}

export interface CourseModule {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
  quizId?: string;
  assignmentId?: string;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  tagline: string;
  description: string;
  category: string;
  level: CourseLevel;
  thumbnail: string;
  instructor: {
    id: string;
    name: string;
    role: string;
    avatar: string;
    bio: string;
  };
  totalHours: number;
  rating: number;
  enrolledCount: number;
  modules: CourseModule[];
  prerequisites: string[];
  skillsLearned: string[];
  certificateAvailable: boolean;
}

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
  explanation: string;
}

export interface Question {
  id: string;
  prompt: string;
  codeSnippet?: string;
  options: QuestionOption[];
  points: number;
}

export interface Quiz {
  id: string;
  courseId: string;
  moduleId?: string;
  title: string;
  description: string;
  timeLimitMinutes: number;
  passingScorePercent: number;
  maxAttempts: number;
  questions: Question[];
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  score: number;
  totalPoints: number;
  percentage: number;
  passed: boolean;
  timestamp: string;
  answers: Record<string, string>; // questionId -> optionId
}

export interface Assignment {
  id: string;
  courseId: string;
  moduleId: string;
  title: string;
  description: string;
  dueDate: string;
  points: number;
  rubric: { criterion: string; weight: number; description: string }[];
  instructions: string[];
  starterFile?: { name: string; size: string };
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  userId: string;
  submissionText: string;
  attachedFileName?: string;
  submittedAt: string;
  status: 'submitted' | 'graded' | 'pending_review';
  grade?: number;
  feedback?: string;
  gradedBy?: string;
  gradedAt?: string;
}

export interface CourseProgress {
  courseId: string;
  completedLessonIds: string[];
  lastAccessedLessonId?: string;
  lastAccessedAt: string;
  completedQuizIds: string[];
  certificateIssued: boolean;
  certificateId?: string;
  issuedDate?: string;
}

export interface StudentNote {
  id: string;
  courseId: string;
  lessonId: string;
  timestampSec: number;
  text: string;
  createdAt: string;
}

export interface DiscussionMessage {
  id: string;
  courseId: string;
  lessonId?: string;
  userId: string;
  userName: string;
  userRole: Role;
  userAvatar: string;
  message: string;
  timestamp: string;
  upvotes: number;
  replies?: DiscussionMessage[];
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  category: 'course' | 'assignment' | 'quiz' | 'system';
  read: boolean;
  actionUrl?: string;
}

export interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  author: string;
  authorRole: string;
  authorAvatar: string;
  date: string;
  isPinned: boolean;
  badge?: string;
}

export interface AuditLogItem {
  id: string;
  action: string;
  actor: string;
  role: Role;
  timestamp: string;
  ipAddress: string;
  details: string;
  status: 'SUCCESS' | 'WARNING' | 'DENIED';
}
