import type { CSSProperties, ReactNode } from 'react'

function IvisionLogo({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 420 150" role="img" aria-label="IVISION logo" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ivision-admin-logo-gradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#8ff8ff"/><stop offset="0.55" stopColor="#27d9ff"/><stop offset="1" stopColor="#0aa7e8"/></linearGradient>
        <filter id="ivision-admin-logo-glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <g transform="translate(8 8)" fill="none" stroke="url(#ivision-admin-logo-gradient)" strokeWidth="8" strokeLinecap="round" filter="url(#ivision-admin-logo-glow)">
        <path d="M54 9c-25 0-45 20-45 45 0 15 4 27 12 38"/><path d="M54 20c-19 0-34 15-34 34 0 18 7 31 15 40"/><path d="M54 32c-12 0-22 10-22 22 0 17 7 29 13 36"/><path d="M54 44c-6 0-11 5-11 11 0 17 6 26 11 33"/>
        <path d="M54 9c25 0 45 20 45 45 0 12-3 23-9 33"/><path d="M54 20c19 0 34 15 34 34 0 13-3 23-9 32"/><path d="M54 32c12 0 22 10 22 22 0 11-2 20-7 28"/><path d="M54 44c6 0 11 5 11 11 0 10-2 18-6 25"/><path d="M54 55v37"/>
      </g>
      <text x="116" y="104" fill="#ffffff" fontFamily="Arial,Helvetica,sans-serif" fontSize="78" fontWeight="700" letterSpacing="-5">Vision</text>
    </svg>
  )
}

export default function CouponAdminLayout({ children }: { children: ReactNode }) {
  const theme = {'--bg':'#020b13','--fg':'#f5fbff','--muted':'#8ca8b9','--line':'#12354a','--accent':'#19d9ff','--accent2':'#168cff','--panel':'#061723'} as CSSProperties
  return <div style={theme} className="min-h-screen bg-[var(--bg)] text-[var(--fg)] relative overflow-hidden">
    <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_78%_5%,rgba(25,217,255,.13),transparent_22%),radial-gradient(circle_at_8%_90%,rgba(22,140,255,.09),transparent_30%)]" />
    <header className="relative z-20 border-b border-cyan-300/10 bg-[#020b13]/80 backdrop-blur-xl px-5 py-4 sm:px-8">
      <div className="max-w-[1400px] mx-auto flex items-center justify-between">
        <IvisionLogo className="w-32 sm:w-40 h-auto" />
        <span className="hidden sm:inline-flex rounded-full border border-cyan-300/20 bg-white/[.03] px-4 py-2 text-xs tracking-[.18em] uppercase text-cyan-200">Secure Admin</span>
      </div>
    </header>
    <div className="relative z-10">{children}</div>
  </div>
}
