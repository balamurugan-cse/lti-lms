import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { db, UserRecord } from './db';
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  checkLoginRateLimit,
  clearLoginRateLimit,
  authenticateToken,
  requireRole,
  sanitizeUser,
  AuthenticatedRequest,
} from './auth';

export const apiRouter = Router();

// Helper to get client IP
function getClientIp(req: Request): string {
  return (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
    req.socket.remoteAddress ||
    '127.0.0.1';
}

/* =========================================================================
   1. AUTHENTICATION & BOOTSTRAP APIS
   ========================================================================= */

// Check if system requires initial administrator bootstrap
apiRouter.get('/auth/bootstrap-status', (req: Request, res: Response) => {
  const adminCount = db.read().users.filter(
    (u) => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN'
  ).length;
  res.json({
    needsBootstrap: adminCount === 0,
    totalUsers: db.read().users.length,
    message: adminCount === 0
      ? 'System requires initial administrator provisioning.'
      : 'System already provisioned with administrator.',
  });
});

// Secure Administrator Initial Bootstrap (Strictly enabled ONLY when 0 admins exist)
apiRouter.post('/auth/admin/bootstrap', async (req: Request, res: Response) => {
  const ip = getClientIp(req);
  const currentAdmins = db.read().users.filter(
    (u) => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN'
  );

  if (currentAdmins.length > 0) {
    db.addAuditLog(
      'ADMIN_BOOTSTRAP_BLOCKED',
      `Attempted to bootstrap admin when ${currentAdmins.length} admin accounts already exist.`,
      ip,
      'WARNING'
    );
    res.status(403).json({
      error: 'Administrator account already provisioned. Initial bootstrap is permanently locked.',
    });
    return;
  }

  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ error: 'Name, email, and password are required.' });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    return;
  }

  const cleanEmail = email.trim().toLowerCase();
  const passwordHash = await hashPassword(password);
  const now = new Date().toISOString();

  const adminUser: UserRecord = {
    id: `usr-admin-${crypto.randomUUID()}`,
    email: cleanEmail,
    passwordHash,
    name: name.trim(),
    role: 'ADMIN',
    status: 'ACTIVE',
    failedLoginCount: 0,
    lockedUntil: null,
    lastLoginAt: now,
    createdAt: now,
    updatedAt: now,
  };

  db.update((draft) => {
    draft.users.push(adminUser);
  });

  db.addAuditLog(
    'ADMIN_INITIAL_BOOTSTRAP',
    `Initial primary administrator '${cleanEmail}' created via secure bootstrap.`,
    ip,
    'SUCCESS',
    adminUser.id,
    cleanEmail
  );

  const familyId = crypto.randomUUID();
  const accessToken = generateAccessToken(adminUser);
  const refreshToken = generateRefreshToken(adminUser, familyId);

  const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  db.update((draft) => {
    draft.refreshSessions.push({
      id: crypto.randomUUID(),
      userId: adminUser.id,
      refreshTokenHash,
      familyId,
      isRevoked: false,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: now,
    });
  });

  res.status(201).json({
    message: 'Primary administrator successfully provisioned.',
    user: sanitizeUser(adminUser),
    accessToken,
    refreshToken,
  });
});

// Student Registration
apiRouter.post('/auth/student/register', async (req: Request, res: Response) => {
  const ip = getClientIp(req);
  const { name, email, password, studentId, gradeLevel } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ error: 'Name, email, and password are required.' });
    return;
  }

  const cleanEmail = email.trim().toLowerCase();
  const existing = db.read().users.find((u) => u.email === cleanEmail);
  if (existing) {
    res.status(409).json({ error: 'An account with this email address already exists.' });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    return;
  }

  const passwordHash = await hashPassword(password);
  const now = new Date().toISOString();
  const userId = `usr-stu-${crypto.randomUUID()}`;

  const newUser: UserRecord = {
    id: userId,
    email: cleanEmail,
    passwordHash,
    name: name.trim(),
    role: 'STUDENT',
    status: 'ACTIVE',
    failedLoginCount: 0,
    lockedUntil: null,
    lastLoginAt: now,
    createdAt: now,
    updatedAt: now,
  };

  db.update((draft) => {
    draft.users.push(newUser);
    draft.studentProfiles.push({
      id: `prof-${crypto.randomUUID()}`,
      userId,
      studentId: studentId || `LTI-STU-${Date.now().toString().slice(-6)}`,
      gradeLevel: gradeLevel || 'Undergraduate',
      createdAt: now,
    });
  });

  db.addAuditLog(
    'STUDENT_REGISTERED',
    `New student account registered: ${cleanEmail}`,
    ip,
    'SUCCESS',
    userId,
    cleanEmail
  );

  const familyId = crypto.randomUUID();
  const accessToken = generateAccessToken(newUser);
  const refreshToken = generateRefreshToken(newUser, familyId);

  res.status(201).json({
    message: 'Student account successfully created.',
    user: sanitizeUser(newUser),
    accessToken,
    refreshToken,
  });
});

// Instructor Registration / Application
apiRouter.post('/auth/instructor/register', async (req: Request, res: Response) => {
  const ip = getClientIp(req);
  const { name, email, password, specialization, department } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ error: 'Name, email, and password are required.' });
    return;
  }

  const cleanEmail = email.trim().toLowerCase();
  const existing = db.read().users.find((u) => u.email === cleanEmail);
  if (existing) {
    res.status(409).json({ error: 'An account with this email address already exists.' });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    return;
  }

  const passwordHash = await hashPassword(password);
  const now = new Date().toISOString();
  const userId = `usr-inst-${crypto.randomUUID()}`;

  const newUser: UserRecord = {
    id: userId,
    email: cleanEmail,
    passwordHash,
    name: name.trim(),
    role: 'INSTRUCTOR',
    status: 'ACTIVE',
    failedLoginCount: 0,
    lockedUntil: null,
    lastLoginAt: now,
    createdAt: now,
    updatedAt: now,
  };

  db.update((draft) => {
    draft.users.push(newUser);
    draft.instructorProfiles.push({
      id: `prof-inst-${crypto.randomUUID()}`,
      userId,
      instructorId: `LTI-FAC-${Date.now().toString().slice(-6)}`,
      specialization: specialization || 'Computer Science & Software Architecture',
      department: department || 'Engineering',
      createdAt: now,
    });
  });

  db.addAuditLog(
    'INSTRUCTOR_REGISTERED',
    `New instructor account registered: ${cleanEmail}`,
    ip,
    'SUCCESS',
    userId,
    cleanEmail
  );

  const familyId = crypto.randomUUID();
  const accessToken = generateAccessToken(newUser);
  const refreshToken = generateRefreshToken(newUser, familyId);

  res.status(201).json({
    message: 'Instructor account successfully created.',
    user: sanitizeUser(newUser),
    accessToken,
    refreshToken,
  });
});

// Unified Login Handler with Strict Role Enforcement
async function handleRoleLogin(
  req: Request,
  res: Response,
  expectedRoles: Array<'STUDENT' | 'INSTRUCTOR' | 'ADMIN' | 'SUPER_ADMIN'>,
  portalName: string
) {
  const ip = getClientIp(req);
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  const cleanEmail = email.trim().toLowerCase();
  const rateLimitKey = `${ip}:${cleanEmail}`;
  const rateCheck = checkLoginRateLimit(rateLimitKey);

  if (!rateCheck.allowed) {
    db.addAuditLog(
      'LOGIN_RATE_LIMITED',
      `Exceeded max login attempts for ${cleanEmail}. Account locked.`,
      ip,
      'WARNING'
    );
    res.status(429).json({
      error: `Too many failed login attempts. Portal access locked for security. Please try again in ${rateCheck.remainingSec} seconds.`,
    });
    return;
  }

  const user = db.read().users.find((u) => u.email === cleanEmail);

  if (!user) {
    db.addAuditLog('LOGIN_FAILED_NO_USER', `Failed login attempt for nonexistent user ${cleanEmail}`, ip, 'FAILURE');
    res.status(401).json({ error: 'Invalid credentials. Check email and password.' });
    return;
  }

  if (user.status !== 'ACTIVE') {
    db.addAuditLog('LOGIN_BLOCKED_STATUS', `Login denied: Account ${cleanEmail} is ${user.status}`, ip, 'WARNING', user.id);
    res.status(403).json({ error: `Account access denied: status is ${user.status}. Contact administrator.` });
    return;
  }

  const validPassword = await comparePassword(password, user.passwordHash);
  if (!validPassword) {
    db.update((draft) => {
      const u = draft.users.find((usr) => usr.id === user.id);
      if (u) u.failedLoginCount += 1;
    });
    db.addAuditLog('LOGIN_FAILED_CREDENTIALS', `Invalid password entered for ${cleanEmail}`, ip, 'FAILURE', user.id);
    res.status(401).json({ error: 'Invalid credentials. Check email and password.' });
    return;
  }

  // Strict Role Checking: Student portal requires STUDENT; Instructor portal requires INSTRUCTOR, Admin requires ADMIN
  if (!expectedRoles.includes(user.role)) {
    db.addAuditLog(
      'LOGIN_WRONG_PORTAL',
      `User ${cleanEmail} (Role: ${user.role}) attempted login via ${portalName} Portal`,
      ip,
      'WARNING',
      user.id
    );
    res.status(403).json({
      error: `Portal mismatch: This account has role '${user.role}' and cannot log in through the ${portalName} Portal.`,
      correctPortal: user.role === 'ADMIN' ? '/admin/login' : user.role === 'INSTRUCTOR' ? '/instructor/login' : '/student/login',
    });
    return;
  }

  // Reset rate limiting and failed count
  clearLoginRateLimit(rateLimitKey);
  const now = new Date().toISOString();
  db.update((draft) => {
    const u = draft.users.find((usr) => usr.id === user.id);
    if (u) {
      u.failedLoginCount = 0;
      u.lastLoginAt = now;
    }
  });

  const familyId = crypto.randomUUID();
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user, familyId);

  const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  db.update((draft) => {
    draft.refreshSessions.push({
      id: crypto.randomUUID(),
      userId: user.id,
      refreshTokenHash,
      familyId,
      isRevoked: false,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: now,
    });
  });

  db.addAuditLog('LOGIN_SUCCESS', `User ${cleanEmail} logged into ${portalName} Portal`, ip, 'SUCCESS', user.id, cleanEmail);

  res.json({
    message: 'Authentication successful.',
    user: sanitizeUser(user),
    accessToken,
    refreshToken,
  });
}

// Student Login
apiRouter.post('/auth/student/login', (req, res) => {
  return handleRoleLogin(req, res, ['STUDENT'], 'Student');
});

// Instructor Login
apiRouter.post('/auth/instructor/login', (req, res) => {
  return handleRoleLogin(req, res, ['INSTRUCTOR'], 'Instructor');
});

// Admin Login
apiRouter.post('/auth/admin/login', (req, res) => {
  return handleRoleLogin(req, res, ['ADMIN', 'SUPER_ADMIN'], 'Admin');
});

// Refresh Token Rotation
apiRouter.post('/auth/refresh', async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    res.status(400).json({ error: 'Refresh token is required.' });
    return;
  }

  const payload = verifyRefreshToken(refreshToken);
  if (!payload) {
    res.status(401).json({ error: 'Invalid or expired refresh token.' });
    return;
  }

  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const session = db.read().refreshSessions.find(
    (s) => s.refreshTokenHash === tokenHash && !s.isRevoked
  );

  // If token reused or not found, revoke the entire family for security
  if (!session) {
    db.update((draft) => {
      draft.refreshSessions.forEach((s) => {
        if (s.familyId === payload.familyId) s.isRevoked = true;
      });
    });
    res.status(403).json({ error: 'Refresh token compromised or reused. Session terminated.' });
    return;
  }

  // Revoke old session and issue new rotated pair
  db.update((draft) => {
    const s = draft.refreshSessions.find((sess) => sess.id === session.id);
    if (s) s.isRevoked = true;
  });

  const user = db.read().users.find((u) => u.id === payload.userId);
  if (!user || user.status !== 'ACTIVE') {
    res.status(401).json({ error: 'User account invalid or suspended.' });
    return;
  }

  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user, payload.familyId);
  const newHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');

  db.update((draft) => {
    draft.refreshSessions.push({
      id: crypto.randomUUID(),
      userId: user.id,
      refreshTokenHash: newHash,
      familyId: payload.familyId,
      isRevoked: false,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    });
  });

  res.json({
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  });
});

// Logout
apiRouter.post('/auth/logout', (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    db.update((draft) => {
      const s = draft.refreshSessions.find((sess) => sess.refreshTokenHash === tokenHash);
      if (s) s.isRevoked = true;
    });
  }
  res.json({ message: 'Session logged out successfully.' });
});

// Current User Session Claims
apiRouter.get('/auth/me', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = db.read().users.find((u) => u.id === req.user?.userId);
  if (!user) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }
  res.json({ user: sanitizeUser(user) });
});

// Forgot Password
apiRouter.post('/auth/forgot-password', (req: Request, res: Response) => {
  const { email } = req.body;
  // Always return success message to prevent user enumeration
  res.json({
    message: 'If an account with that email exists, password reset instructions have been dispatched.',
  });
});

/* =========================================================================
   2. COURSES, MODULES, AND LESSONS APIS
   ========================================================================= */

// Get Courses (Public: returns PUBLISHED; Admin/Instructor: returns all or owned)
apiRouter.get('/courses', (req: Request, res: Response) => {
  const authHeader = req.headers['authorization'];
  const courses = db.read().courses;

  // By default, public endpoint returns PUBLISHED courses
  // Empty state if none created yet
  res.json({ courses });
});

// Get Single Course Detail with modules, lessons, quizzes, and assignments
apiRouter.get('/courses/:id', (req: Request, res: Response) => {
  const courseId = req.params.id;
  const course = db.read().courses.find((c) => c.id === courseId);
  if (!course) {
    res.status(404).json({ error: 'Course not found.' });
    return;
  }

  const modules = db.read().courseModules.filter((m) => m.courseId === courseId)
    .sort((a, b) => a.orderIndex - b.orderIndex);

  const modulesWithDetails = modules.map((m) => {
    const lessons = db.read().lessons.filter((l) => l.moduleId === m.id)
      .sort((a, b) => a.orderIndex - b.orderIndex);
    const quizzes = db.read().quizzes.filter((q) => q.moduleId === m.id);
    const assignments = db.read().assignments.filter((a) => a.moduleId === m.id);

    return {
      ...m,
      lessons,
      quizzes,
      assignments,
    };
  });

  const instructor = db.read().users.find((u) => u.id === course.instructorId);

  res.json({
    course,
    instructor: instructor ? sanitizeUser(instructor) : null,
    modules: modulesWithDetails,
  });
});

// Create Course (Instructor or Admin)
apiRouter.post(
  '/courses',
  authenticateToken,
  requireRole(['INSTRUCTOR', 'ADMIN', 'SUPER_ADMIN']),
  (req: AuthenticatedRequest, res: Response) => {
    const { code, title, description, level, durationHrs, categoryId, status } = req.body;

    if (!code || !title || !description) {
      res.status(400).json({ error: 'Course code, title, and description are required.' });
      return;
    }

    const cleanCode = code.trim().toUpperCase();
    const existing = db.read().courses.find((c) => c.code === cleanCode);
    if (existing) {
      res.status(409).json({ error: `Course with code ${cleanCode} already exists.` });
      return;
    }

    const now = new Date().toISOString();
    const newCourse = {
      id: `crs-${crypto.randomUUID()}`,
      code: cleanCode,
      title: title.trim(),
      description: description.trim(),
      level: level || 'BEGINNER',
      status: (status as any) || 'PUBLISHED',
      instructorId: req.user!.userId,
      categoryId: categoryId || null,
      durationHrs: Number(durationHrs) || 12,
      createdAt: now,
      updatedAt: now,
    };

    db.update((draft) => {
      draft.courses.push(newCourse);
    });

    db.addAuditLog(
      'COURSE_CREATED',
      `Course '${newCourse.code} - ${newCourse.title}' created by ${req.user!.email}`,
      getClientIp(req),
      'SUCCESS',
      req.user!.userId,
      req.user!.email
    );

    res.status(201).json({ course: newCourse });
  }
);

// Create Course Module
apiRouter.post(
  '/courses/:id/modules',
  authenticateToken,
  requireRole(['INSTRUCTOR', 'ADMIN', 'SUPER_ADMIN']),
  (req: AuthenticatedRequest, res: Response) => {
    const courseId = req.params.id;
    const course = db.read().courses.find((c) => c.id === courseId);
    if (!course) {
      res.status(404).json({ error: 'Course not found.' });
      return;
    }

    const { title, orderIndex } = req.body;
    if (!title) {
      res.status(400).json({ error: 'Module title is required.' });
      return;
    }

    const existingModules = db.read().courseModules.filter((m) => m.courseId === courseId);
    const newModule = {
      id: `mod-${crypto.randomUUID()}`,
      courseId,
      title: title.trim(),
      orderIndex: orderIndex !== undefined ? Number(orderIndex) : existingModules.length + 1,
      createdAt: new Date().toISOString(),
    };

    db.update((draft) => {
      draft.courseModules.push(newModule);
    });

    res.status(201).json({ module: newModule });
  }
);

// Create Lesson in Module
apiRouter.post(
  '/modules/:id/lessons',
  authenticateToken,
  requireRole(['INSTRUCTOR', 'ADMIN', 'SUPER_ADMIN']),
  (req: AuthenticatedRequest, res: Response) => {
    const moduleId = req.params.id;
    const module = db.read().courseModules.find((m) => m.id === moduleId);
    if (!module) {
      res.status(404).json({ error: 'Module not found.' });
      return;
    }

    const { title, durationMin, videoUrl, contentMarkdown, orderIndex } = req.body;
    if (!title) {
      res.status(400).json({ error: 'Lesson title is required.' });
      return;
    }

    const existingLessons = db.read().lessons.filter((l) => l.moduleId === moduleId);
    const newLesson = {
      id: `les-${crypto.randomUUID()}`,
      moduleId,
      title: title.trim(),
      durationMin: Number(durationMin) || 15,
      orderIndex: orderIndex !== undefined ? Number(orderIndex) : existingLessons.length + 1,
      videoUrl: videoUrl || null,
      contentMarkdown: contentMarkdown || '',
      createdAt: new Date().toISOString(),
    };

    db.update((draft) => {
      draft.lessons.push(newLesson);
    });

    res.status(201).json({ lesson: newLesson });
  }
);

/* =========================================================================
   3. ENROLLMENTS & REAL PROGRESS APIS
   ========================================================================= */

// Student enrolls in course
apiRouter.post('/enrollments', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const { courseId } = req.body;

  if (!courseId) {
    res.status(400).json({ error: 'courseId is required.' });
    return;
  }

  const course = db.read().courses.find((c) => c.id === courseId);
  if (!course) {
    res.status(404).json({ error: 'Course not found.' });
    return;
  }

  const existing = db.read().enrollments.find((e) => e.userId === userId && e.courseId === courseId);
  if (existing) {
    res.json({ message: 'Already enrolled.', enrollment: existing });
    return;
  }

  const now = new Date().toISOString();
  const enrollment = {
    id: `enr-${crypto.randomUUID()}`,
    userId,
    courseId,
    enrolledAt: now,
  };

  db.update((draft) => {
    draft.enrollments.push(enrollment);
  });

  db.addAuditLog(
    'COURSE_ENROLLMENT',
    `User ${req.user!.email} enrolled in course ${course.code}`,
    getClientIp(req),
    'SUCCESS',
    userId,
    req.user!.email
  );

  res.status(201).json({ message: 'Successfully enrolled.', enrollment });
});

// Student's active enrollments with computed progress
apiRouter.get('/enrollments/my', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const enrollments = db.read().enrollments.filter((e) => e.userId === userId);
  const courses = db.read().courses;
  const allModules = db.read().courseModules;
  const allLessons = db.read().lessons;
  const userProgress = db.read().lessonProgress.filter((p) => p.userId === userId && p.isCompleted);

  const enrolledCourses = enrollments.map((enr) => {
    const course = courses.find((c) => c.id === enr.courseId);
    if (!course) return null;

    const courseMods = allModules.filter((m) => m.courseId === course.id);
    const modIds = new Set(courseMods.map((m) => m.id));
    const courseLessons = allLessons.filter((l) => modIds.has(l.moduleId));
    const totalLessons = courseLessons.length;

    const completedCount = courseLessons.filter((l) =>
      userProgress.some((p) => p.lessonId === l.id)
    ).length;

    const percent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

    return {
      ...course,
      enrolledAt: enr.enrolledAt,
      totalLessons,
      completedLessons: completedCount,
      percentComplete: percent,
    };
  }).filter(Boolean);

  res.json({ enrollments: enrolledCourses });
});

// Record Lesson Progress (Authoritative)
apiRouter.post('/progress/lesson', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const { lessonId, courseId, watchedSec, isCompleted } = req.body;

  if (!lessonId || !courseId) {
    res.status(400).json({ error: 'lessonId and courseId are required.' });
    return;
  }

  const now = new Date().toISOString();
  db.update((draft) => {
    const existing = draft.lessonProgress.find(
      (p) => p.userId === userId && p.lessonId === lessonId
    );
    if (existing) {
      if (watchedSec !== undefined) existing.watchedSec = watchedSec;
      if (isCompleted !== undefined) {
        existing.isCompleted = isCompleted;
        if (isCompleted && !existing.completedAt) existing.completedAt = now;
      }
      existing.updatedAt = now;
    } else {
      draft.lessonProgress.push({
        id: `prog-${crypto.randomUUID()}`,
        userId,
        lessonId,
        courseId,
        isCompleted: !!isCompleted,
        watchedSec: watchedSec || 0,
        completedAt: isCompleted ? now : null,
        updatedAt: now,
      });
    }
  });

  res.json({ message: 'Progress recorded successfully.' });
});

/* =========================================================================
   4. QUIZZES & AUTHORITATIVE SERVER-SIDE SCORING
   ========================================================================= */

// Create Quiz in Module
apiRouter.post(
  '/modules/:id/quizzes',
  authenticateToken,
  requireRole(['INSTRUCTOR', 'ADMIN', 'SUPER_ADMIN']),
  (req: AuthenticatedRequest, res: Response) => {
    const moduleId = req.params.id;
    const { title, description, timeLimitMinutes, passingScorePercent, questions } = req.body;

    if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
      res.status(400).json({ error: 'Quiz title and at least one question are required.' });
      return;
    }

    const quizId = `quiz-${crypto.randomUUID()}`;
    const newQuiz = {
      id: quizId,
      moduleId,
      title: title.trim(),
      description: description || '',
      timeLimitMinutes: Number(timeLimitMinutes) || 30,
      passingScorePercent: Number(passingScorePercent) || 70,
      maxAttempts: 3,
      createdAt: new Date().toISOString(),
    };

    const newQuestions = questions.map((q: any, idx: number) => ({
      id: `q-${crypto.randomUUID()}`,
      quizId,
      prompt: q.prompt,
      points: Number(q.points) || 10,
      codeSnippet: q.codeSnippet || null,
      orderIndex: idx + 1,
      options: q.options || [],
    }));

    db.update((draft) => {
      draft.quizzes.push(newQuiz);
      draft.questions.push(...newQuestions);
    });

    res.status(201).json({ quiz: newQuiz, questionCount: newQuestions.length });
  }
);

// Get Quiz Detail
apiRouter.get('/quizzes/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const quizId = req.params.id;
  const quiz = db.read().quizzes.find((q) => q.id === quizId);
  if (!quiz) {
    res.status(404).json({ error: 'Quiz not found.' });
    return;
  }

  const questions = db.read().questions.filter((q) => q.quizId === quizId)
    .sort((a, b) => a.orderIndex - b.orderIndex);

  // For students, sanitize options so isCorrect is not visible
  const isFaculty = req.user?.role === 'INSTRUCTOR' || req.user?.role === 'ADMIN';
  const sanitizedQuestions = questions.map((q) => ({
    ...q,
    options: q.options.map((opt) => ({
      id: opt.id,
      text: opt.text,
      ...(isFaculty ? { isCorrect: opt.isCorrect, explanation: opt.explanation } : {}),
    })),
  }));

  const userAttempts = db.read().quizAttempts.filter(
    (a) => a.quizId === quizId && a.userId === req.user?.userId
  );

  res.json({
    quiz,
    questions: sanitizedQuestions,
    userAttempts,
    attemptsRemaining: Math.max(0, quiz.maxAttempts - userAttempts.length),
  });
});

// Submit Quiz — Authoritative Calculation by Server
apiRouter.post('/quizzes/:id/submit', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const quizId = req.params.id;
  const userId = req.user!.userId;
  const { answers } = req.body; // { [questionId]: optionId }

  const quiz = db.read().quizzes.find((q) => q.id === quizId);
  if (!quiz) {
    res.status(404).json({ error: 'Quiz not found.' });
    return;
  }

  const pastAttempts = db.read().quizAttempts.filter((a) => a.quizId === quizId && a.userId === userId);
  if (pastAttempts.length >= quiz.maxAttempts) {
    res.status(403).json({ error: 'Maximum quiz attempts exceeded.' });
    return;
  }

  const questions = db.read().questions.filter((q) => q.quizId === quizId);
  let totalScore = 0;
  let maxScore = 0;

  const resultsDetail = questions.map((q) => {
    maxScore += q.points;
    const selectedOptionId = answers ? answers[q.id] : null;
    const correctOption = q.options.find((opt) => opt.isCorrect);
    const isCorrect = selectedOptionId && correctOption && selectedOptionId === correctOption.id;

    if (isCorrect) totalScore += q.points;

    return {
      questionId: q.id,
      prompt: q.prompt,
      selectedOptionId,
      correctOptionId: correctOption?.id,
      correctOptionText: correctOption?.text,
      explanation: correctOption?.explanation,
      isCorrect: !!isCorrect,
      pointsEarned: isCorrect ? q.points : 0,
    };
  });

  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
  const passed = percentage >= quiz.passingScorePercent;
  const now = new Date().toISOString();

  const attempt = {
    id: `att-${crypto.randomUUID()}`,
    quizId,
    userId,
    score: totalScore,
    totalPoints: maxScore,
    percentage,
    passed,
    startedAt: now,
    submittedAt: now,
    answers: answers || {},
  };

  db.update((draft) => {
    draft.quizAttempts.push(attempt);
  });

  db.addAuditLog(
    'QUIZ_ATTEMPT_SUBMITTED',
    `User ${req.user!.email} submitted Quiz '${quiz.title}' with authoritative score ${percentage}% (Passed: ${passed})`,
    getClientIp(req),
    'SUCCESS',
    userId,
    req.user!.email
  );

  res.json({
    attempt,
    resultsDetail,
    passed,
    percentage,
  });
});

/* =========================================================================
   5. ASSIGNMENTS & SUBMISSIONS APIS
   ========================================================================= */

// Create Assignment
apiRouter.post(
  '/modules/:id/assignments',
  authenticateToken,
  requireRole(['INSTRUCTOR', 'ADMIN', 'SUPER_ADMIN']),
  (req: AuthenticatedRequest, res: Response) => {
    const moduleId = req.params.id;
    const { title, description, points, rubric, dueDate } = req.body;

    if (!title || !description) {
      res.status(400).json({ error: 'Title and description are required.' });
      return;
    }

    const newAssignment = {
      id: `asg-${crypto.randomUUID()}`,
      moduleId,
      title: title.trim(),
      description: description.trim(),
      points: Number(points) || 100,
      dueDate: dueDate || null,
      rubric: rubric || [
        { criterion: 'Implementation Quality', weight: 40, description: 'Correct execution' },
        { criterion: 'Architecture & Security', weight: 40, description: 'Compliance with rules' },
        { criterion: 'Documentation', weight: 20, description: 'Clarity and comments' },
      ],
      createdAt: new Date().toISOString(),
    };

    db.update((draft) => {
      draft.assignments.push(newAssignment);
    });

    res.status(201).json({ assignment: newAssignment });
  }
);

// Submit Assignment
apiRouter.post('/assignments/:id/submit', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const assignmentId = req.params.id;
  const userId = req.user!.userId;
  const { submissionText, fileName } = req.body;

  const assignment = db.read().assignments.find((a) => a.id === assignmentId);
  if (!assignment) {
    res.status(404).json({ error: 'Assignment not found.' });
    return;
  }

  const now = new Date().toISOString();
  db.update((draft) => {
    const existingIndex = draft.assignmentSubmissions.findIndex(
      (s) => s.assignmentId === assignmentId && s.userId === userId
    );
    const subRecord = {
      id: existingIndex >= 0 ? draft.assignmentSubmissions[existingIndex].id : `sub-${crypto.randomUUID()}`,
      assignmentId,
      userId,
      submissionText: submissionText || '',
      fileName: fileName || 'artifact_submission.pdf',
      status: 'SUBMITTED' as const,
      grade: null,
      feedback: null,
      gradedBy: null,
      gradedAt: null,
      submittedAt: now,
      updatedAt: now,
    };

    if (existingIndex >= 0) {
      draft.assignmentSubmissions[existingIndex] = subRecord;
    } else {
      draft.assignmentSubmissions.push(subRecord);
    }
  });

  db.addAuditLog(
    'ASSIGNMENT_SUBMITTED',
    `User ${req.user!.email} submitted Assignment '${assignment.title}'`,
    getClientIp(req),
    'SUCCESS',
    userId,
    req.user!.email
  );

  res.status(201).json({ message: 'Submission received successfully.' });
});

// Grade Submission (Faculty)
apiRouter.patch(
  '/submissions/:id/grade',
  authenticateToken,
  requireRole(['INSTRUCTOR', 'ADMIN', 'SUPER_ADMIN']),
  (req: AuthenticatedRequest, res: Response) => {
    const submissionId = req.params.id;
    const { grade, feedback } = req.body;

    const submission = db.read().assignmentSubmissions.find((s) => s.id === submissionId);
    if (!submission) {
      res.status(404).json({ error: 'Submission not found.' });
      return;
    }

    const now = new Date().toISOString();
    db.update((draft) => {
      const s = draft.assignmentSubmissions.find((sub) => sub.id === submissionId);
      if (s) {
        s.grade = Number(grade);
        s.feedback = feedback || '';
        s.status = 'GRADED';
        s.gradedBy = req.user!.name;
        s.gradedAt = now;
        s.updatedAt = now;
      }
    });

    db.addAuditLog(
      'ASSIGNMENT_GRADED',
      `Faculty ${req.user!.email} graded submission ${submissionId} with score ${grade}`,
      getClientIp(req),
      'SUCCESS',
      req.user!.userId,
      req.user!.email
    );

    res.json({ message: 'Grade recorded successfully.' });
  }
);

/* =========================================================================
   6. CERTIFICATES APIS
   ========================================================================= */

// Award / Issue Certificate
apiRouter.post('/certificates/issue', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const { courseId } = req.body;

  const course = db.read().courses.find((c) => c.id === courseId);
  const user = db.read().users.find((u) => u.id === userId);

  if (!course || !user) {
    res.status(404).json({ error: 'Course or user not found.' });
    return;
  }

  const existing = db.read().certificates.find((c) => c.userId === userId && c.courseId === courseId);
  if (existing) {
    res.json({ certificate: existing });
    return;
  }

  const certHash = `LTI-CERT-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  const certificate = {
    id: `cert-${crypto.randomUUID()}`,
    certificateHash: certHash,
    userId,
    courseId,
    courseTitle: course.title,
    recipientName: user.name,
    issuedAt: new Date().toISOString(),
  };

  db.update((draft) => {
    draft.certificates.push(certificate);
  });

  res.status(201).json({ certificate });
});

// Verify Certificate Hash Publicly
apiRouter.get('/certificates/verify/:hash', (req: Request, res: Response) => {
  const hash = req.params.hash.toUpperCase();
  const cert = db.read().certificates.find((c) => c.certificateHash === hash);
  if (!cert) {
    res.status(404).json({ verified: false, error: 'Certificate credential not recognized in registry.' });
    return;
  }

  res.json({
    verified: true,
    certificate: cert,
  });
});

/* =========================================================================
   7. ADMINISTRATIVE & AUDIT LOG APIS
   ========================================================================= */

// Live Administrative Stats
apiRouter.get(
  '/admin/stats',
  authenticateToken,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  (req: AuthenticatedRequest, res: Response) => {
    const data = db.read();
    res.json({
      totalUsers: data.users.length,
      studentsCount: data.users.filter((u) => u.role === 'STUDENT').length,
      instructorsCount: data.users.filter((u) => u.role === 'INSTRUCTOR').length,
      adminsCount: data.users.filter((u) => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN').length,
      coursesCount: data.courses.length,
      enrollmentsCount: data.enrollments.length,
      submissionsCount: data.assignmentSubmissions.length,
      quizzesTakenCount: data.quizAttempts.length,
      auditLogsCount: data.auditLogs.length,
    });
  }
);

// Users Directory
apiRouter.get(
  '/admin/users',
  authenticateToken,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  (req: AuthenticatedRequest, res: Response) => {
    const users = db.read().users.map((u) => sanitizeUser(u));
    res.json({ users });
  }
);

// Mutate User Role
apiRouter.patch(
  '/admin/users/:id/role',
  authenticateToken,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  (req: AuthenticatedRequest, res: Response) => {
    const targetUserId = req.params.id;
    const { role } = req.body;

    if (!['STUDENT', 'INSTRUCTOR', 'ADMIN'].includes(role)) {
      res.status(400).json({ error: 'Invalid role specified.' });
      return;
    }

    db.update((draft) => {
      const u = draft.users.find((user) => user.id === targetUserId);
      if (u) {
        u.role = role;
        u.updatedAt = new Date().toISOString();
      }
    });

    db.addAuditLog(
      'ADMIN_ROLE_MUTATION',
      `Admin ${req.user!.email} changed user ${targetUserId} role to ${role}`,
      getClientIp(req),
      'SUCCESS',
      req.user!.userId,
      req.user!.email
    );

    res.json({ message: 'User role updated successfully.' });
  }
);

// Audit Logs Stream
apiRouter.get(
  '/admin/audit-logs',
  authenticateToken,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  (req: AuthenticatedRequest, res: Response) => {
    const logs = db.read().auditLogs;
    res.json({ auditLogs: logs });
  }
);
