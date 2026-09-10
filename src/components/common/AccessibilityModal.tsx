import React from 'react';
import { useLMS } from '../../context/LMSContext';
import { X, Eye, Keyboard, Sun, Moon, Type, Sparkles } from 'lucide-react';

interface AccessibilityModalProps {
  onClose: () => void;
}

export const AccessibilityModal: React.FC<AccessibilityModalProps> = ({ onClose }) => {
  const {
    darkMode,
    toggleDarkMode,
    highContrast,
    setHighContrast,
    fontSize,
    setFontSize,
    reducedMotion,
    setReducedMotion,
  } = useLMS();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-400/10 text-amber-400">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Accessibility Preferences (WCAG 2.1 AA)
              </h2>
              <p className="text-xs text-slate-400">
                Live compliance tools for contrast, scale, animations & keyboard navigation
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preferences Grid */}
        <div className="space-y-4">
          {/* Dark / Light Mode */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                {darkMode ? <Moon className="w-4 h-4 text-amber-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                Theme Display
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Current: {darkMode ? 'Obsidian Dark (LTI Brand)' : 'Porcelain Light'}
              </p>
            </div>
            <button
              onClick={toggleDarkMode}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors whitespace-nowrap"
            >
              Switch to {darkMode ? 'Light' : 'Dark'}
            </button>
          </div>

          {/* High Contrast Mode */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <Eye className="w-4 h-4 text-amber-400" />
                Enhanced Contrast Mode
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Boosts text contrast ratio to exceed 7:1 (WCAG AAA)
              </p>
            </div>
            <button
              onClick={() => setHighContrast(!highContrast)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                highContrast
                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              {highContrast ? 'Enabled (Active)' : 'Enable'}
            </button>
          </div>

          {/* Font Size Scaling */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <Type className="w-4 h-4 text-amber-400" />
                Display Text Size
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Adjust typography scaling for comfortable reading
              </p>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setFontSize('normal')}
                className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
                  fontSize === 'normal'
                    ? 'bg-amber-400 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                100%
              </button>
              <button
                onClick={() => setFontSize('large')}
                className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
                  fontSize === 'large'
                    ? 'bg-amber-400 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                112%
              </button>
              <button
                onClick={() => setFontSize('xlarge')}
                className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
                  fontSize === 'xlarge'
                    ? 'bg-amber-400 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                125%
              </button>
            </div>
          </div>

          {/* Reduced Motion */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Reduced Motion
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Minimizes background animations and rapid UI transitions
              </p>
            </div>
            <button
              onClick={() => setReducedMotion(!reducedMotion)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                reducedMotion
                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              {reducedMotion ? 'Enabled (Active)' : 'Enable'}
            </button>
          </div>
        </div>

        {/* Keyboard Shortcuts Reference */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase font-mono">
            <Keyboard className="w-4 h-4 text-amber-400" />
            <span>Essential Keyboard Shortcuts:</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Play / Pause Video</span>
              <kbd className="px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                Space
              </kbd>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Rewind 10 Sec</span>
              <kbd className="px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                ←
              </kbd>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Forward 10 Sec</span>
              <kbd className="px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                →
              </kbd>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Toggle Mute</span>
              <kbd className="px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                M
              </kbd>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
