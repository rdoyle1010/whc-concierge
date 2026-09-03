'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { JOB_TIERS } from '@/lib/constants'
import { CreditCard, ExternalLink, Briefcase, Star, FileText, Save } from 'lucide-react'
import Link from 'next/link'

// Shows the tier's current list price for every listing, whatever its status.
// Member discounts are applied at checkout, not here.
function jobAmount(job: any): string {
  const tier = JOB_TIERS[job.tier as keyof typeof JOB_TIERS]
  if (!tier) return '-'
  return `£${tier.price / 100}`
}

export default function EmployerBillingPage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [listings, setListings] = useState<any[]>([])
  const [featuredPrice, setFeaturedPrice] = useState('')
  const [loading, setLoading] = useState(true)
  const [redirecting, setRedirecting] = useState(false)
  const [purchases, setPurchases] = useState<any[]>([])
  // Details a property's finance team needs on the paperwork. Held on the
  // property, not asked for again at every checkout.
  const [billing, setBilling] = useState({ purchase_order_ref: '', billing_email: '', billing_address: '' })
  const [savingBilling, setSavingBilling] = useState(false)
  const [billingNotice, setBillingNotice] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)

  useEffect(() => {
    async function load() {
      const productPromise = fetch('/api/commercial-settings?product=featured_employer', { cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const purchasesPromise = fetch('/api/purchases', { cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null)
      const { data: prof } = await supabase.from('employer_profiles').select('*').eq('user_id', user.id).single()
      setProfile(prof)
      if (prof) {
        setBilling({
          purchase_order_ref: prof.purchase_order_ref || '',
          billing_email: prof.billing_email || '',
          billing_address: prof.billing_address || '',
        })
      }
      const purchaseData = await purchasesPromise
      setPurchases(purchaseData?.purchases || [])
      const product = await productPromise
      if (product?.setting) {
        const pounds = product.setting.price_pence / 100
        setFeaturedPrice(`${Number.isInteger(pounds) ? `£${pounds}` : `£${pounds.toFixed(2)}`}/${product.setting.billing_interval === 'year' ? 'year' : 'month'}`)
      }
      if (!prof) { setLoading(false); return }

      const { data: jobs } = await supabase
        .from('job_listings')
        .select('*')
        .eq('employer_id', prof.id)
        .order('posted_date', { ascending: false })

      const normalizedJobs = (jobs || []).map((j: any) => ({
        ...j,
        title: j.job_title || j.title,
        status: j.is_live ? 'active' : 'closed',
      }))
      setListings(normalizedJobs)
      setLoading(false)
    }
    load()
  }, [])

  const saveBilling = async () => {
    if (!profile?.id) return
    setSavingBilling(true); setBillingNotice(null)
    const { error } = await supabase.from('employer_profiles').update({
      purchase_order_ref: billing.purchase_order_ref.trim() || null,
      billing_email: billing.billing_email.trim() || null,
      billing_address: billing.billing_address.trim() || null,
    }).eq('id', profile.id)
    setSavingBilling(false)
    setBillingNotice(error
      ? { kind: 'error', text: error.message }
      : { kind: 'ok', text: 'Billing details saved. They will appear on receipts from your next purchase.' })
    setTimeout(() => setBillingNotice(null), 5000)
  }

  const handleManagePayment = async () => {
    setRedirecting(true)
    try {
      const res = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else setRedirecting(false)
    } catch (error) {
      console.error('Error redirecting to portal:', error)
      setRedirecting(false)
    }
  }

  const tierClass = (t: string) => t === 'Platinum' ? 'badge-platinum' : t === 'Gold' ? 'badge-gold' : t === 'Silver' ? 'badge-silver' : 'badge-bronze'
  const featuredActive = profile?.featured_employer && (!profile?.featured_until || new Date(profile.featured_until).getTime() > Date.now())

  if (loading) return <DashboardShell role="employer"><div className="space-y-4"><div className="skeleton h-12 w-1/3 mb-6" /><div className="skeleton h-64 w-full" /></div></DashboardShell>

  return (
    <DashboardShell role="employer" userName={profile?.contact_name || profile?.company_name}>
      <div className="mb-8">
        <p className="dashboard-eyebrow">Account</p>
        <h1 className="dashboard-title">Billing & Payment</h1>
        <p className="dashboard-intro">Manage subscriptions, payment methods and job-post history.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="dashboard-card"><div className="text-muted mb-2"><Briefcase size={16} /></div><p className="text-[24px] font-semibold text-ink">{listings.length}</p><p className="text-[11px] text-muted">Total job posts</p></div>
        <div className="dashboard-card"><div className="text-muted mb-2"><CreditCard size={16} /></div><p className="text-[24px] font-semibold text-ink">{listings.filter(l => l.is_live).length}</p><p className="text-[11px] text-muted">Active listings</p></div>
        <div className="dashboard-card"><p className="text-[14px] font-medium text-ink mb-1">Membership tier</p><p className="text-[13px] font-medium text-ink capitalize">{profile?.membership_tier || 'Free'}</p></div>
        <div className={`dashboard-card ${featuredActive ? 'border-[#555555]' : ''}`}><div className="text-[#1c1c1c] mb-2"><Star size={16} fill={featuredActive ? 'currentColor' : 'none'} /></div><p className="text-[14px] font-semibold text-ink">{featuredActive ? 'Featured active' : 'Standard profile'}</p><p className="text-[11px] text-muted mt-1">{featuredActive && profile?.featured_until ? `Until ${new Date(profile.featured_until).toLocaleDateString('en-GB')}` : featuredPrice || 'Featured upgrade available'}</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="dashboard-card lg:col-span-2">
          <p className="text-[14px] font-medium text-ink mb-6">Payment Methods</p>
          <div className="dashboard-card flex items-center justify-between !p-4">
            <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-[#1c1c1c]/10 flex items-center justify-center text-[#1c1c1c]"><CreditCard size={18} /></div><div><p className="text-[13px] font-medium text-ink">Stripe Payment Methods</p><p className="text-[12px] text-muted mt-0.5">Manage stored cards and active subscriptions</p></div></div>
            {(profile?.stripe_customer_id || profile?.membership_stripe_customer_id) ? <button type="button" onClick={handleManagePayment} disabled={redirecting} className="btn-secondary text-[12px] flex items-center gap-1">{redirecting ? 'Redirecting...' : 'Manage'}<ExternalLink size={12} /></button> : <p className="text-[12px] text-muted text-right max-w-[200px]">Billing portal becomes available after your first payment.</p>}
          </div>
        </div>

        <div className="dashboard-card border-[#555555]/50">
          <div className="flex items-center gap-2 text-[#1c1c1c]"><Star size={16} /><p className="text-[14px] font-semibold">Featured Hotel</p></div>
          <p className="mt-3 text-[13px] text-ink">{featuredActive ? 'Your property currently receives premium visibility.' : 'Put your property in front of approved WHC Talent.'}</p>
          <p className="mt-2 text-[12px] leading-5 text-muted">{featuredPrice ? `Current new-subscription price: ${featuredPrice}.` : ''} Pricing shown is current and confirmed at checkout.</p>
          <Link href="/employer/featured" className="btn-primary mt-5 inline-flex text-[12px]">{featuredActive ? 'View Featured status' : 'Get Featured'}</Link>
        </div>
      </div>

      {/* The financial record. Everything here is what actually left the
          account after any discount or promotion code, which is the number a
          hotel's finance team reconciles against. */}
      <div className="dashboard-card mb-8">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
          <p className="text-[14px] font-medium text-ink">Payments &amp; receipts</p>
          <p className="text-[12px] text-muted">Every receipt prints to PDF for your finance team.</p>
        </div>
        {purchases.length === 0 ? (
          <div className="text-center py-8"><FileText size={24} className="mx-auto text-muted mb-2" /><p className="text-[13px] text-muted">No payments yet.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border">
                <th className="text-left text-[12px] font-medium text-muted py-3">Reference</th>
                <th className="text-left text-[12px] font-medium text-muted py-3">Item</th>
                <th className="text-left text-[12px] font-medium text-muted py-3">Date</th>
                <th className="text-left text-[12px] font-medium text-muted py-3">Paid</th>
                <th className="text-right text-[12px] font-medium text-muted py-3">Receipt</th>
              </tr></thead>
              <tbody>{purchases.map(purchase => (
                <tr key={purchase.id} className="border-b border-border">
                  <td className="text-[12px] font-mono text-muted py-3">{purchase.reference}</td>
                  <td className="text-[13px] text-ink font-medium py-3 capitalize">{purchase.label}{purchase.poNumber && <span className="block text-[11px] font-normal text-muted normal-case">PO {purchase.poNumber}</span>}</td>
                  <td className="text-[13px] text-muted py-3">{new Date(purchase.paidAt).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                  <td className="text-[13px] font-medium text-ink py-3">£{purchase.amount.toFixed(2)}</td>
                  <td className="py-3 text-right"><Link href={`/employer/receipts/${purchase.id}`} className="text-[12px] font-medium text-ink underline">View</Link></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>

      {/* Most hotel accounts payable systems reject a document with no purchase
          order on it, and the rejection is silent - the payment simply sits in
          a queue. Entered once here, it prints on everything bought afterwards. */}
      <div className="dashboard-card mb-8">
        <p className="text-[14px] font-medium text-ink">Details for your finance team</p>
        <p className="mt-1 text-[12px] leading-6 text-muted max-w-2xl">
          If your property raises purchase orders, put the reference here and it will appear on every receipt from your
          next purchase onwards. Leave it blank if you do not use them.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="po-ref" className="eyebrow block mb-1.5">Purchase order reference</label>
            <input id="po-ref" value={billing.purchase_order_ref} maxLength={100}
              onChange={e => setBilling({ ...billing, purchase_order_ref: e.target.value })}
              placeholder="e.g. PO-2026-4471" className="input-field font-mono" />
          </div>
          <div>
            <label htmlFor="billing-email" className="eyebrow block mb-1.5">Accounts payable email</label>
            <input id="billing-email" type="email" value={billing.billing_email}
              onChange={e => setBilling({ ...billing, billing_email: e.target.value })}
              placeholder="accounts@yourproperty.com" className="input-field" />
          </div>
        </div>
        <div className="mt-4">
          <label htmlFor="billing-address" className="eyebrow block mb-1.5">Billing address</label>
          <textarea id="billing-address" rows={3} value={billing.billing_address}
            onChange={e => setBilling({ ...billing, billing_address: e.target.value })}
            placeholder="The address your finance team invoices from" className="input-field" />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <button type="button" onClick={saveBilling} disabled={savingBilling} className="btn-primary text-[12px] inline-flex items-center gap-2 disabled:opacity-50">
            <Save size={13} /> {savingBilling ? 'Saving...' : 'Save billing details'}
          </button>
          {billingNotice && <p className={`text-[12px] ${billingNotice.kind === 'ok' ? 'text-emerald-700' : 'text-red-600'}`}>{billingNotice.text}</p>}
        </div>
      </div>

      <div className="dashboard-card">
        <p className="text-[14px] font-medium text-ink">Job posting history</p>
        <p className="mt-1 mb-4 text-[12px] text-muted">List prices, for reference. What you actually paid is in Payments &amp; receipts above.</p>
        {listings.length === 0 ? (
          <div className="text-center py-8"><Briefcase size={24} className="mx-auto text-muted mb-2" /><p className="text-[13px] text-muted">No job postings yet.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border"><th className="text-left text-[12px] font-medium text-muted py-3">Job Title</th><th className="text-left text-[12px] font-medium text-muted py-3">Tier</th><th className="text-left text-[12px] font-medium text-muted py-3">Posted Date</th><th className="text-left text-[12px] font-medium text-muted py-3">Amount (list price)</th><th className="text-left text-[12px] font-medium text-muted py-3">Status</th></tr></thead>
              <tbody>{listings.map(job => <tr key={job.id} className="border-b border-border hover:bg-neutral-50/50 transition-colors"><td className="text-[13px] text-ink font-medium py-3">{job.title}</td><td className="text-[13px] py-3"><span className={`text-[11px] font-medium px-2 py-1 rounded-full ${tierClass(job.tier || 'Standard')}`}>{job.tier || '-'}</span></td><td className="text-[13px] text-muted py-3">{job.posted_date ? new Date(job.posted_date).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}</td><td className="text-[13px] font-medium text-ink py-3">{jobAmount(job)}</td><td className="text-[13px] py-3"><span className={`text-[11px] font-medium px-2 py-1 rounded-full ${job.is_live ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-muted'}`}>{job.is_live ? 'Live' : 'Closed'}</span></td></tr>)}</tbody>
            </table>
            <p className="mt-3 text-[11px] text-muted">Amounts shown are each tier's list price. Member discounts are applied at checkout.</p>
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
