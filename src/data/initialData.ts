// LTI Tech / EduTech Production LMS
// ABSOLUTE RULE: Zero mock data, demo users, or sample content.
// Production database starts empty. All dynamic content is retrieved from the backend API.

import {
  Course,
  Quiz,
  Assignment,
  AnnouncementItem,
  NotificationItem,
  AuditLogItem,
  CourseProgress,
} from '../types';

export const INITIAL_COURSES: Course[] = [];
export const INITIAL_QUIZZES: Quiz[] = [];
export const INITIAL_ASSIGNMENTS: Assignment[] = [];
export const INITIAL_ANNOUNCEMENTS: AnnouncementItem[] = [];
export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];
export const INITIAL_PROGRESS: Record<string, CourseProgress> = {};
export const INITIAL_AUDIT_LOGS: AuditLogItem[] = [];
