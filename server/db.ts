import fs from 'fs';
import path from 'path';

export const ADMIN_PERMISSIONS = [
  'USER_VIEW',
  'USER_CREATE',
  'USER_UPDATE',
  'USER_SUSPEND',
  'COURSE_VIEW',
  'COURSE_CREATE',
  'COURSE_UPDATE',
  'COURSE_DELETE',
  'COURSE_PUBLISH',
  'ENROLLMENT_VIEW',
  'ENROLLMENT_CREATE',
  'ENROLLMENT_UPDATE',
  'REPORT_VIEW',
  'AUDIT_LOG_VIEW',
  'SYSTEM_SETTINGS_VIEW',
  'SYSTEM_SETTINGS_UPDATE',
] as const;

export type AdminPermission = typeof ADMIN_PERMISSIONS[number];

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN' | 'SUPER_ADMIN';
  status: 'ACTIVE' | 'PENDING_VERIFICATION' | 'SUSPENDED' | 'DEACTIVATED';
  permissions?: string[];
  mfaEnabled?: boolean;
  mfaSecret?: string;
  mfaRecoveryCodes?: string[];
  avatarUrl?: string;
  failedLoginCount: number;
  lockedUntil?: string | null;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StudentProfileRecord {
  id: string;
  userId: string;
  studentId: string;
  gradeLevel?: string;
  bio?: string;
  phoneNumber?: string;
  createdAt: string;
}

export interface InstructorProfileRecord {
  id: string;
  userId: string;
  instructorId: string;
  specialization?: string;
  department?: string;
  title?: string;
  biography?: string;
  verifiedAt?: string | null;
  createdAt: string;
}

export interface CourseCategoryRecord {
  id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt: string;
}

export interface CourseRecord {
  id: string;
  code: string;
  title: string;
  description: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  instructorId: string;
  categoryId?: string | null;
  durationHrs: number;
  thumbnailUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CourseModuleRecord {
  id: string;
  courseId: string;
  title: string;
  orderIndex: number;
  createdAt: string;
}

export interface LessonRecord {
  id: string;
  moduleId: string;
  title: string;
  durationMin: number;
  orderIndex: number;
  videoUrl?: string;
  contentMarkdown?: string;
  createdAt: string;
}

export interface LessonResourceRecord {
  id: string;
  lessonId: string;
  title: string;
  fileUrl: string;
  fileType: string;
  sizeBytes?: number;
  createdAt: string;
}

export interface QuizRecord {
  id: string;
  moduleId: string;
  title: string;
  description?: string;
  timeLimitMinutes: number;
  passingScorePercent: number;
  maxAttempts: number;
  createdAt: string;
}

export interface QuestionRecord {
  id: string;
  quizId: string;
  prompt: string;
  points: number;
  codeSnippet?: string;
  orderIndex: number;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
    explanation?: string;
  }[];
}

export interface QuizAttemptRecord {
  id: string;
  quizId: string;
  userId: string;
  score: number;
  totalPoints: number;
  percentage: number;
  passed: boolean;
  startedAt: string;
  submittedAt: string;
  answers: Record<string, string>;
}

export interface AssignmentRecord {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  points: number;
  dueDate?: string | null;
  rubric: { criterion: string; weight: number; description: string }[];
  starterFileName?: string;
  createdAt: string;
}

export interface AssignmentSubmissionRecord {
  id: string;
  assignmentId: string;
  userId: string;
  submissionText?: string;
  fileStoragePath?: string;
  fileName?: string;
  fileSizeBytes?: number;
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'GRADED' | 'RESUBMISSION_REQUESTED';
  grade?: number | null;
  feedback?: string | null;
  gradedBy?: string | null;
  gradedAt?: string | null;
  submittedAt: string;
  updatedAt: string;
}

export interface EnrollmentRecord {
  id: string;
  userId: string;
  courseId: string;
  enrolledAt: string;
  status?: 'ACTIVE' | 'COMPLETED' | 'DROPPED';
  completionPercentage?: number;
  completedAt?: string | null;
}

export interface LessonProgressRecord {
  id: string;
  userId: string;
  lessonId: string;
  courseId: string;
  isCompleted: boolean;
  watchedSec: number;
  completedAt?: string | null;
  updatedAt: string;
}

export interface CertificateRecord {
  id: string;
  certificateHash: string;
  userId: string;
  courseId: string;
  courseTitle: string;
  recipientName: string;
  issuedAt: string;
}

export interface AnnouncementRecord {
  id: string;
  courseId: string;
  authorName: string;
  title: string;
  content: string;
  createdAt: string;
}

export interface NotificationRecord {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'SYSTEM' | 'COURSE' | 'GRADE' | 'ALERT';
  isRead: boolean;
  createdAt: string;
}

export interface DiscussionRecord {
  id: string;
  courseId: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  title: string;
  content: string;
  createdAt: string;
  replies: {
    id: string;
    authorId: string;
    authorName: string;
    authorRole: string;
    content: string;
    createdAt: string;
  }[];
}

export interface AuditLogRecord {
  id: string;
  userId?: string | null;
  actor: string;
  action: string;
  details: string;
  ipAddress: string;
  status: 'SUCCESS' | 'FAILURE' | 'WARNING';
  createdAt: string;
}

export interface RefreshSessionRecord {
  id: string;
  userId: string;
  refreshTokenHash: string;
  familyId: string;
  isRevoked: boolean;
  device?: string;
  ipAddress?: string;
  lastActiveAt?: string;
  expiresAt: string;
  createdAt: string;
}

export interface EmailVerificationTokenRecord {
  id: string;
  userId: string;
  email: string;
  code: string; // 6-digit numeric verification code
  token: string; // Cryptographic url-safe verification token
  expiresAt: string;
  verified: boolean;
  createdAt: string;
}

export interface PasswordResetTokenRecord {
  id: string;
  userId: string;
  email: string;
  code: string; // 6-digit numeric reset code
  token: string; // Cryptographic url-safe reset token
  expiresAt: string;
  used: boolean;
  createdAt: string;
}

export interface EmailLogRecord {
  id: string;
  to: string;
  subject: string;
  type: 'VERIFICATION' | 'PASSWORD_RESET' | 'WELCOME' | 'ENROLLMENT' | 'GRADE' | 'NOTIFICATION';
  code?: string;
  previewText?: string;
  sentAt: string;
  status: 'DELIVERED' | 'SIMULATED' | 'FAILED';
  error?: string;
}

export interface SystemSettingsRecord {
  institutionName: string;
  allowSelfRegistration: boolean;
  sessionTimeoutMinutes: number;
  mfaEnforcedForAdmins: boolean;
  maintenanceMode: boolean;
  updatedAt: string;
}

export interface DatabaseState {
  users: UserRecord[];
  studentProfiles: StudentProfileRecord[];
  instructorProfiles: InstructorProfileRecord[];
  courses: CourseRecord[];
  courseCategories: CourseCategoryRecord[];
  courseModules: CourseModuleRecord[];
  lessons: LessonRecord[];
  lessonResources: LessonResourceRecord[];
  quizzes: QuizRecord[];
  questions: QuestionRecord[];
  quizAttempts: QuizAttemptRecord[];
  assignments: AssignmentRecord[];
  assignmentSubmissions: AssignmentSubmissionRecord[];
  enrollments: EnrollmentRecord[];
  lessonProgress: LessonProgressRecord[];
  certificates: CertificateRecord[];
  announcements: AnnouncementRecord[];
  notifications: NotificationRecord[];
  discussions: DiscussionRecord[];
  auditLogs: AuditLogRecord[];
  refreshSessions: RefreshSessionRecord[];
  emailVerificationTokens: EmailVerificationTokenRecord[];
  passwordResetTokens: PasswordResetTokenRecord[];
  emailLogs: EmailLogRecord[];
  systemSettings: SystemSettingsRecord;
}

// On Vercel serverless runtime, only /tmp is writable
const DB_DIR = process.env.VERCEL ? path.join('/tmp', 'data') : path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'lms.production.json');
const SEED_FILE = path.join(process.cwd(), 'data', 'lms.production.json');

function getInitialEmptyDatabase(): DatabaseState {
  return {
    users: [],
    studentProfiles: [],
    instructorProfiles: [],
    courses: [],
    courseCategories: [],
    courseModules: [],
    lessons: [],
    lessonResources: [],
    quizzes: [],
    questions: [],
    quizAttempts: [],
    assignments: [],
    assignmentSubmissions: [],
    enrollments: [],
    lessonProgress: [],
    certificates: [],
    announcements: [],
    notifications: [],
    discussions: [],
    auditLogs: [],
    refreshSessions: [],
    emailVerificationTokens: [],
    passwordResetTokens: [],
    emailLogs: [],
    systemSettings: {
      institutionName: 'LTI Tech / EduTech LMS',
      allowSelfRegistration: true,
      sessionTimeoutMinutes: 30,
      mfaEnforcedForAdmins: false,
      maintenanceMode: false,
      updatedAt: new Date().toISOString(),
    },
  };
}

class ProductionDatabase {
  private state: DatabaseState;

  constructor() {
    this.state = this.loadFromDisk();
  }

  private loadFromDisk(): DatabaseState {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      // Check writable DB_FILE first, or fallback to bundled SEED_FILE
      const targetFile = fs.existsSync(DB_FILE) ? DB_FILE : (fs.existsSync(SEED_FILE) ? SEED_FILE : null);
      if (targetFile) {
        const raw = fs.readFileSync(targetFile, 'utf-8');
        const parsed = JSON.parse(raw);
        // Ensure all arrays exist
        return {
          ...getInitialEmptyDatabase(),
          ...parsed,
        };
      }
    } catch (err) {
      console.error('Error loading database from disk, creating empty store:', err);
    }
    const empty = getInitialEmptyDatabase();
    this.saveToDisk(empty);
    return empty;
  }

  private saveToDisk(data: DatabaseState): void {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      const tmpFile = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DB_FILE);
    } catch (err) {
      console.error('CRITICAL: Failed to persist database to disk:', err);
    }
  }

  public read(): DatabaseState {
    return this.state;
  }

  public update(updater: (draft: DatabaseState) => void): DatabaseState {
    updater(this.state);
    this.saveToDisk(this.state);
    return this.state;
  }

  // Audit logging utility
  public addAuditLog(
    action: string,
    details: string,
    ipAddress: string,
    status: 'SUCCESS' | 'FAILURE' | 'WARNING',
    userId?: string | null,
    actor?: string
  ): AuditLogRecord {
    const log: AuditLogRecord = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      userId: userId || null,
      actor: actor || (userId ? `User:${userId}` : 'Anonymous'),
      action,
      details,
      ipAddress: ipAddress || '127.0.0.1',
      status,
      createdAt: new Date().toISOString(),
    };
    this.update((draft) => {
      draft.auditLogs.unshift(log);
      // Keep last 1000 logs
      if (draft.auditLogs.length > 1000) {
        draft.auditLogs.pop();
      }
    });
    return log;
  }
}

export const db = new ProductionDatabase();
