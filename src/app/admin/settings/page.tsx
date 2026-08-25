'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import AuthenticatorSecurity from '@/components/AuthenticatorSecurity'
import { Save, Settings, CreditCard } from 'lucide-react'

type CommercialSetting = {
  product_key: string
  label: string
  description: string
  price_pence: number
  billing_interval: 'month' | 'year' | 'one_off'
  is_active: boolean
}

export default function AdminSettingsPage() {
  const [config, setConfig] = useState<Record<string, any>>({})
  const [products, setProducts] = useState<CommercialSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function load() {
      const [configRes, commercialRes] = await Promise.all([
        fetch('/api/admin/content?kind=platform_config', { cache: 'no-store' }),
        fetch('/api/admin/commercial-settings', { cache: 'no-store' }),
      ])
      const { rows: data } = configRes.ok ? await configRes.json() : { rows: [] }
      const configMap: Record<string, any> = {}
      for (const row of data || []) configMap[row.key] = row.value
      setConfig(configMap)
      if (commercialRes.ok) {
        const commercial = await commercialRes.json()
        setProducts(commercial.rows || [])
      }
      setLoading(false)
    }
    load()
  }, [])

  const updateConfig = async (key: string, value: string) => {
    setSaving(true); setMessage('')
    const res = await fetch('/api/admin/content', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'config_upsert', key, value }) })
    const j = await res.json().catch(() => ({}))
    if (!res.ok) setMessage(`Error: ${j.error || 'could not save'}`)
    else { setConfig({ ...config, [key]: value }); setMessage('Settings saved.') }
    setSaving(false); setTimeout(() => setMessage(''), 3000)
  }

  const updateProductLocal = (key: string, patch: Partial<CommercialSetting>) => setProducts(current => current.map(product => product.product_key === key ? { ...product, ...patch } : product))

  const saveProduct = async (product: CommercialSetting) => {
    setSaving(true); setMessage('')
    const res = await fetch('/api/admin/commercial-settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(product) })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) setMessage(`Error: ${body.error || 'could not save price'}`)
    else { setProducts(current => current.map(item => item.product_key === product.product_key ? body.setting : item)); setMessage(`${product.label} updated.`) }
    setSaving(false); setTimeout(() => setMessage(''), 3000)
  }

  const configFields = [
    { key: 'site_name', label: 'Site Name', placeholder: 'WHC Concierge' },
    { key: 'site_description', label: 'Site Description', placeholder: 'The specialist careers platform for luxury wellness' },
    { key: 'contact_email', label: 'Contact Email', placeholder: 'hello@wellnesshousecollective.co.uk' },
    { key: 'maintenance_mode', label: 'Maintenance Mode (true/false)', placeholder: 'false' },
  ]

  return <DashboardShell role="admin" userName="Admin">
    <div className="mb-8"><p className="dashboard-eyebrow">Controls</p><h1 className="dashboard-title">Platform Settings</h1><p className="dashboard-intro">Manage platform security, live configuration and commercial product pricing.</p></div>

    {loading ? <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[#9c7a42] border-t-transparent" /></div> : <div className="max-w-4xl space-y-6">
      {message && <div className={`rounded-xl px-4 py-3 text-[13px] ${message.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>{message}</div>}

      <AuthenticatorSecurity required />

      <div className="dashboard-card">
        <div className="mb-6 flex items-start gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f3f1ec] text-[#9c7a42]"><CreditCard size={18} /></div><div><p className="text-[15px] font-semibold text-ink">Commercial products</p><p className="mt-1 text-[12px] text-muted">These values are read at checkout. Changing a price here changes the price shown to new customers without a code deployment. Existing Stripe subscriptions keep their existing agreed price until changed in Stripe.</p></div></div>
        <div className="space-y-4">{products.length === 0 ? <p className="text-[13px] text-muted">No configurable commercial products found.</p> : products.map(product => <div key={product.product_key} className="rounded-2xl border border-border bg-[#f7f5f0] p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-end"><div className="flex-1"><label className="dashboard-eyebrow block mb-1.5 !text-[9px]">Product</label><input className="input-field" value={product.label} onChange={e => updateProductLocal(product.product_key, { label: e.target.value })} /></div><div className="w-full lg:w-40"><label className="dashboard-eyebrow block mb-1.5 !text-[9px]">Price (£)</label><input type="number" min="0" step="0.01" className="input-field" value={(product.price_pence / 100).toFixed(2)} onChange={e => updateProductLocal(product.product_key, { price_pence: Math.max(0, Math.round(Number(e.target.value || 0) * 100)) })} /></div><div className="w-full lg:w-36"><label className="dashboard-eyebrow block mb-1.5 !text-[9px]">Billing</label><select className="input-field" value={product.billing_interval} onChange={e => updateProductLocal(product.product_key, { billing_interval: e.target.value as CommercialSetting['billing_interval'] })}><option value="month">Monthly</option><option value="year">Yearly</option><option value="one_off">One-off</option></select></div><label className="flex h-11 items-center gap-2 text-[12px] text-secondary"><input type="checkbox" checked={product.is_active} onChange={e => updateProductLocal(product.product_key, { is_active: e.target.checked })} /> Active</label><button type="button" onClick={() => saveProduct(product)} disabled={saving} className="btn-primary h-11 !px-5 text-[12px] disabled:opacity-50"><Save size={14} className="mr-1 inline" /> Save</button></div><div className="mt-4"><label className="dashboard-eyebrow block mb-1.5 !text-[9px]">Customer-facing description</label><textarea rows={2} className="input-field resize-none" value={product.description} onChange={e => updateProductLocal(product.product_key, { description: e.target.value })} /></div></div>)}</div>
      </div>

      <div className="dashboard-card space-y-5"><div className="flex items-center gap-2"><Settings size={18} className="text-[#9c7a42]" /><p className="text-[15px] font-semibold text-ink">General configuration</p></div>{configFields.map(field => <div key={field.key}><label className="dashboard-eyebrow block mb-1.5 !text-[9px]">{field.label}</label><div className="flex gap-3"><input type="text" value={config[field.key] || ''} onChange={e => setConfig({ ...config, [field.key]: e.target.value })} className="input-field flex-1" placeholder={field.placeholder} /><button type="button" onClick={() => updateConfig(field.key, config[field.key] || '')} disabled={saving} className="btn-secondary !px-4 disabled:opacity-50"><Save size={14} /></button></div></div>)}</div>

      <div className="dashboard-card"><p className="text-[15px] font-semibold text-ink mb-4">Infrastructure</p><div className="grid gap-3 md:grid-cols-3"><div className="rounded-xl bg-[#f7f5f0] p-4"><p className="text-[12px] font-semibold text-ink">Supabase</p><p className="mt-1 text-[11px] text-muted">WHC production project</p></div><div className="rounded-xl bg-[#f7f5f0] p-4"><p className="text-[12px] font-semibold text-ink">Stripe</p><p className="mt-1 text-[11px] text-muted">Live keys via environment</p></div><div className="rounded-xl bg-[#f7f5f0] p-4"><p className="text-[12px] font-semibold text-ink">Storage</p><p className="mt-1 text-[11px] text-muted">Private candidate documents and site assets</p></div></div></div>
    </div>}
  </DashboardShell>
}
