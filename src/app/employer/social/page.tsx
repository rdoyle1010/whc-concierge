'use client'

import { useEffect, useMemo, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { Megaphone, Linkedin, Facebook, Instagram, Mail, Link as LinkIcon, MessageCircle, Copy, ExternalLink, Sparkles, CheckCircle2 } from 'lucide-react'

const SITE = 'https://talent.wellnesshousecollective.co.uk'

export default function EmployerSocialPage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data: prof } = await supabase.from('employer_profiles').select('*').eq('user_id', user.id).maybeSingle()
      setProfile(prof)
      if (prof) {
        const { data } = await supabase.from('job_listings').select('*').eq('employer_id', prof.id).order('posted_date', { ascending: false })
        setJobs((data || []).map((j: any) => ({ ...j, title: j.job_title || j.title, description: j.job_description || j.description })))
      }
      setLoading(false)
    }
    load()
  }, [])

  const liveJobs = useMemo(() => jobs.filter(j => j.is_live && j.status === 'active'), [jobs])

  const shareText = (job: any) => {
    const salary = job.salary_display_text || (job.salary_min && job.salary_max ? `£${Number(job.salary_min).toLocaleString()}–£${Number(job.salary_max).toLocaleString()}` : 'Competitive salary')
    return `${profile?.company_name || 'We are'} hiring: ${job.title}\n${job.location || ''}${job.job_type ? ` · ${job.job_type}` : ''}\n${salary}\n\nApply through Wellness House Collective:`
  }

  const jobUrl = (job: any) => `${SITE}/jobs/${job.id}`

  function open(url: string) {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  async function copy(value: string, key: string) {
    await navigator.clipboard.writeText(value)
    setCopied(key)
    window.setTimeout(() => setCopied(''), 1800)
  }

  async function nativeShare(job: any) {
    const data = { title: `${job.title} at ${profile?.company_name || 'Wellness House Collective'}`, text: shareText(job), url: jobUrl(job) }
    if (navigator.share) {
      try { await navigator.share(data); return } catch {}
    }
    await copy(`${data.text}\n${data.url}`, `native-${job.id}`)
  }

  const platforms = [
    { name: 'LinkedIn', icon: Linkedin, status: 'Share now', text: 'Share the live WHC job link into your company or personal LinkedIn feed.' },
    { name: 'Facebook', icon: Facebook, status: 'Share now', text: 'Share live vacancies directly to Facebook with the WHC application link.' },
    { name: 'Instagram', icon: Instagram, status: 'Caption ready', text: 'Copy a recruitment-ready caption and job link for your Instagram post or Story.' },
    { name: 'Meta Ads', icon: Megaphone, status: 'Planned', text: 'Paid Facebook and Instagram recruitment campaigns through a Meta Business connection are planned.' },
  ]

  return <DashboardShell role="employer" userName={profile?.company_name}>
    <div className="mb-8">
      <p className="dashboard-eyebrow">Recruitment marketing</p>
      <h1 className="dashboard-title">Social & Advertising</h1>
      <p className="dashboard-intro">Post a role once in WHC, then share the same live application link across LinkedIn, Facebook, Instagram, WhatsApp and email. This keeps applicants coming back to one job record and one application process.</p>
    </div>

    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 mb-9">
      {platforms.map(({ name, icon: Icon, status, text }) => <div key={name} className="dashboard-card">
        <div className="flex items-start justify-between gap-3"><div className="h-10 w-10 rounded-lg bg-[#f3f0eb] text-[#1c1b1a] flex items-center justify-center"><Icon size={18}/></div><span className="text-[10px] uppercase tracking-[.12em] text-[#57534e]">{status}</span></div>
        <h2 className="text-[20px] mt-4">{name}</h2><p className="text-[12px] leading-5 text-secondary mt-2">{text}</p>
      </div>)}
    </div>

    <div className="dashboard-card mb-8 bg-[#1c1b1a] text-white border-[#1c1b1a]">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div><p className="text-[9px] uppercase tracking-[.18em] text-white/55">One role. Multiple channels.</p><h2 className="text-white text-[26px] mt-2">Every share sends candidates back to WHC.</h2><p className="text-[13px] leading-6 text-white/65 mt-2 max-w-3xl">That means the property keeps one applicant list, one shortlist, one set of messages and one source of truth instead of losing applications across several social platforms.</p></div>
        <div className="flex flex-wrap gap-2 text-[11px]"><span className="rounded-full border border-white/15 px-3 py-1.5">LinkedIn</span><span className="rounded-full border border-white/15 px-3 py-1.5">Facebook</span><span className="rounded-full border border-white/15 px-3 py-1.5">Instagram</span><span className="rounded-full border border-white/15 px-3 py-1.5">WhatsApp</span></div>
      </div>
    </div>

    <section>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4"><div><p className="dashboard-eyebrow">Live vacancies</p><h2 className="dashboard-section-title">Promote a job</h2></div><a href="/employer/jobs" className="btn-secondary text-center">Manage job listings</a></div>
      {loading ? <div className="skeleton h-44 rounded-lg"/> : liveJobs.length === 0 ? <div className="dashboard-card py-12 text-center"><Megaphone size={24} className="mx-auto text-[#57534e] mb-3"/><h3 className="text-[20px]">No live jobs to promote</h3><p className="text-[12px] text-secondary mt-2">Once a paid job is live it will appear here with its social sharing controls.</p></div> : <div className="space-y-4">{liveJobs.map(job => {
        const url = jobUrl(job)
        const text = shareText(job)
        const encodedUrl = encodeURIComponent(url)
        const encodedText = encodeURIComponent(`${text}\n${url}`)
        return <article key={job.id} className="dashboard-card">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
            <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="text-[22px]">{job.title}</h3><span className="text-[10px] uppercase tracking-[.1em] rounded-full bg-green-50 text-green-700 px-2.5 py-1">Live</span></div><p className="text-[12px] text-secondary mt-1">{job.location} {job.job_type ? `· ${job.job_type}` : ''}</p><p className="text-[11px] text-muted mt-2 truncate max-w-3xl">{url}</p></div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`)} className="btn-secondary inline-flex items-center gap-2"><Linkedin size={14}/>LinkedIn</button>
              <button onClick={() => open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`)} className="btn-secondary inline-flex items-center gap-2"><Facebook size={14}/>Facebook</button>
              <button onClick={() => copy(`${text}\n${url}`, `ig-${job.id}`)} className="btn-secondary inline-flex items-center gap-2"><Instagram size={14}/>{copied === `ig-${job.id}` ? 'Caption copied' : 'Instagram caption'}</button>
              <button onClick={() => open(`https://wa.me/?text=${encodedText}`)} className="btn-secondary inline-flex items-center gap-2"><MessageCircle size={14}/>WhatsApp</button>
              <button onClick={() => open(`mailto:?subject=${encodeURIComponent(`${job.title} vacancy`)}&body=${encodedText}`)} className="btn-secondary inline-flex items-center gap-2"><Mail size={14}/>Email</button>
              <button onClick={() => copy(url, `url-${job.id}`)} className="btn-secondary inline-flex items-center gap-2"><LinkIcon size={14}/>{copied === `url-${job.id}` ? 'Copied' : 'Copy link'}</button>
              <button onClick={() => nativeShare(job)} className="btn-primary inline-flex items-center gap-2"><ExternalLink size={14}/>Share</button>
            </div>
          </div>
        </article>
      })}</div>}
    </section>

    <section className="mt-9">
      <div className="mb-4"><p className="dashboard-eyebrow">Managed campaigns - coming soon</p><h2 className="dashboard-section-title">Let WHC run the promotion for you</h2><p className="text-[12px] text-secondary mt-1 max-w-2xl">These managed options are not available to purchase yet. Register your interest and we will contact you when they launch.</p></div>
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="dashboard-card"><Sparkles size={18} className="text-[#57534e]"/><h3 className="text-[19px] mt-4">WHC Social Feature</h3><p className="text-[12px] leading-5 text-secondary mt-2">WHC features your vacancy through its own LinkedIn, Instagram, Facebook and employer newsletter channels.</p><a href="/contact" className="btn-secondary inline-flex mt-4 text-[12px]">Register interest</a></div>
        <div className="dashboard-card"><Megaphone size={18} className="text-[#57534e]"/><h3 className="text-[19px] mt-4">Meta Recruitment Campaign</h3><p className="text-[12px] leading-5 text-secondary mt-2">A managed Facebook and Instagram recruitment advert using the live WHC application link.</p><a href="/contact" className="btn-secondary inline-flex mt-4 text-[12px]">Register interest</a></div>
        <div className="dashboard-card"><CheckCircle2 size={18} className="text-[#57534e]"/><h3 className="text-[19px] mt-4">Multi-channel campaign</h3><p className="text-[12px] leading-5 text-secondary mt-2">One WHC job distributed and measured across LinkedIn and Meta channels.</p><a href="/contact" className="btn-secondary inline-flex mt-4 text-[12px]">Register interest</a></div>
      </div>
    </section>

    <div className="mt-8 border border-[#e0dad2] bg-[#f3f0eb] p-5 text-[12px] leading-6 text-secondary">
      <strong className="text-ink">About account connections:</strong> Sharing tools and social-ready content are available now. Posting directly into your company LinkedIn Jobs account or a paid Meta Ads account requires you to authorise those platforms first - we will let you know when those connections become available.
    </div>
  </DashboardShell>
}
