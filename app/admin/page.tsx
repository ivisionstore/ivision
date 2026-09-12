'use client'

import { useEffect, useMemo, useState } from 'react'
import { Archive, Boxes, Check, ChevronDown, Edit3, LogOut, Package, Plus, RefreshCw, Search, TrendingDown, X } from 'lucide-react'
import { supabaseBrowser } from '../../lib/supabase/client'

type Product = {
  id: string
  sku: string
  name: string
  slug: string
  category_id: string | null
  description: string | null
  short_description: string | null
  price: number
  compare_at_price: number | null
  stock_quantity: number
  low_stock_threshold: number
  brand: string | null
  specs: Record<string, unknown>
  is_featured: boolean
  is_active: boolean
  category?: { name: string } | null
  product_images?: { image_url: string; is_primary: boolean; sort_order: number }[]
}

type Category = { id: string; name: string }
type Movement = { id: string; product_id: string; change_quantity: number; quantity_before: number; quantity_after: number; movement_type: string; note: string | null; created_at: string }

type Form = {
  id?: string
  sku: string
  name: string
  slug: string
  category_id: string
  description: string
  short_description: string
  price: string
  compare_at_price: string
  stock_quantity: string
  low_stock_threshold: string
  brand: string
  image_url: string
  is_featured: boolean
  is_active: boolean
}

const emptyForm: Form = { sku: '', name: '', slug: '', category_id: '', description: '', short_description: '', price: '', compare_at_price: '', stock_quantity: '0', low_stock_threshold: '5', brand: 'IVISION', image_url: '', is_featured: false, is_active: true }

export default function AdminPage() {
  const supabase = useMemo(() => supabaseBrowser(), [])
  const [user, setUser] = useState<any>(null)
  const [loadingAuth, setLoadingAuth] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [movements, setMovements] = useState<Movement[]>([])
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'low' | 'out' | 'inactive'>('all')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [stockOpen, setStockOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState<Form>(emptyForm)
  const [stockProduct, setStockProduct] = useState<Product | null>(null)
  const [stockDelta, setStockDelta] = useState('')
  const [stockType, setStockType] = useState('restock')
  const [stockNote, setStockNote] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { setUser(data.user ?? null); setLoadingAuth(false) })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null))
    return () => listener.subscription.unsubscribe()
  }, [supabase])

  useEffect(() => { if (user) load() }, [user])

  async function load() {
    setError('')
    const [{ data: p, error: pe }, { data: c, error: ce }, { data: m, error: me }] = await Promise.all([
      supabase.from('products').select('*, category:categories(name), product_images(image_url,is_primary,sort_order)').order('created_at', { ascending: false }),
      supabase.from('categories').select('id,name').eq('is_active', true).order('sort_order'),
      supabase.from('inventory_movements').select('*').order('created_at', { ascending: false }).limit(100),
    ])
    if (pe || ce || me) setError(pe?.message || ce?.message || me?.message || 'Could not load admin data')
    setProducts((p as Product[]) || [])
    setCategories((c as Category[]) || [])
    setMovements((m as Movement[]) || [])
  }

  async function signIn(e: React.FormEvent) {
    e.preventDefault(); setLoginError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setLoginError(error.message)
  }

  async function saveProduct(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError(''); setMessage('')
    const slug = form.slug || form.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const { data: id, error: saveError } = await supabase.rpc('admin_product_upsert', {
      p_id: form.id || null, p_sku: form.sku.trim(), p_name: form.name.trim(), p_slug: slug, p_category_id: form.category_id || null,
      p_description: form.description || null, p_short_description: form.short_description || null, p_price: Number(form.price),
      p_compare_at_price: form.compare_at_price ? Number(form.compare_at_price) : null, p_stock_quantity: Number(form.stock_quantity),
      p_low_stock_threshold: Number(form.low_stock_threshold), p_brand: form.brand || null, p_specs: {}, p_is_featured: form.is_featured, p_is_active: form.is_active,
    })
    if (saveError) { setError(saveError.message); setBusy(false); return }
    const productId = id as string
    if (form.image_url.trim()) {
      await supabase.from('product_images').delete().eq('product_id', productId).eq('is_primary', true)
      const { error: imageError } = await supabase.from('product_images').insert({ product_id: productId, image_url: form.image_url.trim(), is_primary: true, sort_order: 0, alt_text: form.name })
      if (imageError) setError(imageError.message)
    }
    setMessage(editing ? 'Product updated successfully.' : 'Product created successfully.')
    setFormOpen(false); setEditing(null); setForm(emptyForm); await load(); setBusy(false)
  }

  async function archiveProduct(product: Product) {
    if (!confirm(`Archive ${product.name}? It will stop appearing in the storefront.`)) return
    setBusy(true)
    const { error } = await supabase.rpc('admin_delete_product', { p_product_id: product.id })
    if (error) setError(error.message); else setMessage('Product archived.')
    await load(); setBusy(false)
  }

  async function adjustStock(e: React.FormEvent) {
    e.preventDefault(); if (!stockProduct) return
    setBusy(true); setError('')
    const delta = Number(stockDelta)
    if (!delta) { setError('Enter a non-zero quantity.'); setBusy(false); return }
    const { error } = await supabase.rpc('adjust_product_stock', { p_product_id: stockProduct.id, p_delta: delta, p_movement_type: stockType, p_note: stockNote || null })
    if (error) setError(error.message); else setMessage(`Stock updated for ${stockProduct.name}.`)
    setStockOpen(false); setStockProduct(null); setStockDelta(''); setStockNote(''); await load(); setBusy(false)
  }

  const low = products.filter(p => p.is_active && p.stock_quantity > 0 && p.stock_quantity <= p.low_stock_threshold).length
  const out = products.filter(p => p.is_active && p.stock_quantity === 0).length
  const active = products.filter(p => p.is_active).length
  const stockUnits = products.reduce((sum, p) => sum + p.stock_quantity, 0)
  const filtered = products.filter(p => {
    const q = query.toLowerCase(); const matches = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
    const state = filter === 'all' || (filter === 'low' && p.stock_quantity > 0 && p.stock_quantity <= p.low_stock_threshold) || (filter === 'out' && p.stock_quantity === 0) || (filter === 'inactive' && !p.is_active)
    return matches && state
  })

  if (loadingAuth) return <div className="min-h-screen grid place-items-center bg-[#f7f7f5] text-[#11110f]">Loading…</div>
  if (!user) return <main className="min-h-screen bg-[#f7f7f5] text-[#11110f] grid place-items-center p-6"><form onSubmit={signIn} className="w-full max-w-md rounded-3xl border border-black/10 bg-white p-8 shadow-sm"><div className="text-xs tracking-[.25em] font-semibold text-[#7a8f62]">IVISION STORES</div><h1 className="text-4xl font-bold tracking-tight mt-4">Admin Console</h1><p className="text-black/55 mt-3">Sign in with an authorized store account.</p><div className="mt-8 grid gap-4"><input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="Email" className="rounded-xl border border-black/10 px-4 py-3 outline-none focus:border-[#7a8f62]" required/><input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="Password" className="rounded-xl border border-black/10 px-4 py-3 outline-none focus:border-[#7a8f62]" required/>{loginError&&<p className="text-sm text-red-600">{loginError}</p>}<button className="rounded-xl bg-[#11110f] text-white px-4 py-3 font-semibold">Sign in</button></div></form></main>

  return <main className="min-h-screen bg-[#f7f7f5] text-[#11110f]">
    <header className="sticky top-0 z-40 border-b border-black/10 bg-[#f7f7f5]/90 backdrop-blur-xl"><div className="max-w-[1500px] mx-auto px-5 lg:px-8 h-18 flex items-center justify-between"><div><div className="font-black tracking-tight text-xl">IVISION</div><div className="text-[10px] tracking-[.24em] text-black/45">STORE ADMIN</div></div><div className="flex items-center gap-2"><button onClick={()=>load()} className="p-2 rounded-full border border-black/10 hover:bg-white" title="Refresh"><RefreshCw size={16}/></button><button onClick={()=>supabase.auth.signOut()} className="p-2 rounded-full border border-black/10 hover:bg-white" title="Sign out"><LogOut size={16}/></button></div></div></header>
    <div className="max-w-[1500px] mx-auto px-5 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5"><div><div className="text-xs uppercase tracking-[.2em] text-[#7a8f62] font-semibold">Commerce operations</div><h1 className="text-5xl md:text-6xl font-black tracking-[-.05em] mt-2">Products & Inventory.</h1><p className="text-black/55 mt-3 max-w-2xl">Manage your catalog, pricing, availability and stock movements from one production-connected workspace.</p></div><button onClick={()=>{setEditing(null);setForm(emptyForm);setFormOpen(true)}} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#11110f] text-white px-5 py-3 font-semibold"><Plus size={17}/> New product</button></div>
      {message&&<div className="mt-6 rounded-2xl border border-[#7a8f62]/30 bg-[#7a8f62]/10 px-4 py-3 flex justify-between"><span>{message}</span><button onClick={()=>setMessage('')}><X size={16}/></button></div>}
      {error&&<div className="mt-6 rounded-2xl border border-red-200 bg-red-50 text-red-700 px-4 py-3">{error}</div>}
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3 mt-8">{[["Active products",active,Package],["Stock units",stockUnits,Boxes],["Low stock",low,TrendingDown],["Out of stock",out,Archive]].map(([label,value,Icon]:any)=><div key={label} className="rounded-2xl border border-black/10 bg-white p-5"><div className="flex justify-between items-center"><span className="text-sm text-black/50">{label}</span><Icon size={17} className="text-[#7a8f62]"/></div><div className="text-4xl font-black mt-5 tracking-tight">{value}</div></div>)}</div>
      <section className="mt-8 rounded-3xl border border-black/10 bg-white overflow-hidden"><div className="p-5 border-b border-black/10 flex flex-col md:flex-row gap-3 md:items-center md:justify-between"><div className="relative w-full md:max-w-md"><Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/35"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search name or SKU…" className="w-full rounded-xl bg-[#f7f7f5] border border-black/5 pl-11 pr-4 py-3 outline-none"/></div><div className="flex gap-2 overflow-auto">{[['all','All'],['low','Low stock'],['out','Out of stock'],['inactive','Archived']].map(([key,label])=><button key={key} onClick={()=>setFilter(key as any)} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm ${filter===key?'bg-[#11110f] text-white':'border border-black/10'}`}>{label}</button>)}</div></div><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="text-left text-black/45 border-b border-black/10"><tr><th className="p-4 font-medium">Product</th><th className="p-4 font-medium">SKU</th><th className="p-4 font-medium">Category</th><th className="p-4 font-medium">Price</th><th className="p-4 font-medium">Stock</th><th className="p-4 font-medium">Status</th><th className="p-4"></th></tr></thead><tbody>{filtered.map(p=>{const image=p.product_images?.find(i=>i.is_primary)?.image_url || p.product_images?.[0]?.image_url;const stockState=p.stock_quantity===0?'out':p.stock_quantity<=p.low_stock_threshold?'low':'ok';return <tr key={p.id} className="border-b border-black/5 last:border-0 hover:bg-[#f7f7f5]/70"><td className="p-4 min-w-[280px]"><div className="flex items-center gap-3"><div className="w-12 h-12 rounded-xl bg-[#f1f1ed] overflow-hidden grid place-items-center">{image?<img src={image} alt="" className="w-full h-full object-cover"/>:<Package size={18} className="text-black/25"/>}</div><div><div className="font-semibold">{p.name}</div><div className="text-xs text-black/45">{p.brand || 'IVISION'}</div></div></div></td><td className="p-4 font-mono text-xs">{p.sku}</td><td className="p-4 text-black/60">{p.category?.name || '—'}</td><td className="p-4 font-semibold">{Number(p.price).toLocaleString()} {p.currency || 'USD'}</td><td className="p-4"><div className={`font-bold ${stockState==='out'?'text-red-600':stockState==='low'?'text-amber-600':''}`}>{p.stock_quantity}</div><div className="text-[11px] text-black/40">threshold {p.low_stock_threshold}</div></td><td className="p-4">{!p.is_active?<span className="rounded-full bg-black/5 px-2.5 py-1 text-xs">Archived</span>:stockState==='out'?<span className="rounded-full bg-red-50 text-red-700 px-2.5 py-1 text-xs">Out of stock</span>:stockState==='low'?<span className="rounded-full bg-amber-50 text-amber-700 px-2.5 py-1 text-xs">Low stock</span>:<span className="rounded-full bg-[#7a8f62]/10 text-[#59703f] px-2.5 py-1 text-xs">In stock</span>}</td><td className="p-4"><div className="flex justify-end gap-1"><button onClick={()=>{setStockProduct(p);setStockOpen(true)}} className="rounded-full border border-black/10 px-3 py-2 text-xs font-semibold hover:bg-[#f7f7f5]">Adjust</button><button onClick={()=>{const image=p.product_images?.find(i=>i.is_primary)?.image_url || p.product_images?.[0]?.image_url || '';setEditing(p);setForm({id:p.id,sku:p.sku,name:p.name,slug:p.slug,category_id:p.category_id||'',description:p.description||'',short_description:p.short_description||'',price:String(p.price),compare_at_price:p.compare_at_price?String(p.compare_at_price):'',stock_quantity:String(p.stock_quantity),low_stock_threshold:String(p.low_stock_threshold),brand:p.brand||'',image_url:image,is_featured:p.is_featured,is_active:p.is_active});setFormOpen(true)}} className="p-2 rounded-full hover:bg-black/5"><Edit3 size={15}/></button>{p.is_active&&<button onClick={()=>archiveProduct(p)} className="p-2 rounded-full hover:bg-red-50 text-red-600"><Archive size={15}/></button>}</div></td></tr>})}</tbody></table>{filtered.length===0&&<div className="py-16 text-center text-black/45">No products match this filter.</div>}</div></section>
      <section className="mt-8 rounded-3xl border border-black/10 bg-white overflow-hidden"><div className="p-5 border-b border-black/10"><h2 className="font-bold text-lg">Recent stock movements</h2><p className="text-sm text-black/45 mt-1">Every stock change is audited in the database.</p></div><div className="divide-y divide-black/5">{movements.slice(0,8).map(m=>{const p=products.find(x=>x.id===m.product_id);return <div key={m.id} className="p-4 flex items-center justify-between gap-4"><div><div className="font-medium">{p?.name || 'Product'}</div><div className="text-xs text-black/45 mt-1">{m.movement_type} · {m.note || 'Stock update'} · {new Date(m.created_at).toLocaleString()}</div></div><div className={`font-black ${m.change_quantity>0?'text-[#59703f]':'text-red-600'}`}>{m.change_quantity>0?'+':''}{m.change_quantity}</div></div>})}</div></section>
    </div>

    {formOpen&&<div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm p-4 overflow-auto"><form onSubmit={saveProduct} className="max-w-3xl mx-auto my-8 rounded-3xl bg-white border border-black/10 shadow-2xl overflow-hidden"><div className="p-6 border-b border-black/10 flex justify-between items-center"><div><div className="text-xs uppercase tracking-[.2em] text-[#7a8f62] font-semibold">{editing?'Edit product':'New product'}</div><h2 className="text-2xl font-black mt-1">Catalog details</h2></div><button type="button" onClick={()=>setFormOpen(false)}><X/></button></div><div className="p-6 grid md:grid-cols-2 gap-4"><Field label="Product name"><input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} /></Field><Field label="SKU"><input required value={form.sku} onChange={e=>setForm({...form,sku:e.target.value})} /></Field><Field label="Slug"><input value={form.slug} onChange={e=>setForm({...form,slug:e.target.value})} placeholder="auto-generated if empty" /></Field><Field label="Category"><select value={form.category_id} onChange={e=>setForm({...form,category_id:e.target.value})}><option value="">Uncategorized</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></Field><Field label="Price"><input required type="number" min="0" step="0.01" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} /></Field><Field label="Compare at price"><input type="number" min="0" step="0.01" value={form.compare_at_price} onChange={e=>setForm({...form,compare_at_price:e.target.value})} /></Field><Field label="Stock quantity"><input required type="number" min="0" value={form.stock_quantity} onChange={e=>setForm({...form,stock_quantity:e.target.value})} /></Field><Field label="Low-stock threshold"><input required type="number" min="0" value={form.low_stock_threshold} onChange={e=>setForm({...form,low_stock_threshold:e.target.value})} /></Field><Field label="Brand"><input value={form.brand} onChange={e=>setForm({...form,brand:e.target.value})} /></Field><Field label="Primary image URL"><input value={form.image_url} onChange={e=>setForm({...form,image_url:e.target.value})} placeholder="https://…" /></Field><div className="md:col-span-2"><Field label="Short description"><input value={form.short_description} onChange={e=>setForm({...form,short_description:e.target.value})} /></Field></div><div className="md:col-span-2"><Field label="Description"><textarea rows={4} value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></Field></div><label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={form.is_featured} onChange={e=>setForm({...form,is_featured:e.target.checked})}/> Featured product</label><label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={form.is_active} onChange={e=>setForm({...form,is_active:e.target.checked})}/> Active in storefront</label></div><div className="p-6 border-t border-black/10 flex justify-end gap-2"><button type="button" onClick={()=>setFormOpen(false)} className="px-5 py-3 rounded-full border border-black/10">Cancel</button><button disabled={busy} className="px-5 py-3 rounded-full bg-[#11110f] text-white font-semibold">{busy?'Saving…':editing?'Save changes':'Create product'}</button></div></form></div>}

    {stockOpen&&stockProduct&&<div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm p-4 grid place-items-center"><form onSubmit={adjustStock} className="w-full max-w-md rounded-3xl bg-white border border-black/10 shadow-2xl p-6"><div className="flex justify-between"><div><div className="text-xs uppercase tracking-[.2em] text-[#7a8f62] font-semibold">Inventory</div><h2 className="text-2xl font-black mt-1">Adjust stock</h2><p className="text-sm text-black/50 mt-2">{stockProduct.name} · Current: <b>{stockProduct.stock_quantity}</b></p></div><button type="button" onClick={()=>setStockOpen(false)}><X/></button></div><div className="mt-6 grid gap-4"><Field label="Quantity change"><input required type="number" value={stockDelta} onChange={e=>setStockDelta(e.target.value)} placeholder="+20 or -3" /></Field><Field label="Movement type"><select value={stockType} onChange={e=>setStockType(e.target.value)}><option value="restock">Restock</option><option value="adjustment">Adjustment</option><option value="return">Return</option><option value="damaged">Damaged / write-off</option></select></Field><Field label="Note"><textarea rows={3} value={stockNote} onChange={e=>setStockNote(e.target.value)} placeholder="Supplier delivery, count correction…"/></Field></div><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={()=>setStockOpen(false)} className="px-5 py-3 rounded-full border border-black/10">Cancel</button><button disabled={busy} className="px-5 py-3 rounded-full bg-[#11110f] text-white font-semibold">{busy?'Updating…':'Update stock'}</button></div></form></div>}
  </main>
}

function Field({label,children}:{label:string;children:React.ReactNode}) { return <label className="grid gap-2 text-sm font-medium">{label}<div className="font-normal">{children}</div></label> }
