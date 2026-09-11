import { db, EmailLogRecord } from './db';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text: string;
  type: EmailLogRecord['type'];
  code?: string;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  simulated?: boolean;
  error?: string;
  code?: string;
}

class ProductionEmailService {
  private resendApiKey: string | undefined;
  private fromEmail: string;
  private appUrl: string;

  constructor() {
    this.resendApiKey = process.env.RESEND_API_KEY || process.env.EMAIL_API_KEY;
    this.fromEmail = process.env.EMAIL_FROM || 'LTI Tech LMS <onboarding@resend.dev>';
    this.appUrl = process.env.APP_URL || process.env.FRONTEND_URL || 'https://lti-lms-omega.vercel.app';
  }

  public getAppUrl(): string {
    return this.appUrl.replace(/\/$/, '');
  }

  private async dispatch(params: SendEmailParams): Promise<EmailResult> {
    const { to, subject, html, text, type, code } = params;
    const now = new Date().toISOString();

    // 1. If Resend API Key is available, dispatch live transactional email
    if (this.resendApiKey) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: this.fromEmail,
            to: [to],
            subject,
            html,
            text,
          }),
        });

        const data: any = await response.json().catch(() => ({}));

        if (response.ok && data.id) {
          db.update((draft) => {
            draft.emailLogs.unshift({
              id: `email-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              to,
              subject,
              type,
              code,
              previewText: text.substring(0, 160),
              sentAt: now,
              status: 'DELIVERED',
            });
            if (draft.emailLogs.length > 500) draft.emailLogs.pop();
          });

          return { success: true, messageId: data.id, simulated: false, code };
        } else {
          const errMessage = data.message || `Resend HTTP error ${response.status}`;
          console.warn(`[EmailService] Resend delivery failed for ${to}: ${errMessage}. Recording fallback simulation.`);
          
          db.update((draft) => {
            draft.emailLogs.unshift({
              id: `email-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              to,
              subject,
              type,
              code,
              previewText: text.substring(0, 160),
              sentAt: now,
              status: 'SIMULATED',
              error: errMessage,
            });
            if (draft.emailLogs.length > 500) draft.emailLogs.pop();
          });

          return { success: true, simulated: true, error: errMessage, code };
        }
      } catch (err: any) {
        console.error('[EmailService] Network exception contacting Resend:', err);
      }
    }

    // 2. Safe Simulated Environment Mode: Log in database and console
    db.update((draft) => {
      draft.emailLogs.unshift({
        id: `email-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        to,
        subject,
        type,
        code,
        previewText: text.substring(0, 160),
        sentAt: now,
        status: 'SIMULATED',
      });
      if (draft.emailLogs.length > 500) draft.emailLogs.pop();
    });

    console.log(`\n======================================================`);
    console.log(`[EMAIL DISPATCH] To: ${to} | Subject: ${subject}`);
    if (code) console.log(`[VERIFICATION CODE / RESET CODE]: >>> ${code} <<<`);
    console.log(`======================================================\n`);

    return { success: true, simulated: true, code };
  }

  // Common Header & Wrapper
  private wrapTemplate(content: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LTI Tech EduTech LMS</title>
  <style>
    body { margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0; }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 32px 20px; }
    .card { background-color: #131b2e; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.4); }
    .header-bar { height: 4px; background: linear-gradient(90deg, #f59e0b, #fbbf24, #38bdf8); }
    .content { padding: 36px 32px; }
    .brand { font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; margin-bottom: 24px; display: inline-flex; align-items: center; }
    .brand-accent { color: #f59e0b; }
    .code-box { background: #0f172a; border: 2px dashed #f59e0b; border-radius: 12px; padding: 20px; text-align: center; margin: 28px 0; }
    .code-digits { font-family: monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #fbbf24; }
    .btn { display: inline-block; background-color: #f59e0b; color: #020617 !important; font-weight: 700; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-size: 14px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 32px; font-size: 12px; color: #64748b; line-height: 1.6; }
    .muted { color: #94a3b8; font-size: 13px; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header-bar"></div>
      <div class="content">
        <div class="brand">LTI<span class="brand-accent">Tech</span> EduTech LMS</div>
        ${content}
      </div>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} LTI Tech / EduTech LMS. All rights reserved.</p>
      <p>This is an automated institutional message. Please do not reply directly to this email.</p>
    </div>
  </div>
</body>
</html>`;
  }

  // 1. Send Student / User Verification Email with 6-Digit Code
  public async sendVerificationEmail(to: string, name: string, code: string, token: string): Promise<EmailResult> {
    const subject = `[LTI LMS] ${code} is your student verification code`;
    const verifyUrl = `${this.getAppUrl()}/verify-email?code=${code}&email=${encodeURIComponent(to)}`;

    const html = this.wrapTemplate(`
      <h2 style="color: #ffffff; font-size: 22px; margin-top: 0;">Verify Your Student Account</h2>
      <p class="muted">Hello <strong>${name}</strong>,</p>
      <p class="muted">Thank you for registering at LTI Tech EduTech LMS. To activate your student portal access and enroll in courses, please enter the following 6-digit verification code:</p>
      
      <div class="code-box">
        <div style="font-size: 12px; text-transform: uppercase; color: #94a3b8; letter-spacing: 1px; margin-bottom: 8px;">Verification Security Code</div>
        <div class="code-digits">${code}</div>
        <div style="font-size: 11px; color: #64748b; margin-top: 8px;">Valid for 15 minutes • Single-use</div>
      </div>

      <p class="muted">You can also verify automatically by clicking the button below:</p>
      <div style="text-align: center;">
        <a href="${verifyUrl}" class="btn">Verify Student Account Now →</a>
      </div>

      <p class="muted" style="margin-top: 24px; font-size: 11px; color: #64748b;">
        If you did not initiate this registration request, please disregard this email. Your email address remains safe.
      </p>
    `);

    const text = `Hello ${name},\n\nYour LTI Tech EduTech LMS verification code is: ${code}\n\nThis code will expire in 15 minutes.\n\nAlternatively, verify your account here:\n${verifyUrl}\n\nIf you did not request this, please ignore this email.`;

    return this.dispatch({ to, subject, html, text, type: 'VERIFICATION', code });
  }

  // 2. Send Password Reset Email with 6-Digit Code
  public async sendPasswordResetEmail(to: string, name: string, code: string, token: string): Promise<EmailResult> {
    const subject = `[LTI LMS] ${code} is your password reset code`;
    const resetUrl = `${this.getAppUrl()}/reset-password?code=${code}&email=${encodeURIComponent(to)}`;

    const html = this.wrapTemplate(`
      <h2 style="color: #ffffff; font-size: 22px; margin-top: 0;">Password Reset Request</h2>
      <p class="muted">Hello <strong>${name}</strong>,</p>
      <p class="muted">We received a request to reset the password for your LTI Tech EduTech LMS account. Enter the 6-digit code below to set a new password:</p>

      <div class="code-box">
        <div style="font-size: 12px; text-transform: uppercase; color: #94a3b8; letter-spacing: 1px; margin-bottom: 8px;">Password Reset Code</div>
        <div class="code-digits">${code}</div>
        <div style="font-size: 11px; color: #64748b; margin-top: 8px;">Valid for 15 minutes • Single-use</div>
      </div>

      <div style="text-align: center;">
        <a href="${resetUrl}" class="btn">Reset Password Online →</a>
      </div>

      <p class="muted" style="margin-top: 24px; font-size: 11px; color: #64748b;">
        Security Notice: If you did not request a password reset, someone may have entered your email by mistake. Your account is still secure and no changes were made.
      </p>
    `);

    const text = `Hello ${name},\n\nYour LTI Tech LMS password reset code is: ${code}\n\nThis code expires in 15 minutes.\n\nReset your password at:\n${resetUrl}\n\nIf you did not request this, ignore this email.`;

    return this.dispatch({ to, subject, html, text, type: 'PASSWORD_RESET', code });
  }

  // 3. Send Welcome Email upon Account Activation
  public async sendWelcomeEmail(to: string, name: string, role: string): Promise<EmailResult> {
    const subject = `Welcome to LTI Tech LMS, ${name}!`;
    const dashboardUrl = `${this.getAppUrl()}/dashboard`;

    const html = this.wrapTemplate(`
      <h2 style="color: #ffffff; font-size: 22px; margin-top: 0;">Your Account is Active! 🎉</h2>
      <p class="muted">Hello <strong>${name}</strong>,</p>
      <p class="muted">Your ${role.toLowerCase()} account at LTI Tech EduTech LMS has been successfully verified and activated. You now have full access to:</p>
      
      <ul style="color: #cbd5e1; font-size: 13px; line-height: 1.8; padding-left: 20px;">
        <li>Interactive production courses and video syllabus</li>
        <li>Progress tracking, assignments, and automated code grading</li>
        <li>Institutional quizzes and verified certificates upon completion</li>
      </ul>

      <div style="text-align: center;">
        <a href="${dashboardUrl}" class="btn">Go to Your Dashboard →</a>
      </div>
    `);

    const text = `Hello ${name},\n\nYour ${role} account is now active on LTI Tech EduTech LMS!\n\nAccess your dashboard: ${dashboardUrl}`;

    return this.dispatch({ to, subject, html, text, type: 'WELCOME' });
  }

  // 4. Send Course Enrollment Email
  public async sendEnrollmentEmail(to: string, name: string, courseTitle: string, courseCode: string): Promise<EmailResult> {
    const subject = `Enrolled: ${courseTitle} (${courseCode})`;
    const courseUrl = `${this.getAppUrl()}/courses`;

    const html = this.wrapTemplate(`
      <h2 style="color: #ffffff; font-size: 22px; margin-top: 0;">Course Enrollment Confirmed 📚</h2>
      <p class="muted">Hello <strong>${name}</strong>,</p>
      <p class="muted">You have successfully enrolled in <strong>${courseTitle}</strong> (<code>${courseCode}</code>).</p>
      <p class="muted">You can begin watching lessons, reading module materials, and taking quizzes immediately.</p>

      <div style="text-align: center;">
        <a href="${courseUrl}" class="btn">Start Learning Now →</a>
      </div>
    `);

    const text = `Hello ${name},\n\nYou are now enrolled in ${courseTitle} (${courseCode}).\nAccess your course: ${courseUrl}`;

    return this.dispatch({ to, subject, html, text, type: 'ENROLLMENT' });
  }

  // 5. Send Grade Received Email
  public async sendGradeNotificationEmail(
    to: string,
    name: string,
    assignmentTitle: string,
    grade: number,
    feedback?: string
  ): Promise<EmailResult> {
    const subject = `Grade Published: ${assignmentTitle} (${grade}/100)`;
    const gradesUrl = `${this.getAppUrl()}/dashboard`;

    const html = this.wrapTemplate(`
      <h2 style="color: #ffffff; font-size: 22px; margin-top: 0;">Assignment Graded 📝</h2>
      <p class="muted">Hello <strong>${name}</strong>,</p>
      <p class="muted">Your submission for <strong>${assignmentTitle}</strong> has been reviewed and graded.</p>

      <div class="code-box" style="border-color: #38bdf8;">
        <div style="font-size: 12px; color: #94a3b8; margin-bottom: 4px;">Score Awarded</div>
        <div style="font-size: 32px; font-weight: 800; color: #38bdf8;">${grade} / 100</div>
        ${feedback ? `<div style="font-size: 13px; color: #cbd5e1; margin-top: 12px; font-style: italic;">"${feedback}"</div>` : ''}
      </div>

      <div style="text-align: center;">
        <a href="${gradesUrl}" class="btn">View Grade Report →</a>
      </div>
    `);

    const text = `Hello ${name},\n\nYour assignment "${assignmentTitle}" was graded: ${grade}/100.\n${feedback ? `Feedback: ${feedback}\n` : ''}View report: ${gradesUrl}`;

    return this.dispatch({ to, subject, html, text, type: 'GRADE' });
  }
}

export const emailService = new ProductionEmailService();
