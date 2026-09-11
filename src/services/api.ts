// Production REST API client with JWT Bearer authentication and refresh handling

const API_BASE = '/api/v1';

export class ApiError extends Error {
  constructor(public status: number, message: string, public data?: any) {
    super(message);
    this.name = 'ApiError';
  }
}

class LMSApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.accessToken = localStorage.getItem('lti_access_token');
    this.refreshToken = localStorage.getItem('lti_refresh_token');
  }

  public setTokens(access: string, refresh: string) {
    this.accessToken = access;
    this.refreshToken = refresh;
    localStorage.setItem('lti_access_token', access);
    localStorage.setItem('lti_refresh_token', refresh);
  }

  public clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('lti_access_token');
    localStorage.removeItem('lti_refresh_token');
  }

  public getAccessToken(): string | null {
    return this.accessToken;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers || {});
    headers.set('Content-Type', 'application/json');

    if (this.accessToken) {
      headers.set('Authorization', `Bearer ${this.accessToken}`);
    }

    let response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    // If access token expired, attempt automatic refresh
    if (response.status === 401 && this.refreshToken && !endpoint.includes('/auth/refresh') && !endpoint.includes('/auth/login')) {
      try {
        const refreshed = await this.refreshTokens();
        if (refreshed) {
          headers.set('Authorization', `Bearer ${this.accessToken}`);
          response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers,
          });
        }
      } catch (err) {
        this.clearTokens();
      }
    }

    let responseData: any;
    try {
      responseData = await response.json();
    } catch {
      responseData = null;
    }

    if (!response.ok) {
      const errorMsg = responseData?.error || `Request failed with HTTP status ${response.status}`;
      throw new ApiError(response.status, errorMsg, responseData);
    }

    return responseData as T;
  }

  public async refreshTokens(): Promise<boolean> {
    if (!this.refreshToken) return false;
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });
      if (res.ok) {
        const data = await res.json();
        this.setTokens(data.accessToken, data.refreshToken);
        return true;
      }
      this.clearTokens();
      return false;
    } catch {
      this.clearTokens();
      return false;
    }
  }

  // --- Auth APIs ---

  public async checkBootstrapStatus() {
    return this.request<{ needsBootstrap: boolean; totalUsers: number; message: string }>(
      '/auth/bootstrap-status'
    );
  }

  public async bootstrapAdmin(data: { name: string; email: string; password: string }) {
    const res = await this.request<{ user: any; accessToken: string; refreshToken: string }>(
      '/auth/admin/bootstrap',
      { method: 'POST', body: JSON.stringify(data) }
    );
    this.setTokens(res.accessToken, res.refreshToken);
    return res;
  }

  public async loginStudent(email: string, password: string) {
    const res = await this.request<{
      user?: any;
      accessToken?: string;
      refreshToken?: string;
      verificationRequired?: boolean;
      email?: string;
      name?: string;
      previewCode?: string;
      message?: string;
    }>('/auth/student/login', { method: 'POST', body: JSON.stringify({ email, password }) });

    if (res.accessToken && res.refreshToken) {
      this.setTokens(res.accessToken, res.refreshToken);
    }
    return res;
  }

  public async registerStudent(data: { name: string; email: string; password: string; studentId?: string; gradeLevel?: string }) {
    const res = await this.request<{
      success?: boolean;
      verificationRequired?: boolean;
      email?: string;
      name?: string;
      previewCode?: string;
      message?: string;
      user?: any;
      accessToken?: string;
      refreshToken?: string;
    }>('/auth/student/register', { method: 'POST', body: JSON.stringify(data) });

    if (res.accessToken && res.refreshToken) {
      this.setTokens(res.accessToken, res.refreshToken);
    }
    return res;
  }

  public async verifyEmail(data: { email: string; code?: string; token?: string }) {
    const res = await this.request<{
      success: boolean;
      message: string;
      user: any;
      accessToken: string;
      refreshToken: string;
    }>('/auth/verify-email', { method: 'POST', body: JSON.stringify(data) });

    if (res.accessToken && res.refreshToken) {
      this.setTokens(res.accessToken, res.refreshToken);
    }
    return res;
  }

  public async resendVerificationCode(email: string) {
    return this.request<{
      success: boolean;
      message: string;
      previewCode?: string;
    }>('/auth/resend-verification-code', { method: 'POST', body: JSON.stringify({ email }) });
  }

  public async forgotPassword(email: string) {
    return this.request<{
      success: boolean;
      message: string;
      previewCode?: string;
    }>('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });
  }

  public async resetPassword(data: { email: string; code?: string; token?: string; newPassword: string }) {
    return this.request<{
      success: boolean;
      message: string;
    }>('/auth/reset-password', { method: 'POST', body: JSON.stringify(data) });
  }

  public async getRecentEmails() {
    return this.request<{ emails: any[] }>('/emails/recent');
  }

  public async loginInstructor(email: string, password: string) {
    const res = await this.request<{ user: any; accessToken: string; refreshToken: string }>(
      '/auth/instructor/login',
      { method: 'POST', body: JSON.stringify({ email, password }) }
    );
    this.setTokens(res.accessToken, res.refreshToken);
    return res;
  }

  public async registerInstructor(data: { name: string; email: string; password: string; specialization?: string; department?: string }) {
    const res = await this.request<{ user: any; accessToken: string; refreshToken: string }>(
      '/auth/instructor/register',
      { method: 'POST', body: JSON.stringify(data) }
    );
    this.setTokens(res.accessToken, res.refreshToken);
    return res;
  }

  public async loginAdmin(email: string, password: string, mfaCode?: string) {
    const res = await this.request<{ user?: any; accessToken?: string; refreshToken?: string; mfaRequired?: boolean; message?: string }>(
      '/auth/admin/login',
      { method: 'POST', body: JSON.stringify({ email, password, mfaCode }) }
    );
    if (res.accessToken && res.refreshToken) {
      this.setTokens(res.accessToken, res.refreshToken);
    }
    return res;
  }

  public async quickDemoLogin(role?: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN', email?: string) {
    const res = await this.request<{ user: any; accessToken: string; refreshToken: string; message: string }>(
      '/auth/quick-demo-login',
      { method: 'POST', body: JSON.stringify({ role, email }) }
    );
    if (res.accessToken && res.refreshToken) {
      this.setTokens(res.accessToken, res.refreshToken);
    }
    return res;
  }

  public async googleSignIn(data?: { email?: string; name?: string; role?: string }) {
    const res = await this.request<{ user: any; accessToken: string; refreshToken: string; message: string }>(
      '/auth/google-sign-in',
      { method: 'POST', body: JSON.stringify(data || {}) }
    );
    if (res.accessToken && res.refreshToken) {
      this.setTokens(res.accessToken, res.refreshToken);
    }
    return res;
  }

  public async requestEmailCode(email: string) {
    return this.request<{
      success: boolean;
      email: string;
      message: string;
      previewCode?: string;
    }>('/auth/email-code/request', { method: 'POST', body: JSON.stringify({ email }) });
  }

  public async loginWithEmailCode(email: string, code: string) {
    const res = await this.request<{
      success: boolean;
      message: string;
      user: any;
      accessToken: string;
      refreshToken: string;
    }>('/auth/email-code/login', { method: 'POST', body: JSON.stringify({ email, code }) });

    if (res.accessToken && res.refreshToken) {
      this.setTokens(res.accessToken, res.refreshToken);
    }
    return res;
  }

  public async logout() {
    try {
      if (this.refreshToken) {
        await this.request('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken: this.refreshToken }),
        });
      }
    } finally {
      this.clearTokens();
    }
  }

  public async logoutAllSessions() {
    try {
      await this.request('/auth/logout-all', { method: 'POST' });
    } finally {
      this.clearTokens();
    }
  }

  public async getMe() {
    return this.request<{ user: any }>('/auth/me');
  }

  // --- Courses & Syllabus APIs ---

  public async getCourses() {
    return this.request<{ courses: any[] }>('/courses');
  }

  public async getCourseDetail(courseId: string) {
    return this.request<{ course: any; instructor: any; modules: any[] }>(`/courses/${courseId}`);
  }

  public async createCourse(data: { code: string; title: string; description: string; level?: string; durationHrs?: number }) {
    return this.request<{ course: any }>('/courses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async createModule(courseId: string, data: { title: string; orderIndex?: number }) {
    return this.request<{ module: any }>(`/courses/${courseId}/modules`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async createLesson(moduleId: string, data: { title: string; durationMin?: number; videoUrl?: string; contentMarkdown?: string }) {
    return this.request<{ lesson: any }>(`/modules/${moduleId}/lessons`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // --- Enrollments & Progress ---

  public async getMyEnrollments() {
    return this.request<{ enrollments: any[] }>('/enrollments/my');
  }

  public async enrollInCourse(courseId: string) {
    return this.request<{ message: string; enrollment: any }>('/enrollments', {
      method: 'POST',
      body: JSON.stringify({ courseId }),
    });
  }

  public async recordLessonProgress(data: { lessonId: string; courseId: string; watchedSec?: number; isCompleted?: boolean }) {
    return this.request<{ message: string }>('/progress/lesson', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // --- Quizzes & Assessments ---

  public async getQuiz(quizId: string) {
    return this.request<{ quiz: any; questions: any[]; userAttempts: any[]; attemptsRemaining: number }>(
      `/quizzes/${quizId}`
    );
  }

  public async submitQuiz(quizId: string, answers: Record<string, string>) {
    return this.request<{ attempt: any; resultsDetail: any[]; passed: boolean; percentage: number }>(
      `/quizzes/${quizId}/submit`,
      { method: 'POST', body: JSON.stringify({ answers }) }
    );
  }

  public async createQuiz(moduleId: string, data: any) {
    return this.request<{ quiz: any }>(`/modules/${moduleId}/quizzes`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // --- Assignments ---

  public async submitAssignment(assignmentId: string, data: { submissionText: string; fileName?: string }) {
    return this.request<{ message: string }>(`/assignments/${assignmentId}/submit`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async gradeSubmission(submissionId: string, data: { grade: number; feedback: string }) {
    return this.request<{ message: string }>(`/submissions/${submissionId}/grade`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // --- Admin & Security Center APIs ---

  public async getAdminStats() {
    return this.request<any>('/admin/stats');
  }

  public async getAdminUsers() {
    return this.request<{ users: any[] }>('/admin/users');
  }

  public async createAdminUser(data: { name: string; email: string; password: string; role: string; permissions?: string[] }) {
    return this.request<{ user: any }>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async updateUserRole(userId: string, role: string) {
    return this.request<{ message: string }>(`/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  }

  public async updateUserPermissions(userId: string, permissions: string[]) {
    return this.request<{ message: string; permissions: string[] }>(`/admin/users/${userId}/permissions`, {
      method: 'PATCH',
      body: JSON.stringify({ permissions }),
    });
  }

  public async updateUserStatus(userId: string, status: string) {
    return this.request<{ message: string }>(`/admin/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  public async deleteUser(userId: string) {
    return this.request<{ message: string }>(`/admin/users/${userId}`, {
      method: 'DELETE',
    });
  }

  public async getAdminCourses() {
    return this.request<{ courses: any[] }>('/admin/courses');
  }

  public async updateCourseStatus(courseId: string, status: string) {
    return this.request<{ message: string }>(`/admin/courses/${courseId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  public async deleteCourse(courseId: string) {
    return this.request<{ message: string }>(`/admin/courses/${courseId}`, {
      method: 'DELETE',
    });
  }

  public async getAdminEnrollments() {
    return this.request<{ enrollments: any[] }>('/admin/enrollments');
  }

  public async createEnrollment(userId: string, courseId: string) {
    return this.request<{ enrollment: any }>('/admin/enrollments', {
      method: 'POST',
      body: JSON.stringify({ userId, courseId }),
    });
  }

  public async deleteEnrollment(id: string) {
    return this.request<{ message: string }>(`/admin/enrollments/${id}`, {
      method: 'DELETE',
    });
  }

  public async getAdminAuditLogs() {
    return this.request<{ auditLogs: any[] }>('/admin/audit-logs');
  }

  public async getAdminReports() {
    return this.request<any>('/admin/reports/overview');
  }

  public async getAdminSettings() {
    return this.request<{ settings: any }>('/admin/settings');
  }

  public async updateAdminSettings(settings: any) {
    return this.request<{ settings: any }>('/admin/settings', {
      method: 'PATCH',
      body: JSON.stringify(settings),
    });
  }

  public async getAdminSecurityOverview() {
    return this.request<any>('/admin/security/overview');
  }

  public async revokeAdminSession(sessionId: string) {
    return this.request<{ message: string }>(`/admin/security/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  }

  public async revokeAllAdminSessions() {
    return this.request<{ message: string }>('/admin/security/revoke-all-sessions', {
      method: 'POST',
    });
  }

  public async setupMFA() {
    return this.request<{ secret: string; otpAuthUri: string; recoveryCodes: string[]; instructions: string }>(
      '/admin/security/mfa/setup',
      { method: 'POST' }
    );
  }

  public async verifyMFA(token: string) {
    return this.request<{ message: string }>('/admin/security/mfa/verify', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  public async disableMFA(password: string) {
    return this.request<{ message: string }>('/admin/security/mfa/disable', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  }
}

export const api = new LMSApiClient();
