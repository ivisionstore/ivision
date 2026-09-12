'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import {
  LayoutDashboard,
  Loader2,
  LogOut,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  TicketCheck,
  Upload,
  Users,
  Megaphone,
  type LucideIcon,
} from 'lucide-react'
import { supabaseBrowser } from '../../../lib/supabase/client'

type Campaign = {
  id: string
  name: string
  slug: string
  discount_text: string
  starts_at: string
  ends_at: string | null
  is_active: boolean
}

type Stats = {
  total: number
  available: number
  assigned: number
  used: number
}

type NavItem = {
  icon: LucideIcon
  label: string
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard' },
  { icon: Megaphone, label: 'Campaigns' },
  { icon: TicketCheck, label: 'Coupons' },
  { icon: Search, label: 'Check & Redeem' },
  { icon: Upload, label: 'Import Codes' },
  { icon: Users, label: 'Users' },
  { icon: Settings, label: 'Settings' },
]

export default function CouponAdmin() {
  const supabase = useMemo(() => supabaseBrowser(), [])

  const [user, setUser] = useState<any>(null)
  const [authBusy, setAuthBusy] = useState(true)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')

  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [selected, setSelected] = useState<Campaign | null>(null)

  const [stats, setStats] = useState<Stats>({
    total: 0,
    available: 0,
    assigned: 0,
    used: 0,
  })

  const [codes, setCodes] = useState('')

  const [name, setName] = useState('September 10% Campaign')
  const [slug, setSlug] = useState('september-10')
  const [discount, setDiscount] = useState('10% OFF')
  const [ends, setEnds] = useState('2026-09-30T23:59')

  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  const [redeem, setRedeem] = useState('')
  const [redeemResult, setRedeemResult] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null)
      setAuthBusy(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  useEffect(() => {
    if (user) {
      load()
    }
  }, [user])

  async function load() {
    setErr('')

    const { data, error } = await supabase
      .from('coupon_campaigns')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setErr(error.message)
      return
    }

    setCampaigns(data || [])

    if (!selected && data?.[0]) {
      setSelected(data[0])
    } else if (selected) {
      const fresh = (data || []).find(
        (x: Campaign) => x.id === selected.id,
      )

      if (fresh) {
        setSelected(fresh)
      }
    }
  }

  useEffect(() => {
    if (selected) {
      loadStats(selected.id)
    }
  }, [selected])

  async function loadStats(id: string) {
    const { data, error } = await supabase
      .from('coupons')
      .select('status')
      .eq('campaign_id', id)

    if (error) {
      setErr(error.message)
      return
    }

    const rows = data || []

    setStats({
      total: rows.length,
      available: rows.filter(
        (r: { status: string }) => r.status === 'available',
      ).length,
      assigned: rows.filter(
        (r: { status: string }) => r.status === 'assigned',
      ).length,
      used: rows.filter(
        (r: { status: string }) => r.status === 'used',
      ).length,
    })
  }

  async function login(e: FormEvent) {
    e.preventDefault()

    setLoginError('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setLoginError(error.message)
    }
  }

  async function createCampaign(e: FormEvent) {
    e.preventDefault()

    setBusy(true)
    setMsg('')
    setErr('')

    const { data, error } = await supabase
      .from('coupon_campaigns')
      .insert({
        name,
        slug: slug.trim().toLowerCase(),
        discount_text: discount,
        ends_at: ends ? new Date(ends).toISOString() : null,
      })
      .select()
      .single()

    if (error) {
      setErr(error.message)
    } else {
      setMsg('Campaign created.')
      setSelected(data)
      await load()
    }

    setBusy(false)
  }

  async function importCodes() {
    if (!selected) {
      setErr('Create or select a campaign first.')
      return
    }

    const list = Array.from(
      new Set(
        codes
          .split(/[\n,;]+/)
          .map((x) => x.trim())
          .filter(Boolean),
      ),
    )

    if (!list.length) {
      setErr('Paste at least one coupon code.')
      return
    }

    setBusy(true)

    const rows = list.map((code) => ({
      campaign_id: selected.id,
      code,
      status: 'available',
    }))

    const { error } = await supabase
      .from('coupons')
      .upsert(rows, {
        onConflict: 'code',
        ignoreDuplicates: true,
      })

    if (error) {
      setErr(error.message)
    } else {
      setMsg(`${list.length} code(s) imported.`)
      setCodes('')
      await loadStats(selected.id)
    }

    setBusy(false)
  }

  async function redeemCoupon() {
    setBusy(true)
    setRedeemResult('')

    const { data, error } = await supabase.rpc('redeem_coupon', {
      p_code: redeem.trim().toUpperCase(),
    })

    setBusy(false)

    if (error) {
      setRedeemResult(error.message)
      return
    }

    const row = Array.isArray(data) ? data[0] : data

    setRedeemResult(row?.message || 'Done')

    if (selected) {
      loadStats(selected.id)
    }
  }

  if (authBusy) {
    return (
      <div className="min-h-[calc(100vh-78px)] flex items-center justify-center text-[var(--muted)]">
        <Loader2
          className="animate-spin mr-2"
          size={18}
        />
        Loading…
      </div>
    )
  }

  if (!user) {
    return (
      <main className="min-h-[calc(100vh-78px)] flex items-center justify-center px-5">
        <form
          onSubmit={login}
          className="w-full max-w-sm rounded-[2rem] border border-cyan-300/20 bg-[var(--panel)] p-7 shadow-2xl"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-300 to-blue-500 text-slate-950 flex items-center justify-center">
            <ShieldCheck />
          </div>

          <h1 className="text-2xl font-bold mt-5">
            Coupon Management
          </h1>

          <p className="text-sm text-[var(--muted)] mt-2">
            Sign in with an authorized IVISION account.
          </p>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="mt-6 w-full rounded-xl border border-cyan-300/15 bg-[#03101a] px-4 py-3 outline-none"
            required
          />

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="mt-3 w-full rounded-xl border border-cyan-300/15 bg-[#03101a] px-4 py-3 outline-none"
            required
          />

          <button
            type="submit"
            className="mt-4 w-full rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 py-3 font-bold"
          >
            Sign in
          </button>

          {loginError && (
            <p className="text-sm text-red-300 mt-3">
              {loginError}
            </p>
          )}
        </form>
      </main>
    )
  }

  return (
    <main className="min-h-[calc(100vh-78px)] px-4 sm:px-6 py-6">
      <div className="max-w-[1400px] mx-auto grid lg:grid-cols-[210px_1fr] gap-5">

        <aside className="rounded-3xl border border-cyan-300/10 bg-[#04131f]/90 p-4 flex lg:flex-col justify-between min-h-[720px]">
          <div>
            <p className="px-3 text-[10px] tracking-[.25em] uppercase text-cyan-300 mb-4">
              Admin menu
            </p>

            <nav className="grid gap-1">
              {navItems.map(({ icon: Icon, label }, i) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    if (i === 2) {
                      document
                        .getElementById('coupons')
                        ?.scrollIntoView({
                          behavior: 'smooth',
                        })
                    }
                  }}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-left ${
                    i === 2
                      ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-bold'
                      : 'text-slate-300 hover:bg-white/[.04]'
                  }`}
                >
                  <Icon size={17} />
                  {label}
                </button>
              ))}
            </nav>
          </div>

          <button
            type="button"
            onClick={() => supabase.auth.signOut()}
            className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-300"
          >
            <LogOut size={17} />
            Logout
          </button>
        </aside>

        <section
          id="coupons"
          className="min-w-0"
        >
          <header className="flex flex-wrap justify-between gap-4 items-start">
            <div>
              <p className="text-xs tracking-[.25em] uppercase text-cyan-300 font-semibold">
                IVISION STORES
              </p>

              <h1 className="text-3xl md:text-4xl font-black mt-2">
                Coupon Management
              </h1>

              <p className="mt-2 text-sm text-[var(--muted)]">
                Manage campaigns, coupon inventory and redemption.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                document
                  .getElementById('create-campaign')
                  ?.scrollIntoView({
                    behavior: 'smooth',
                  })
              }
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 px-4 py-3 font-bold"
            >
              <Plus size={17} />
              Create Campaign
            </button>
          </header>

          <section className="grid grid-cols-2 xl:grid-cols-4 gap-3 mt-7">
            {[
              ['Total', stats.total, 'text-cyan-300'],
              ['Available', stats.available, 'text-emerald-300'],
              ['Claimed', stats.assigned, 'text-amber-300'],
              ['Used', stats.used, 'text-violet-300'],
            ].map(([label, value, color]) => (
              <div
                key={String(label)}
                className="rounded-2xl border border-cyan-300/10 bg-[var(--panel)] p-5"
              >
                <div className={`text-xs ${String(color)}`}>
                  {label}
                </div>

                <div className="text-3xl font-black mt-2">
                  {value}
                </div>
              </div>
            ))}
          </section>

          <div className="grid xl:grid-cols-[1.35fr_.65fr] gap-5 mt-5">
            <section className="rounded-3xl border border-cyan-300/10 bg-[var(--panel)] p-5">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-bold text-lg">
                    Campaigns
                  </h2>

                  <p className="text-xs text-[var(--muted)] mt-1">
                    Active campaigns and discount rules
                  </p>
                </div>

                <button
                  type="button"
                  onClick={load}
                  className="p-2 rounded-lg border border-cyan-300/10"
                >
                  <RefreshCw size={16} />
                </button>
              </div>

              <div className="mt-4 grid gap-3">
                {campaigns.map((campaign) => (
                  <button
                    key={campaign.id}
                    type="button"
                    onClick={() => setSelected(campaign)}
                    className={`text-left rounded-2xl border p-4 ${
                      selected?.id === campaign.id
                        ? 'border-cyan-300/70 bg-cyan-300/[.06]'
                        : 'border-cyan-300/10'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-bold">
                          {campaign.name}
                        </div>

                        <div className="text-xs text-[var(--muted)] mt-1">
                          {campaign.discount_text} · /{campaign.slug}
                        </div>
                      </div>

                      <span className="rounded-full border border-emerald-300/30 bg-emerald-300/10 text-emerald-300 px-2 py-1 text-[10px] font-bold">
                        {campaign.is_active
                          ? 'Active'
                          : 'Inactive'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-cyan-300/10 bg-[var(--panel)] p-5">
              <h2 className="font-bold text-lg">
                Quick Actions
              </h2>

              <div className="grid gap-3 mt-4">
                <button
                  type="button"
                  onClick={() =>
                    document
                      .getElementById('import-codes')
                      ?.scrollIntoView({
                        behavior: 'smooth',
                      })
                  }
                  className="flex items-center gap-3 rounded-xl border border-cyan-300/10 px-4 py-3 text-sm"
                >
                  <Upload
                    size={17}
                    className="text-cyan-300"
                  />
                  Import Codes
                </button>

                <button
                  type="button"
                  onClick={() =>
                    document
                      .getElementById('redeem-coupon')
                      ?.scrollIntoView({
                        behavior: 'smooth',
                      })
                  }
                  className="flex items-center gap-3 rounded-xl border border-cyan-300/10 px-4 py-3 text-sm"
                >
                  <Search
                    size={17}
                    className="text-cyan-300"
                  />
                  Check & Redeem
                </button>
              </div>

              <div className="mt-5 rounded-2xl border border-cyan-300/10 p-4">
                <p className="text-xs text-[var(--muted)]">
                  Customer link
                </p>

                <p className="mt-2 text-xs font-mono text-cyan-200 break-all">
                  /coupon?campaign=
                  {selected?.slug || 'september-10'}
                </p>
              </div>
            </section>
          </div>

          <div
            id="create-campaign"
            className="grid xl:grid-cols-2 gap-5 mt-5"
          >
            <section className="rounded-3xl border border-cyan-300/10 bg-[var(--panel)] p-5">
              <h2 className="font-bold text-lg">
                Create Campaign
              </h2>

              <div className="grid gap-3 mt-4">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Campaign name"
                  className="w-full rounded-xl border border-cyan-300/10 bg-[#03101a] px-4 py-3"
                />

                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="slug"
                  className="w-full rounded-xl border border-cyan-300/10 bg-[#03101a] px-4 py-3"
                />

                <input
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  placeholder="10% OFF"
                  className="w-full rounded-xl border border-cyan-300/10 bg-[#03101a] px-4 py-3"
                />

                <input
                  type="datetime-local"
                  value={ends}
                  onChange={(e) => setEnds(e.target.value)}
                  className="w-full rounded-xl border border-cyan-300/10 bg-[#03101a] px-4 py-3"
                />
              </div>

              <button
                type="button"
                disabled={busy}
                <form
  onSubmit={createCampaign}
  className="rounded-3xl border border-cyan-300/10 bg-[var(--panel)] p-5"
>
  <h2 className="font-bold text-lg">
    Create Campaign
  </h2>

  <div className="grid gap-3 mt-4">
    <input
      value={name}
      onChange={(e) => setName(e.target.value)}
      placeholder="Campaign name"
      className="w-full rounded-xl border border-cyan-300/10 bg-[#03101a] px-4 py-3"
    />

    <input
      value={slug}
      onChange={(e) => setSlug(e.target.value)}
      placeholder="slug"
      className="w-full rounded-xl border border-cyan-300/10 bg-[#03101a] px-4 py-3"
    />

    <input
      value={discount}
      onChange={(e) => setDiscount(e.target.value)}
      placeholder="10% OFF"
      className="w-full rounded-xl border border-cyan-300/10 bg-[#03101a] px-4 py-3"
    />

    <input
      type="datetime-local"
      value={ends}
      onChange={(e) => setEnds(e.target.value)}
      className="w-full rounded-xl border border-cyan-300/10 bg-[#03101a] px-4 py-3"
    />
  </div>

  <button
    type="submit"
    disabled={busy}
    className="mt-4 w-full rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 py-3 font-bold"
  >
    <Plus
      size={17}
      className="inline mr-2"
    />
    Create campaign
  </button>
</form>
                className="mt-4 w-full rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 py-3 font-bold"
              >
                <Plus
                  size={17}
                  className="inline mr-2"
                />
                Create campaign
              </button>
            </section>

            <section
              id="import-codes"
              className="rounded-3xl border border-cyan-300/10 bg-[var(--panel)] p-5"
            >
              <h2 className="font-bold text-lg flex gap-2 items-center">
                <Upload
                  size={18}
                  className="text-cyan-300"
                />
                Import Coupon Codes
              </h2>

              <p className="text-sm text-[var(--muted)] mt-2">
                Paste one code per line, or comma-separated.
              </p>

              <textarea
                value={codes}
                onChange={(e) => setCodes(e.target.value)}
                placeholder={
                  'IV-001-A7K\nIV-002-X92\nIV-003-P41'
                }
                className="mt-4 w-full min-h-36 rounded-xl border border-cyan-300/10 bg-[#03101a] px-4 py-3 font-mono text-sm"
              />

              <button
                type="button"
                disabled={busy}
                onClick={importCodes}
                className="mt-3 w-full rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 py-3 font-bold"
              >
                Import codes
              </button>
            </section>
          </div>

          <section
            id="redeem-coupon"
            className="mt-5 rounded-3xl border border-cyan-300/10 bg-[var(--panel)] p-5"
          >
            <h2 className="font-bold text-lg flex gap-2 items-center">
              <TicketCheck
                size={18}
                className="text-cyan-300"
              />
              Check & Redeem Coupon
            </h2>

            <p className="text-sm text-[var(--muted)] mt-2">
              A successful redemption permanently marks the coupon as used.
            </p>

            <div className="mt-5 flex flex-col sm:flex-row gap-3">
              <input
                value={redeem}
                onChange={(e) => setRedeem(e.target.value)}
                placeholder="ENTER COUPON CODE"
                className="flex-1 rounded-xl border border-cyan-300/10 bg-[#03101a] px-4 py-3 uppercase"
              />

              <button
                type="button"
                disabled={busy || !redeem.trim()}
                onClick={redeemCoupon}
                className="rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 px-6 py-3 font-bold"
              >
                Check & redeem
              </button>
            </div>

            {redeemResult && (
              <div className="mt-4 rounded-xl border border-cyan-300/10 p-4 text-sm">
                {redeemResult}
              </div>
            )}
          </section>

          {msg && (
            <div className="fixed bottom-5 right-5 z-50 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 px-4 py-3 text-sm font-bold">
              {msg}
            </div>
          )}

          {err && (
            <div className="fixed bottom-5 left-5 z-50 rounded-xl bg-red-500 text-white px-4 py-3 text-sm">
              {err}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
