import React, { useState } from 'react';
import { useLMS } from '../../context/LMSContext';
import {
  Shield,
  Layers,
  Server,
  Database,
  Lock,
  Key,
  Terminal,
  CheckCircle2,
  FileText,
  Workflow,
  Cpu,
  Globe,
  ExternalLink,
} from 'lucide-react';

export const ArchitectureView: React.FC = () => {
  const { auditLogs } = useLMS();
  const [activeTab, setActiveTab] = useState<'diagram' | 'schema' | 'security' | 'prompt'>('diagram');

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded border border-amber-400/20">
            LTI Tech Engineering Specification
          </span>
          <span className="text-xs text-slate-400 font-mono">
            Document Version: 2026.1-PROD
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          LTI Tech / EduTech LMS Architecture Specification
        </h1>
        <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
          Full production-ready architecture blueprint matching the master development specification: Decoupled service tiers, normalized PostgreSQL relational model, dual-token rotation, and zero-trust RBAC.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        {[
          { id: 'diagram', label: 'System Architecture Diagram', icon: Workflow },
          { id: 'schema', label: 'Database Relational ER Schema', icon: Database },
          { id: 'security', label: 'Security & Token Rotation', icon: Shield },
          { id: 'prompt', label: 'Master Architecture Rules', icon: FileText },
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

      {/* Tab 1: System Diagram */}
      {activeTab === 'diagram' && (
        <div className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
          <div>
            <h3 className="text-base font-bold text-white">
              Recommended High-Level Architecture (PDF Page 5 Representation)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Stateless presentation tier, secured REST API gateway, authoritative PostgreSQL, and private S3 object storage with expiring signed URLs.
            </p>
          </div>

          {/* Graphical Flow Architecture */}
          <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 space-y-6">
            <div className="flex flex-col items-center gap-4">
              {/* Client Tier */}
              <div className="w-full max-w-md p-4 rounded-xl bg-slate-900 border border-amber-400/40 text-center shadow-lg">
                <div className="flex items-center justify-center gap-2 text-amber-400 text-xs font-mono font-bold uppercase mb-1">
                  <Globe className="w-4 h-4" />
                  <span>Internet / HTTPS / CDN Edge</span>
                </div>
                <h4 className="text-sm font-bold text-white">Frontend Client Host</h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  React 19, TypeScript, Tailwind CSS, TanStack Query, WCAG 2.1 AA Accessible UI
                </p>
              </div>

              <div className="h-6 w-0.5 bg-amber-400/60" />

              {/* REST API & RBAC */}
              <div className="w-full max-w-lg p-4 rounded-xl bg-slate-900 border border-sky-400/40 text-center shadow-lg">
                <div className="flex items-center justify-center gap-2 text-sky-400 text-xs font-mono font-bold uppercase mb-1">
                  <Server className="w-4 h-4" />
                  <span>REST API Gateway • Auth & RBAC Guards</span>
                </div>
                <h4 className="text-sm font-bold text-white">Node.js / Express / NestJS Core</h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Argon2id Hash Verification, Short-Lived JWT (15m), Refresh Session Rotation, Rate Limiting & Helmet
                </p>
              </div>

              <div className="flex items-center gap-12 sm:gap-24 w-full max-w-lg justify-center">
                <div className="h-6 w-0.5 bg-sky-400/60" />
                <div className="h-6 w-0.5 bg-sky-400/60" />
              </div>

              {/* Data & Storage Tiers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl">
                <div className="p-4 rounded-xl bg-slate-900 border border-emerald-400/40 text-center shadow-lg">
                  <div className="flex items-center justify-center gap-2 text-emerald-400 text-xs font-mono font-bold uppercase mb-1">
                    <Database className="w-4 h-4" />
                    <span>Authoritative DB</span>
                  </div>
                  <h4 className="text-sm font-bold text-white">PostgreSQL + Prisma ORM</h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Normalized 3NF relational schemas, composite unique constraints, automated daily backups
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-purple-400/40 text-center shadow-lg">
                  <div className="flex items-center justify-center gap-2 text-purple-400 text-xs font-mono font-bold uppercase mb-1">
                    <Lock className="w-4 h-4" />
                    <span>Private Asset Storage</span>
                  </div>
                  <h4 className="text-sm font-bold text-white">S3-Compatible Object Store</h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Private buckets, pre-signed GET/PUT URLs with expiring tokens, video CDN delivery
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Schema */}
      {activeTab === 'schema' && (
        <div className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 font-mono text-xs">
          <div>
            <h3 className="text-base font-bold text-white font-sans">
              Normalized PostgreSQL Database Model (Section 5 Schema)
            </h3>
            <p className="text-xs text-slate-400 mt-1 font-sans">
              Primary entity relationships defined with UUIDs, foreign keys, cascade policies, and composite indexes.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 overflow-x-auto text-slate-300 leading-relaxed">
            <pre className="text-amber-300/90">{`// Production Prisma Schema DDL
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id              String           @id @default(uuid())
  email           String           @unique
  passwordHash    String
  name            String
  role            Role             @default(STUDENT)
  studentProfile  StudentProfile?
  instructorProfile InstructorProfile?
  enrollments     Enrollment[]
  quizAttempts    QuizAttempt[]
  submissions     AssignmentSubmission[]
  refreshSessions RefreshSession[]
  createdAt       DateTime         @default(now())
}

enum Role {
  STUDENT
  INSTRUCTOR
  ADMIN
  SUPER_ADMIN
}

model Course {
  id              String           @id @default(uuid())
  code            String           @unique
  title           String
  description     String
  level           String
  modules         CourseModule[]
  enrollments     Enrollment[]
  createdAt       DateTime         @default(now())
}

model Enrollment {
  id          String    @id @default(uuid())
  userId      String
  courseId    String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  course      Course    @relation(fields: [courseId], references: [id], onDelete: Restrict)
  enrolledAt  DateTime  @default(now())

  @@unique([userId, courseId])
  @@index([userId])
  @@index([courseId])
}`}</pre>
          </div>
        </div>
      )}

      {/* Tab 3: Security */}
      {activeTab === 'security' && (
        <div className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
          <div>
            <h3 className="text-base font-bold text-white">
              Critical LMS Security Principles (Section 15 Architecture)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Zero mock bypasses, verified server-side authorizations, and credential isolation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-mono font-bold uppercase">
                <Key className="w-4 h-4" />
                <span>Dual-Token Authentication Lifecycle</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Short-lived JWT access tokens (15-minute validity) are verified in memory. Long-lived refresh tokens are stored hashed in PostgreSQL with parent family IDs. Token reuse immediately revokes the entire family to defeat credential stuffing.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-sky-400 text-xs font-mono font-bold uppercase">
                <Shield className="w-4 h-4" />
                <span>Insecure Direct Object Reference (IDOR) Defense</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Never trust client-supplied user IDs or course IDs. All gradebook queries, submission downloads, and progress mutations verify session identity against the PostgreSQL enrollment ownership record.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold uppercase">
                <Server className="w-4 h-4" />
                <span>Authoritative Progress & Scoring</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Assessment grading and certificate unlock eligibility are calculated exclusively server-side. Frontend completion percentages are treated as read-only projections of database state.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-purple-400 text-xs font-mono font-bold uppercase">
                <Lock className="w-4 h-4" />
                <span>Private Object Storage & Signed URLs</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Lecture videos, starter zip archives, and student homework uploads are kept in private S3 buckets. Ephemeral signed URLs (300s TTL) are minted only after authorizing the student’s enrollment status.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Prompt Architecture Rules */}
      {activeTab === 'prompt' && (
        <div className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 text-xs text-slate-300 leading-relaxed">
          <h3 className="text-base font-bold text-white font-mono uppercase text-amber-400">
            Master Development Architecture Contract
          </h3>
          <p>
            This system strictly enforces the production rules outlined in the attached PDF:
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-300">
            <li>
              <strong>No Mock Data Bypasses:</strong> All statistics, lesson completions, quiz attempts, and assignments link to the persistent LMS state engine.
            </li>
            <li>
              <strong>Strict RBAC:</strong> STUDENT, INSTRUCTOR, and ADMIN role permissions are guarded across all views and API contracts.
            </li>
            <li>
              <strong>Dark Mode & Brand Alignment:</strong> Styled to mirror the LTI Tech monogram logo with vibrant amber/yellow glow on deep obsidian dark background, while supporting clean light mode.
            </li>
            <li>
              <strong>WCAG 2.1 AA Compliance:</strong> Full keyboard shortcuts, high-contrast states, and accessible dialogs.
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};
