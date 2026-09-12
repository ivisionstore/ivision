import type { CSSProperties, ReactNode } from 'react'

export default function CouponLayout({ children }: { children: ReactNode }) {
  const theme = {'--bg':'#06111a','--fg':'#f8fdff','--muted':'#9bb0bd','--line':'#17354a','--accent':'#25d9ff','--panel':'#0a1a26'} as CSSProperties
  return <div style={theme} className="min-h-screen bg-[var(--bg)] text-[var(--fg)] relative overflow-hidden">
    <div className="pointer-events-none fixed inset-0 z-0 opacity-60 bg-[radial-gradient(circle_at_80%_20%,rgba(37,217,255,.12),transparent_28%),radial-gradient(circle_at_15%_85%,rgba(0,154,255,.10),transparent_30%)]" />
    <header className="absolute top-0 left-0 right-0 z-20 px-5 py-5 sm:px-8 sm:py-7 flex justify-center lg:justify-start">
      <img src="/ivision-logo.svg" alt="IVISION" className="w-36 sm:w-44 h-auto" />
    </header>
    <div className="relative z-10">{children}</div>
  </div>
}
