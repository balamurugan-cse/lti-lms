/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { LMSProvider, useLMS } from './context/LMSContext';
import { Header } from './components/layout/Header';
import { StudentDashboard } from './components/dashboard/StudentDashboard';
import { CourseDiscovery } from './components/courses/CourseDiscovery';
import { InteractiveLessonView } from './components/learn/InteractiveLessonView';
import { AssignmentsView } from './components/assignments/AssignmentsView';
import { InstructorAdminPortal } from './components/admin/InstructorAdminPortal';
import { ProtectedAdminRoute } from './components/auth/ProtectedAdminRoute';
import { ArchitectureView } from './components/architecture/ArchitectureView';
import { QuizModal } from './components/assessment/QuizModal';
import { CertificateModal } from './components/certificates/CertificateModal';
import { AccessibilityModal } from './components/common/AccessibilityModal';

// Dedicated Login & Register Pages
import { StudentLoginPage } from './components/auth/StudentLoginPage';
import { StudentRegisterPage } from './components/auth/StudentRegisterPage';
import { InstructorLoginPage } from './components/auth/InstructorLoginPage';
import { InstructorRegisterPage } from './components/auth/InstructorRegisterPage';
import { AdminLoginPage } from './components/auth/AdminLoginPage';
import { AdminSetupPage } from './components/auth/AdminSetupPage';

const LMSMainContent: React.FC = () => {
  const { currentView, setCurrentView, navigate, highContrast, currentUser, isLoadingAuth } = useLMS();

  // Modals state
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [certificateCourseId, setCertificateCourseId] = useState<string | null>(null);
  const [showAccessibilityModal, setShowAccessibilityModal] = useState<boolean>(false);

  // Global keyboard shortcuts for WCAG AA compliance
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (targetTag === 'input' || targetTag === 'textarea' || targetTag === 'select') {
        return;
      }

      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setShowAccessibilityModal((prev) => !prev);
      } else if (e.key === 'Escape') {
        setActiveQuizId(null);
        setCertificateCourseId(null);
        setShowAccessibilityModal(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Dedicated Auth Views (Standalone, Full-page without normal app navigation overhead)
  const isAuthView =
    currentView === 'student-login' ||
    currentView === 'student-register' ||
    currentView === 'instructor-login' ||
    currentView === 'instructor-register' ||
    currentView === 'admin-login' ||
    currentView === 'admin-setup';

  return (
    <div
      className={`min-h-screen flex flex-col bg-slate-950 text-slate-100 transition-colors ${
        highContrast ? 'contrast-125' : ''
      }`}
    >
      {/* Top Header Navigation */}
      <Header
        onOpenAccessibilityModal={() => setShowAccessibilityModal(true)}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {isLoadingAuth && !isAuthView ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <span className="w-4 h-4 rounded-full bg-amber-400 animate-ping" />
            <span className="text-xs font-mono text-slate-400">Loading Session Claims...</span>
          </div>
        ) : (
          <>
            {/* Separate Dedicated Authentication Pages */}
            {currentView === 'student-login' && <StudentLoginPage onNavigate={navigate} />}
            {currentView === 'student-register' && <StudentRegisterPage onNavigate={navigate} />}
            {currentView === 'instructor-login' && <InstructorLoginPage onNavigate={navigate} />}
            {currentView === 'instructor-register' && <InstructorRegisterPage onNavigate={navigate} />}
            {currentView === 'admin-login' && <AdminLoginPage onNavigate={navigate} />}
            {currentView === 'admin-setup' && <AdminSetupPage onNavigate={navigate} />}

            {/* Core Application Views */}
            {currentView === 'dashboard' && (
              <StudentDashboard
                onOpenQuiz={(quizId) => setActiveQuizId(quizId)}
                onOpenCertificate={(courseId) => setCertificateCourseId(courseId)}
              />
            )}

            {(currentView === 'courses' || currentView === 'course-detail') && (
              <CourseDiscovery />
            )}

            {currentView === 'learn' && (
              <InteractiveLessonView
                onOpenQuiz={(quizId) => setActiveQuizId(quizId)}
                onOpenCertificate={(courseId) => setCertificateCourseId(courseId)}
              />
            )}

            {currentView === 'quizzes' && (
              <div className="space-y-6 pb-16">
                <div>
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded border border-amber-400/20">
                    Evaluation Center
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-2">
                    Assessments & Quizzes
                  </h1>
                  <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                    Evaluated by authoritative backend logic with timed limits, automated scoring, and detailed explanations.
                  </p>
                </div>
                <StudentDashboard
                  onOpenQuiz={(quizId) => setActiveQuizId(quizId)}
                  onOpenCertificate={(courseId) => setCertificateCourseId(courseId)}
                />
              </div>
            )}

            {currentView === 'assignments' && <AssignmentsView />}

            {currentView === 'admin-portal' && (
              <ProtectedAdminRoute requiredRoles={['ADMIN', 'SUPER_ADMIN']}>
                <InstructorAdminPortal portalMode="ADMIN" initialTab="overview" />
              </ProtectedAdminRoute>
            )}

            {currentView === 'instructor-portal' && (
              <InstructorAdminPortal portalMode="INSTRUCTOR" initialTab="builder" />
            )}

            {currentView === 'architecture' && <ArchitectureView />}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-slate-500 text-xs text-center mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-bold tracking-wider font-mono">
              LTI TECH LMS
            </span>
            <span>•</span>
            <span className="text-slate-400 font-mono">
              LEARN • THINK • INOVATE
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 text-[11px]">
            <button
              onClick={() => navigate('/courses')}
              className="hover:text-amber-400 transition-colors"
            >
              Courses
            </button>
            <span>•</span>
            <button
              onClick={() => navigate('/quizzes')}
              className="hover:text-amber-400 transition-colors"
            >
              Assessments
            </button>
            <span>•</span>
            <button
              onClick={() => navigate('/assignments')}
              className="hover:text-amber-400 transition-colors"
            >
              Assignments
            </button>
            <span>•</span>
            <button
              onClick={() => navigate('/architecture')}
              className="hover:text-amber-400 transition-colors"
            >
              Architecture Spec
            </button>
            <span>•</span>
            <button
              onClick={() => setShowAccessibilityModal(true)}
              className="hover:text-amber-400 transition-colors font-medium text-amber-400/90"
            >
              Accessibility & Theme
            </button>
            {currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN') && (
              <>
                <span>•</span>
                <button
                  onClick={() => navigate('/admin/portal')}
                  className="hover:text-amber-400 transition-colors text-amber-300 font-semibold"
                >
                  Admin Console
                </button>
              </>
            )}
          </div>
        </div>
      </footer>

      {/* Active Quiz Assessment Modal */}
      {activeQuizId && (
        <QuizModal
          quizId={activeQuizId}
          onClose={() => setActiveQuizId(null)}
          onViewCertificate={(courseId) => {
            setActiveQuizId(null);
            setCertificateCourseId(courseId);
          }}
        />
      )}

      {/* Verified Certificate Modal */}
      {certificateCourseId && (
        <CertificateModal
          courseId={certificateCourseId}
          onClose={() => setCertificateCourseId(null)}
        />
      )}

      {/* Accessibility & Shortcuts Modal */}
      {showAccessibilityModal && (
        <AccessibilityModal
          onClose={() => setShowAccessibilityModal(false)}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <LMSProvider>
      <LMSMainContent />
    </LMSProvider>
  );
}
