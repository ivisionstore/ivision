import type { CSSProperties, ReactNode } from 'react'

function IvisionLogo({ className = '' }: { className?: string }) {
  return <img src="/ivision-logo.svg" alt="Vision" className={`${className} object-contain`} />
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
