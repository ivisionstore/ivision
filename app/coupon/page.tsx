'use client'

import { FormEvent, useMemo, useState } from 'react'
import { CheckCircle2, Copy, Gift, Loader2, Phone, ShieldCheck } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { supabaseBrowser } from '../../lib/supabase/client'

export default function CouponPage() {
  const supabase = useMemo(() => supabaseBrowser(), [])
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState<string | null>(null)
  const [discount, setDiscount] = useState('')
  const [endsAt, setEndsAt] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const campaign = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('campaign') || 'september-10'

  async function claim(e: FormEvent) {
    e.preventDefault(); setError(''); setBusy(true); setCode(null)
    const { data, error } = await supabase.rpc('claim_coupon', { p_campaign_slug: campaign, p_phone: phone })
    setBusy(false)
    if (error) { setError(error.message.replace('Failed to fetch','Please try again.')); return }
    const row = Array.isArray(data) ? data[0] : data
    if (!row?.code) { setError('No coupon is available right now.'); return }
    setCode(row.code); setDiscount(row.discount_text); setEndsAt(row.ends_at)
  }

  async function copyCode() {
    if (!code) return
    await navigator.clipboard?.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500)
  }

  return <main className="min-h-[calc(100vh-78px)] px-5 py-8 md:px-8 md:py-12">
    <div className="max-w-6xl mx-auto">
      {!code ? <>
        <section className="grid lg:grid-cols-[1.05fr_.95fr] gap-6 items-stretch">
          <div className="rounded-[2rem] border border-cyan-300/20 bg-[var(--panel)]/90 p-7 sm:p-10 shadow-[0_20px_80px_rgba(0,0,0,.35)] backdrop-blur-xl">
            <p className="text-xs tracking-[.28em] text-[var(--accent)] uppercase font-semibold">Exclusive offer</p>
            <h1 className="mt-4 text-4xl sm:text-6xl font-black tracking-tight leading-[.98]">Get Your Discount <span className="text-[var(--accent)]">Coupon</span></h1>
            <p className="mt-5 max-w-xl text-[var(--muted)] text-base sm:text-lg leading-7">Enter your mobile number to receive your exclusive discount coupon.</p>
            <form onSubmit={claim} className="mt-8">
              <label className="sr-only" htmlFor="phone">Mobile number</label>
              <div className="flex items-center gap-3 rounded-full border border-cyan-300/35 bg-[#03101a] px-5 py-4 shadow-[0_0_28px_rgba(25,217,255,.08)] focus-within:border-[var(--accent)]">
                <Phone size={19} className="text-[var(--accent)]" />
                <input id="phone" type="tel" dir="ltr" maxLength={11} value={phone} onChange={e=>setPhone(e.target.value.replace(/\D/g,'').slice(0,11))} inputMode="numeric" autoComplete="tel" placeholder="Mobile Number" className="w-full bg-transparent outline-none text-base placeholder:text-slate-500" required />
              </div>
              <button disabled={busy} className="mt-4 w-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 py-4 font-extrabold text-base flex items-center justify-center gap-2 shadow-[0_12px_35px_rgba(25,180,255,.25)] disabled:opacity-60">{busy?<><Loader2 className="animate-spin" size={18}/>Generating...</>:<><Gift size={19}/>Get Coupon</>}</button>
              {error&&<p className="mt-4 text-sm text-red-300">{error}</p>}
            </form>
            <div className="mt-8 grid grid-cols-3 border-t border-cyan-300/10 pt-6">
              {[['Exclusive','Discounts'],['Verified','Customers'],['Easy','Redeem']].map(([a,b])=><div key={a} className="text-center px-2"><div className="mx-auto w-10 h-10 rounded-xl border border-cyan-300/20 bg-cyan-300/5 flex items-center justify-center text-[var(--accent)]"><ShieldCheck size={20}/></div><p className="mt-2 text-xs sm:text-sm font-semibold">{a}<br/>{b}</p></div>)}
            </div>
          </div>
          <div className="relative min-h-[420px] rounded-[2rem] border border-cyan-300/10 bg-[radial-gradient(circle_at_50%_45%,rgba(25,217,255,.22),transparent_35%),linear-gradient(145deg,#061b2a,#020b13)] overflow-hidden flex items-center justify-center">
            <div className="absolute w-[420px] h-[420px] rounded-full border border-cyan-300/15 shadow-[0_0_100px_rgba(25,217,255,.14)]" />
            <div className="absolute w-[330px] h-[330px] rounded-full border border-cyan-300/10" />
            <div className="relative w-48 h-[350px] rounded-[2.2rem] border-2 border-cyan-200/45 bg-[#02070c] rotate-[9deg] shadow-[0_0_65px_rgba(25,217,255,.28)] flex items-center justify-center">
              <div className="absolute top-3 w-20 h-5 rounded-full bg-black border border-white/10" />
              <div className="w-24 h-24 rounded-full bg-cyan-300/10 border border-cyan-300/30 flex items-center justify-center text-cyan-300 shadow-[0_0_45px_rgba(25,217,255,.28)]"><span className="text-4xl">◉</span></div>
              <span className="absolute bottom-16 text-3xl font-black tracking-tight">IVision</span>
            </div>
            <p className="absolute bottom-7 left-8 text-[10px] tracking-[.3em] uppercase text-cyan-300 font-semibold">Smart choices. Better living.</p>
          </div>
        </section>
      </> : <section className="rounded-[2rem] border border-cyan-300/20 bg-[var(--panel)]/95 p-6 sm:p-10 shadow-[0_20px_80px_rgba(0,0,0,.35)]">
        <div className="flex flex-col lg:flex-row gap-8 lg:items-center">
          <div className="shrink-0 mx-auto lg:mx-0 rounded-3xl bg-white p-5 shadow-[0_0_35px_rgba(25,217,255,.18)]"><QRCodeSVG value={code} size={190} includeMargin/></div>
          <div className="flex-1">
            <div className="flex items-center gap-2 text-cyan-300 text-sm font-semibold"><CheckCircle2 size={18}/>Your Discount Coupon</div>
            <div className="mt-4 rounded-2xl border border-cyan-300/30 bg-[#03101a] px-5 py-4 flex items-center justify-between gap-4"><span className="text-3xl sm:text-4xl font-black tracking-wider text-cyan-300 break-all">{code}</span><button onClick={copyCode} className="shrink-0 inline-flex items-center gap-2 rounded-xl border border-cyan-300/20 px-3 py-2 text-sm"> <Copy size={15}/>{copied?'Copied':'Copy'}</button></div>
            <div className="mt-5 grid sm:grid-cols-3 gap-3 text-sm"><div className="rounded-2xl border border-cyan-300/10 bg-white/[.02] p-4"><span className="text-cyan-300">Discount</span><div className="mt-1 font-bold">{discount}</div></div><div className="rounded-2xl border border-cyan-300/10 bg-white/[.02] p-4"><span className="text-cyan-300">Valid Until</span><div className="mt-1 font-bold">{endsAt ? new Date(endsAt).toLocaleDateString('en-GB',{day:'2-digit',month:'long',year:'numeric'}) : '30 September 2026'}</div></div><div className="rounded-2xl border border-cyan-300/10 bg-white/[.02] p-4"><span className="text-cyan-300">Campaign</span><div className="mt-1 font-bold">September 10% Campaign</div></div></div>
            <p className="mt-6 text-sm text-[var(--muted)]">Show this QR code or coupon code to an IVISION team member at checkout.</p>
          </div>
        </div>
      </section>}
      <p className="text-center mt-7 text-xs tracking-[.18em] uppercase text-[var(--muted)]">One unique coupon per mobile number · IVISION STORES</p>
    </div>
  </main>
}
