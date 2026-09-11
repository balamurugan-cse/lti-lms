import React from 'react';
import { LTILogo } from './LTILogo';
import { GraduationCap, BookOpen, ShieldCheck, Home, ArrowLeft } from 'lucide-react';

interface NotFoundViewProps {
  onNavigate: (path: string) => void;
}

export const NotFoundView: React.FC<NotFoundViewProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg text-center space-y-6">
        <div className="flex justify-center mb-4">
          <LTILogo size="lg" showTagline={true} />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/20 text-xs font-mono font-bold">
          Error 404 • Resource Not Found
        </div>

        <h1 className="text-4xl font-extrabold text-white tracking-tight sm:text-5xl">
          Page Not Located
        </h1>

        <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
          The requested LMS route or institutional portal page does not exist or has been moved.
          Use the quick links below to return to your coursework or sign in.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 max-w-md mx-auto">
          <button
            type="button"
            onClick={() => onNavigate('/student/login')}
            className="p-3.5 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-400/10 hover:bg-amber-300 transition-all"
          >
            <GraduationCap className="w-4 h-4" />
            Student Sign In
          </button>

          <button
            type="button"
            onClick={() => onNavigate('/courses')}
            className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 hover:bg-slate-800 transition-all"
          >
            <BookOpen className="w-4 h-4 text-sky-400" />
            Browse Courses
          </button>

          <button
            type="button"
            onClick={() => onNavigate('/dashboard')}
            className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 hover:bg-slate-800 transition-all"
          >
            <Home className="w-4 h-4 text-emerald-400" />
            Student Dashboard
          </button>

          <button
            type="button"
            onClick={() => onNavigate('/admin/login')}
            className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 hover:bg-slate-800 transition-all"
          >
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            Administrator Portal
          </button>
        </div>

        <div className="pt-4">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="text-xs text-slate-500 hover:text-slate-300 inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Go Back to Previous Page
          </button>
        </div>
      </div>
    </div>
  );
};
