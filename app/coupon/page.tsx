'use client'

import { FormEvent, useMemo, useState } from 'react'
import { CheckCircle2, Copy, Gift, Loader2, ShieldCheck } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { supabaseBrowser } from '@/lib/supabase/client'

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

  return <main className="min-h-screen bg-[var(--bg)] text-[var(--fg)] flex items-center justify-center px-5 py-12">
    <div className="w-full max-w-md">
      <div className="text-center mb-8"><div className="mx-auto w-16 h-16 rounded-2xl bg-[var(--fg)] text-[var(--bg)] flex items-center justify-center"><Gift size={30}/></div><p className="mt-5 text-xs tracking-[.25em] text-[var(--accent)] uppercase">IVISION STORES</p><h1 className="display text-4xl md:text-5xl font-bold mt-3">Your exclusive coupon</h1><p className="mt-3 text-[var(--muted)]">Enter your mobile number to receive your unique discount code.</p></div>
      {!code ? <form onSubmit={claim} className="rounded-3xl border hairline bg-[var(--panel)] p-6 md:p-8 shadow-sm"><label className="text-sm font-medium">Mobile number</label><input type="tel" dir="ltr" maxLength={11} value={phone} onChange={e=>setPhone(e.target.value.replace(/\D/g,'').slice(0,11))} inputMode="numeric" autoComplete="tel" placeholder="01XXXXXXXXX" className="mt-2 w-full rounded-2xl border hairline bg-[var(--bg)] px-4 py-4 outline-none focus:ring-2 focus:ring-[var(--accent)]" required/><button disabled={busy} className="mt-4 w-full rounded-2xl bg-[var(--fg)] text-[var(--bg)] py-4 font-semibold flex items-center justify-center gap-2 disabled:opacity-60">{busy?<><Loader2 className="animate-spin" size={18}/>Generating...</>:'Get my coupon'}</button>{error&&<p className="mt-4 text-sm text-red-600">{error}</p>}<div className="mt-5 flex gap-2 text-xs text-[var(--muted)]"><ShieldCheck size={16} className="shrink-0"/><span>Your number is used only to prevent duplicate coupon claims.</span></div></form> : <div className="rounded-3xl border hairline bg-[var(--panel)] p-6 md:p-8 text-center"><CheckCircle2 className="mx-auto" size={44}/><p className="mt-4 text-sm text-[var(--muted)]">Your discount</p><div className="text-4xl font-bold mt-1">{discount}</div><div className="mt-7 flex justify-center"><div className="bg-white p-4 rounded-2xl"><QRCodeSVG value={code} size={180} includeMargin/></div></div><div className="mt-6 rounded-2xl border hairline bg-[var(--bg)] p-4"><p className="text-xs text-[var(--muted)] uppercase tracking-widest">Coupon code</p><div className="mt-2 text-2xl font-bold tracking-wider break-all">{code}</div><button onClick={copyCode} className="mt-3 inline-flex items-center gap-2 text-sm underline"> <Copy size={15}/>{copied?'Copied':'Copy code'}</button></div>{endsAt&&<p className="mt-5 text-xs text-[var(--muted)]">Valid until {new Date(endsAt).toLocaleDateString('en-EG')}</p>}<p className="mt-5 text-xs text-[var(--muted)]">Show this QR code or code to an IVISION team member at checkout.</p></div>}
      <p className="text-center mt-7 text-xs text-[var(--muted)]">One unique coupon per mobile number.</p>
    </div>
  </main>
}
