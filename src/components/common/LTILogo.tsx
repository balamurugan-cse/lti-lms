import React from 'react';

interface LTILogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  className?: string;
}

export const LTILogo: React.FC<LTILogoProps> = ({
  size = 'md',
  showTagline = true,
  className = '',
}) => {
  const dimensions = {
    sm: { box: 28, text: 'text-[9px] tracking-[0.2em]', gap: 'gap-1.5' },
    md: { box: 40, text: 'text-[11px] tracking-[0.25em]', gap: 'gap-2' },
    lg: { box: 56, text: 'text-[13px] tracking-[0.3em]', gap: 'gap-2.5' },
    xl: { box: 76, text: 'text-[15px] tracking-[0.35em]', gap: 'gap-3' },
  }[size];

  return (
    <div className={`inline-flex flex-col items-center select-none ${dimensions.gap} ${className}`}>
      {/* Monogram Glyph Icon */}
      <div 
        className="relative flex items-center justify-center p-1 rounded-xl bg-slate-950/80 border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.15)] transition-all hover:border-amber-400/40 hover:shadow-[0_0_25px_rgba(245,158,11,0.3)]"
        style={{ width: dimensions.box * 1.25, height: dimensions.box * 1.25 }}
      >
        <svg
          viewBox="0 0 120 120"
          className="w-full h-full drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Subtle glow filter */}
          <defs>
            <filter id="ltiGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <linearGradient id="ltiGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FDE047" />
              <stop offset="60%" stopColor="#FACC15" />
              <stop offset="100%" stopColor="#EAB308" />
            </linearGradient>
          </defs>

          {/* Combined Stylized 'L' & 'T' Golden Glyph matching screenshot */}
          {/* Top T-bar and stem */}
          <path
            d="M20 22 H80 V36 H57 V62 H78 V76 H43 V36 H20 Z"
            fill="url(#ltiGold)"
            filter="url(#ltiGlow)"
          />
          {/* Left and lower L-shape wrapping around */}
          <path
            d="M20 42 H31 V84 H78 V98 H20 Z"
            fill="url(#ltiGold)"
            filter="url(#ltiGlow)"
          />

          {/* White 'I' vertical pillar on the right */}
          <rect
            x="88"
            y="42"
            width="13"
            height="56"
            rx="2.5"
            fill="#FFFFFF"
            className="drop-shadow-[0_0_6px_rgba(255,255,255,0.7)]"
          />
        </svg>
      </div>

      {/* Brand Tagline in gold/yellow as shown in screenshot: LEARN • THINK • INOVATE */}
      {showTagline && (
        <div className={`font-semibold text-amber-400 dark:text-amber-300 uppercase ${dimensions.text} font-mono flex items-center justify-center gap-1.5 drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]`}>
          <span>LEARN</span>
          <span className="text-amber-500 font-bold">•</span>
          <span>THINK</span>
          <span className="text-amber-500 font-bold">•</span>
          <span>INOVATE</span>
        </div>
      )}
    </div>
  );
};
