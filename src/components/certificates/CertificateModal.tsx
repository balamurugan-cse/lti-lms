import React from 'react';
import { useLMS } from '../../context/LMSContext';
import { LTILogo } from '../common/LTILogo';
import { X, Award, ShieldCheck, Download, Printer, CheckCircle } from 'lucide-react';

interface CertificateModalProps {
  courseId: string;
  onClose: () => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  courseId,
  onClose,
}) => {
  const { courses, currentUser, courseProgress } = useLMS();

  const course = courses.find((c) => c.id === courseId) || courses[0];

  if (!course) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
        <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 text-center space-y-4">
          <Award className="w-10 h-10 text-amber-400 mx-auto" />
          <h3 className="text-base font-bold text-white">Certificate Unavailable</h3>
          <p className="text-xs text-slate-400">
            Unable to locate course information to render graduation certificate.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const progress = courseProgress[course.id];
  const certId = progress?.certificateId || 'LTI-CERT-VERIFIED';
  const issueDate = progress?.issuedDate
    ? new Date(progress.issuedDate).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl bg-slate-900 border border-amber-500/40 shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors z-20"
          aria-label="Close Certificate Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Certificate Canvas Frame */}
        <div className="relative p-8 sm:p-12 rounded-xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-4 border-amber-400/50 shadow-inner text-center space-y-6">
          {/* Subtle Watermark background */}
          <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
            <LTILogo size="xl" showTagline={false} />
          </div>

          {/* Certificate Header */}
          <div className="relative z-10 flex flex-col items-center gap-2">
            <LTILogo size="md" showTagline={true} />
            <span className="text-xs font-mono uppercase tracking-[0.3em] text-amber-400 font-bold mt-2">
              Certificate of Architectural Mastery
            </span>
          </div>

          {/* Recipient */}
          <div className="relative z-10 space-y-1">
            <p className="text-xs text-slate-400 uppercase tracking-widest font-mono">
              This is officially awarded to
            </p>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-wide font-serif">
              {currentUser.name}
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Student Credential ID: {currentUser.studentId || 'LTI-STU-81829'}
            </p>
          </div>

          {/* Achievement Description */}
          <div className="relative z-10 max-w-xl mx-auto space-y-2">
            <p className="text-xs text-slate-300 leading-relaxed">
              for successfully completing all curriculum modules, authoring production database schemas, and passing rigorous server-side architectural assessments in
            </p>
            <h3 className="text-base sm:text-xl font-bold text-amber-300">
              {course.title} ({course.code})
            </h3>
            <p className="text-[11px] text-slate-400">
              Curriculum validated by LTI Tech Engineering Faculty & Cloud Standards Board.
            </p>
          </div>

          {/* Signatures & Hash Verification Bar */}
          <div className="relative z-10 pt-6 border-t border-slate-800 grid grid-cols-2 gap-6 items-end">
            <div className="text-left">
              <div className="font-serif italic text-amber-400 text-lg sm:text-xl font-bold">
                Sophia Sterling
              </div>
              <div className="text-[10px] text-slate-400 font-mono uppercase">
                Dr. Sophia Sterling • Principal Cloud Architect
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                Date: {issueDate}
              </div>
            </div>

            <div className="text-right">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-400/10 border border-amber-400/30 text-amber-400 text-[10px] font-mono">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>VERIFIED AUTHENTIC</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-1">
                Verification Hash: {certId}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            Immutable record stored in LTI Tech credentials ledger
          </span>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-md transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
