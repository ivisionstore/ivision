import type { CSSProperties, ReactNode } from 'react'

function IvisionLogo({ className = '' }: { className?: string }) {
  return <img src="/ivision-logo.svg" alt="Vision" className={`${className} object-contain`} />
}

export default function CouponLayout({ children }: { children: ReactNode }) {
  const theme = {'--bg':'#020b13','--fg':'#f5fbff','--muted':'#8ca8b9','--line':'#12354a','--accent':'#19d9ff','--accent2':'#168cff','--panel':'#061723'} as CSSProperties
  return <div style={theme} className="min-h-screen bg-[var(--bg)] text-[var(--fg)] relative overflow-hidden">
    <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_72%_16%,rgba(25,217,255,.14),transparent_24%),radial-gradient(circle_at_10%_85%,rgba(22,140,255,.11),transparent_30%)]" />
    <header className="relative z-20 px-5 py-4 sm:px-8 sm:py-6 border-b border-cyan-300/10 bg-[#020b13]/75 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <IvisionLogo className="w-32 sm:w-40 h-auto" />
        <div className="rounded-full border border-cyan-300/20 bg-white/[.03] px-3 py-1.5 text-[10px] sm:text-xs tracking-[.18em] uppercase text-cyan-200">IVISION STORES</div>
      </div>
    </header>
    <div className="relative z-10">{children}</div>
  </div>
}
