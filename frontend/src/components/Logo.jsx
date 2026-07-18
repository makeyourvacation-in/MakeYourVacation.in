/**
 * MakeYourVacation.in logo — luxury travel emblem.
 * Airplane trail arcing over navy mountains + gold palm on a rounded navy medallion.
 * Uses currentColor for the wordmark so the text colour can be overridden by className.
 */
export default function Logo({ size = 44, showWordmark = true, className = "", testId = "myv-logo" }) {
  return (
    <div data-testid={testId} className={`inline-flex items-center gap-3 ${className}`}>
      <LogoMark size={size} />
      {showWordmark && (
        <div className="leading-none">
          <div className="font-playfair text-lg md:text-xl font-semibold tracking-tight">
            <span>MakeYour</span>
            <span className="text-gold">Vacation</span>
          </div>
          <div className="text-[9px] md:text-[10px] font-montserrat uppercase tracking-[0.28em] mt-1 opacity-70">
            Luxury Travel · India
          </div>
        </div>
      )}
    </div>
  );
}

export function LogoMark({ size = 44 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 128 128"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="MakeYourVacation.in"
      role="img"
      className="flex-shrink-0"
    >
      <defs>
        <linearGradient id={`myv-ring-${size}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F0D46B" />
          <stop offset="1" stopColor="#D4AF37" />
        </linearGradient>
        <linearGradient id={`myv-bg-${size}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0A2A57" />
          <stop offset="1" stopColor="#071E3D" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="120" height="120" rx="26" fill={`url(#myv-bg-${size})`} />
      <rect x="10" y="10" width="108" height="108" rx="22" fill="none" stroke={`url(#myv-ring-${size})`} strokeWidth="1.5" opacity="0.9" />
      {/* Mountain */}
      <path d="M20 92 L44 60 L60 78 L74 62 L88 76 L108 92 Z" fill="#0F3468" />
      <path d="M44 60 L50 68 L46 74 Z" fill="#F7F7F7" opacity="0.85" />
      <path d="M74 62 L80 70 L76 76 Z" fill="#F7F7F7" opacity="0.9" />
      <path d="M20 92 L108 92" stroke="#D4AF37" strokeWidth="1.6" fill="none" opacity="0.95" />
      {/* Palm */}
      <g transform="translate(90 60)" fill="#D4AF37">
        <path d="M0 32 C-1 22 -1 12 -1 2 L1 2 C1 12 1 22 0 32 Z" />
        <path d="M-1 2 C-14 -4 -22 -1 -22 4 C-16 3 -8 4 -1 5 Z" />
        <path d="M1 2 C14 -4 22 -1 22 4 C16 3 8 4 1 5 Z" />
        <path d="M-1 2 C-8 -12 -14 -14 -18 -10 C-12 -8 -6 -3 -1 3 Z" />
        <path d="M1 2 C8 -12 14 -14 18 -10 C12 -8 6 -3 1 3 Z" />
        <path d="M0 2 C-2 -14 3 -20 8 -22 C4 -14 2 -8 0 3 Z" />
      </g>
      {/* Airplane trail */}
      <path d="M18 44 Q64 20 110 44" stroke="#D4AF37" strokeWidth="1.2" fill="none" strokeDasharray="1.5 3.5" opacity="0.75" />
      <g transform="translate(60 26) rotate(20)">
        <path d="M-14 0 L14 -2 L18 0 L14 2 L-14 0 Z M-8 -0.5 L-4 -6 L-2 -5.5 L-6 -0.5 Z M-8 0.5 L-4 6 L-2 5.5 L-6 0.5 Z M6 -0.5 L10 -3 L11 -2.5 L8 -0.5 Z" fill="#F7F7F7" />
        <circle cx="14" cy="0" r="1.6" fill="#D4AF37" />
      </g>
      {/* Monogram */}
      <text x="64" y="112" fontFamily="'Playfair Display', Georgia, serif" fontSize="14" fontWeight="700" textAnchor="middle" fill="#D4AF37" letterSpacing="4">MYV</text>
    </svg>
  );
}
