'use client'

import { useEffect, useState } from 'react'
import { CountrySelect, CountryMultiSelect } from '@/components/CountrySelect'
import { DEFAULT_COUNTRY, isUnitedKingdom } from '@/lib/countries'
import { parseLanguageSkills, LANGUAGES } from '@/lib/languages'
import LanguagePicker from '@/components/LanguagePicker'
import { useTaxonomy } from '@/lib/use-sectors'
import { liveSectorGroups } from '@/lib/sectors'
import Link from 'next/link'
import DashboardShell from '@/components/DashboardShell'
import CertificateManager from '@/components/CertificateManager'
import { createClient } from '@/lib/supabase/client'
import CollapsibleCheckboxSection from '@/components/CollapsibleCheckboxSection'
import { ROLE_LEVELS, TRAVEL_OPTIONS, AVAILABILITY_STATUSES } from '@/lib/constants'
import { SERVICES_CATEGORIES, PRODUCT_HOUSES_FULL as PRODUCT_HOUSES, QUALS_CATEGORIES, SYSTEMS_FULL } from '@/lib/taxonomy'
import type { CvSuggestions } from '@/lib/cv-analysis'
import { Save, Upload, FileText, Sparkles, CheckCircle2, Eye, Award, ShieldCheck, BrainCircuit } from 'lucide-react'
import { courseTitle } from '@/lib/academy'
import { tidyProficiencies, PROFICIENCY_OPTIONS } from '@/lib/skill-depth'

const BUSINESS_SKILLS = ['Reception & Front of House','Revenue Management','Stock Control','Team Leadership','Staff Training','Rota Management','KPI Reporting','Health & Safety','COSHH Management','Budget Management','Client Consultation','Upselling & Retail','Social Media','Event Coordination','Membership Management']

export default function TalentProfilePage() {
  const supabase=createClient(); const [profile,setProfile]=useState<any>(null); const [loading,setLoading]=useState(true); const [saving,setSaving]=useState(false); const [message,setMessage]=useState('')
  const [analysingCv,setAnalysingCv]=useState(false); const [cvAiFailure,setCvAiFailure]=useState<string|null>(null)
  const [cvSuggestions,setCvSuggestions]=useState<CvSuggestions|null>(null); const [aiCvConsent,setAiCvConsent]=useState(false)
  // Honest staged upload indicator - the storage API gives no byte-level
  // progress events, so we show real stages (uploading, then saving) rather
  // than fake percentages.
  const [docUpload,setDocUpload]=useState<{kind:'cv'|'insurance';name:string;size:number;stage:'uploading'|'saving'}|null>(null)
  const [academyBadges,setAcademyBadges]=useState<{course_slug:string;completed_at:string;certificate_code?:string}[]>([])

  useEffect(()=>{(async()=>{const {data:{user}}=await supabase.auth.getUser();if(!user)return;const {data}=await supabase.from('candidate_profiles').select('*').eq('user_id',user.id).single();setProfile(data||{});if(data?.id){const {data:completed}=await supabase.from('course_enrollments').select('course_slug,completed_at,certificate_code').eq('candidate_id',data.id).not('completed_at','is',null).order('completed_at',{ascending:false});setAcademyBadges(completed||[])}setLoading(false)})()},[])
  const u=(field:string,value:any)=>setProfile((p:any)=>({...p,[field]:value}))
  // Sectors live in a join table rather than on the profile row, so they load
  // and save on their own rather than with the rest of the form.
  const {taxonomy}=useTaxonomy()
  const sectorGroups=liveSectorGroups(taxonomy)
  const [sectorIds,setSectorIds]=useState<string[]>([])
  const [savingSectors,setSavingSectors]=useState(false)
  useEffect(()=>{fetch('/api/talent/sectors').then(r=>r.ok?r.json():null).then(d=>{if(Array.isArray(d?.sectorIds))setSectorIds(d.sectorIds)}).catch(()=>{})},[])
  async function toggleSector(id:string){
    const next=sectorIds.includes(id)?sectorIds.filter(x=>x!==id):[...sectorIds,id]
    setSectorIds(next);setSavingSectors(true)
    const res=await fetch('/api/talent/sectors',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({sectorIds:next})}).catch(()=>null)
    setSavingSectors(false)
    if(!res||!res.ok){setMessage('Your sectors could not be saved.');setTimeout(()=>setMessage(''),4000)}
  }

  const completionChecklist:[string,boolean][]=[['Full name',!!profile?.full_name],['Role level',!!profile?.role_level],['Headline',!!profile?.headline],['About you',!!profile?.bio],['Treatments & services',(profile?.services_offered?.length||0)>0],['Qualifications',(profile?.qualifications?.length||0)>0],['CV uploaded',!!profile?.cv_url],['Years of experience',!!profile?.experience_years],['Postcode',!!profile?.postcode],['Business skills',(profile?.business_skills?.length||0)>0]]
  const completionItems=completionChecklist.map(([,done])=>done)
  const missingItems=completionChecklist.filter(([,done])=>!done).map(([label])=>label)
  const completionPct=profile?Math.round(completionItems.filter(Boolean).length/completionItems.length*100):0

  // Depth is asked for the things it is scored on: treatments and business
  // skills. Product houses, qualifications and systems are held or not held.
  const depthSkills:string[]=Array.from(new Set([...(profile?.services_offered||[]),...(profile?.business_skills||[])])).filter(Boolean)

  async function handleSave(){if(!profile?.id)return;setSaving(true);setMessage('');const data={full_name:profile.full_name,language_skills:parseLanguageSkills(profile.language_skills),cv_language:profile.cv_language||null,phone:profile.phone||null,postcode:profile.postcode||null,...(profile.postcode?{location:profile.postcode}:{}),country_code:profile.country_code||DEFAULT_COUNTRY,open_to_countries:profile.open_to_countries?.length?profile.open_to_countries:null,has_car:!!profile.has_car,role_level:profile.role_level||null,headline:profile.headline||null,bio:profile.bio||null,experience_years:profile.experience_years?parseInt(profile.experience_years):null,day_rate_min:profile.day_rate_min?parseInt(profile.day_rate_min):null,day_rate_max:profile.day_rate_max?parseInt(profile.day_rate_max):null,availability_status:profile.availability_status||null,right_to_work:profile.right_to_work||null,services_offered:profile.services_offered?.length?profile.services_offered:null,product_houses:profile.product_houses?.length?profile.product_houses:null,qualifications:profile.qualifications?.length?profile.qualifications:null,systems_experience:profile.systems_experience?.length?profile.systems_experience:null,business_skills:profile.business_skills?.length?profile.business_skills:null,skill_proficiencies:tidyProficiencies(profile.skill_proficiencies,depthSkills),career_evidence:profile.career_evidence?.length?profile.career_evidence:null,travel_availability:profile.travel_availability||'uk_only',travel_radius_miles:profile.travel_radius_miles?parseInt(profile.travel_radius_miles):null,has_insurance:!!profile.has_insurance,salary_expectation_private:profile.salary_expectation_private!==false,salary_expectation_min:profile.salary_expectation_min?parseInt(profile.salary_expectation_min):null,salary_expectation_max:profile.salary_expectation_max?parseInt(profile.salary_expectation_max):null,commercial_experience:profile.commercial_experience||null,revenue_responsibility:profile.revenue_responsibility||null,team_size_managed:profile.team_size_managed?parseInt(profile.team_size_managed):null,desired_roles:profile.desired_roles?.length?profile.desired_roles:null,portfolio_url:profile.portfolio_url||null,profile_completion_score:completionPct,profile_completion_pct:completionPct}
    const res=await fetch('/api/profile/update',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({profileId:profile.id,data})});const result=await res.json().catch(()=>({}));setSaving(false);setMessage(res.ok?'Profile saved.':result.error||'Save failed');setTimeout(()=>setMessage(''),4000)}

  const userId=profile?.user_id||profile?.id
  async function uploadViaApi(file:File,bucket:string,path:string,column?:string){const fd=new FormData();fd.append('file',file);fd.append('bucket',bucket);fd.append('path',path);if(profile?.id&&column){fd.append('profileId',profile.id);fd.append('column',column)}const res=await fetch('/api/upload',{method:'POST',body:fd});const data=await res.json();if(!res.ok){setMessage(`Upload failed: ${data.error}`);return null}return data.url as string}
  async function handlePhotoUpload(e:React.ChangeEvent<HTMLInputElement>){const file=e.target.files?.[0];if(!file||!userId)return;const ext=file.name.split('.').pop()||'jpg';const url=await uploadViaApi(file,'site-images',`${userId}/profile/photo.${ext}`,'profile_image_url');if(url){u('profile_image_url',url);setMessage('Photo updated.')}}
  async function handleCvUpload(e:React.ChangeEvent<HTMLInputElement>){
    const file=e.target.files?.[0];e.target.value='';if(!file||!userId||docUpload)return
    const ext=file.name.split('.').pop()||'pdf'
    setMessage('');setDocUpload({kind:'cv',name:file.name,size:file.size,stage:'uploading'})
    const url=await uploadViaApi(file,'talent-documents',`${userId}/cv.${ext}`)
    if(!url){setDocUpload(null);return}
    setDocUpload(current=>current?{...current,stage:'saving'}:current)
    const res=await fetch('/api/profile/update',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({profileId:profile.id,data:{cv_url:url}})})
    setDocUpload(null)
    if(!res.ok){const result=await res.json().catch(()=>({}));setMessage(result.error||'We could not save your CV - please try again.');return}
    u('cv_url',url);setCvSuggestions(null);setCvAiFailure(null);setAiCvConsent(false);setMessage('CV uploaded. You can now choose whether to analyse it with Talent House AI.')
  }
  async function handleInsuranceUpload(e:React.ChangeEvent<HTMLInputElement>){
    const file=e.target.files?.[0];e.target.value='';if(!file||!userId||docUpload)return
    const ext=file.name.split('.').pop()||'pdf'
    setMessage('');setDocUpload({kind:'insurance',name:file.name,size:file.size,stage:'uploading'})
    const url=await uploadViaApi(file,'talent-documents',`${userId}/insurance.${ext}`)
    if(!url){setDocUpload(null);return}
    setDocUpload(current=>current?{...current,stage:'saving'}:current)
    const res=await fetch('/api/profile/update',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({profileId:profile.id,data:{insurance_document_url:url}})})
    setDocUpload(null)
    if(!res.ok){const result=await res.json().catch(()=>({}));setMessage(result.error||'We could not save your insurance certificate - please try again.');return}
    u('insurance_document_url',url);setMessage('Insurance certificate uploaded.')
  }
  async function handleCertsUpload(e:React.ChangeEvent<HTMLInputElement>){const files=e.target.files;if(!files||!userId)return;const urls:string[]=[...(profile.certificates_urls||[])];for(const file of Array.from(files)){const url=await uploadViaApi(file,'talent-documents',`${userId}/cert_${Date.now()}_${file.name}`);if(url)urls.push(url)}await fetch('/api/profile/update',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({profileId:profile.id,data:{certificates_urls:urls}})});u('certificates_urls',urls);setMessage('Certificates uploaded.')}
  async function removeCertificate(url:string,index:number){
    if(!profile?.id)return
    if(!window.confirm(`Remove Certificate ${index+1} from your profile?`))return
    const urls=(profile.certificates_urls||[]).filter((item:string)=>item!==url)
    const res=await fetch('/api/profile/update',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({profileId:profile.id,data:{certificates_urls:urls}})})
    const result=await res.json().catch(()=>({}))
    if(!res.ok){setMessage(result.error||'Could not remove certificate.');return}
    u('certificates_urls',urls)
    setMessage('Certificate removed from your profile.')
  }

  async function analyseCurrentCv(){if(!profile?.id||!profile?.cv_url||!aiCvConsent)return;setAnalysingCv(true);setMessage('');const res=await fetch('/api/cv/analyse',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({profileId:profile.id,aiConsent:true})});const result=await res.json().catch(()=>({}));setAnalysingCv(false);if(!res.ok){setMessage(result.error||'CV analysis failed');return}setCvAiFailure(result.aiFailure||null);setCvSuggestions(result.suggestions)}
  function applyCvSuggestions(){if(!cvSuggestions)return;setProfile((c:any)=>({...c,role_level:cvSuggestions.roleLevel||c.role_level,experience_years:cvSuggestions.experienceYears||c.experience_years,services_offered:Array.from(new Set([...(c.services_offered||[]),...(cvSuggestions.services||[])])),product_houses:Array.from(new Set([...(c.product_houses||[]),...(cvSuggestions.productHouses||[])])),qualifications:Array.from(new Set([...(c.qualifications||[]),...(cvSuggestions.qualifications||[])])),systems_experience:Array.from(new Set([...(c.systems_experience||[]),...(cvSuggestions.systems||[])])),business_skills:Array.from(new Set([...(c.business_skills||[]),...(cvSuggestions.businessSkills||[])])),career_evidence:Array.from(new Set([...(c.career_evidence||[]),...(cvSuggestions.careerEvidence||[])]))}));setCvSuggestions(null);setMessage('Suggestions added for your review. Nothing becomes final until you Save Changes.')}

  if(loading)return <DashboardShell role="talent"><div className="h-64 flex items-center justify-center">Loading…</div></DashboardShell>
  if(!profile?.id)return <DashboardShell role="talent"><p>Profile not found.</p></DashboardShell>
  return <DashboardShell role="talent" userName={profile.full_name}><div className="max-w-3xl">
    <div className="flex items-center justify-between gap-3 mb-2"><div><p className="dashboard-eyebrow">Career profile</p><h1 className="dashboard-title">Edit Profile</h1></div><div className="flex gap-2"><Link href="/talent/profile/preview" className="btn-secondary inline-flex items-center gap-2"><Eye size={14}/>Preview</Link><button onClick={handleSave} disabled={saving} className="btn-primary inline-flex items-center gap-2"><Save size={14}/>{saving?'Saving...':'Save Changes'}</button></div></div>
    <div className="mb-8"><div className="flex items-center gap-3"><div className="flex-1 h-1.5 bg-[#e7e7e7] rounded-full overflow-hidden"><div className="h-full bg-[#1c1c1c]" style={{width:`${completionPct}%`}}/></div><span className="text-[12px]">{completionPct}%</span></div>{missingItems.length>0&&<p className="mt-2 text-[12px] text-[#1c1c1c]">To reach 100%, add: {missingItems.join(', ')}. <a href="/talent/onboarding" className="font-semibold underline">Use the Skills Wizard →</a></p>}{missingItems.length===0&&<p className="mt-2 text-[12px] text-emerald-700">Your profile is complete - it will rank at full strength in matching.</p>}

      {/* The CV is the reason to finish the profile. A document that visibly
          has no qualifications on it argues for adding them better than any
          reminder does, and a complete profile is the only thing that makes
          matching worth anything. It is also the Talent House name landing on
          a desk that has never heard of it. */}
      <div className="mt-4 rounded-xl border border-border bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-lg">
            <p className="text-[13px] font-semibold text-ink">Your CV, built from this profile</p>
            <p className="mt-1 text-[11.5px] leading-5 text-secondary">
              {missingItems.length>0
                ? `Everything above goes onto it. It will download now, but ${missingItems.length===1?'one section is':`${missingItems.length} sections are`} still empty and will simply be missing from the page.`
                : 'Everything above is on it, with your Academy certificates and their verification codes.'}
            </p>
          </div>
          <a href="/api/talent/cv" className="btn-secondary text-[12px] whitespace-nowrap">Download my CV</a>
        </div>
      </div></div>
    {message&&<div role="status" className="mb-6 rounded-lg bg-[#f1f1f1] px-4 py-3 text-[12px] text-[#555555]">{message}</div>}
    <div className="space-y-6">
      <section className="dashboard-card"><p className="eyebrow">Talent House Academy achievements</p>{academyBadges.length?<div className="mt-4 space-y-2">{academyBadges.map(b=><div key={b.course_slug} className="flex justify-between border border-border rounded-lg p-3"><div><p className="text-[13px] font-semibold">{courseTitle(b.course_slug)}</p><p className="text-[10px] text-muted">Completed {new Date(b.completed_at).toLocaleDateString('en-GB')}</p></div><Award size={17}/></div>)}</div>:<p className="text-[12px] text-muted mt-2">Completed Academy courses will appear here.</p>}</section>

      <section className="dashboard-card space-y-4"><p className="eyebrow">Personal details</p><div className="flex items-center gap-4"><div className="w-16 h-16 rounded-full overflow-hidden bg-[#e7e7e7]">{profile.profile_image_url&&<img fetchPriority="high" decoding="async" src={profile.profile_image_url} alt="Your profile photo" className="w-full h-full object-cover"/>}</div><label className="btn-secondary cursor-pointer inline-flex gap-2"><Upload size={13}/>Upload Photo<input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload}/></label></div><div className="grid sm:grid-cols-2 gap-4"><Field label="Full name"><input className="input-field" value={profile.full_name||''} onChange={e=>u('full_name',e.target.value)}/></Field><Field label="Phone"><input className="input-field" value={profile.phone||''} onChange={e=>u('phone',e.target.value)}/></Field><CountrySelect id="country_code" label="Country you live in" value={profile.country_code} onChange={code=>u('country_code',code)} hint="Agency Cover is UK only. Roles, Residency and Consultancy are open wherever you are."/><Field label={isUnitedKingdom(profile.country_code)?'Postcode':'Town or city'}><input className="input-field" placeholder={isUnitedKingdom(profile.country_code)?'BD20 5QG':'Dubai'} value={profile.postcode||''} onChange={e=>u('postcode',e.target.value)}/></Field><Field label="Right to work in the UK (visa, settled status or citizenship)"><select className="input-field" value={profile.right_to_work||''} onChange={e=>u('right_to_work',e.target.value)}><option value="">Select</option><option value="uk">Right to work in the UK</option><option value="ireland">Right to work in Ireland</option><option value="uk_ireland">Right to work in UK & Ireland</option><option value="visa_required">Visa / sponsorship required</option></select></Field></div></section>

      {sectorGroups.length>0&&(
        <section className="dashboard-card space-y-4">
          <div>
            <p className="eyebrow">Sectors you work in</p>
            <p className="mt-1 text-[12px] leading-5 text-secondary">Choose every sector you take work in. Properties and brands search by sector, so leaving one out means missing the roles behind it. You can change these at any time.{savingSectors?' Saving...':''}</p>
          </div>
          {sectorGroups.map(group=>(
            <div key={group.door.id} className="border-t border-border pt-4">
              <p className="text-[10px] font-semibold uppercase tracking-[.15em] text-muted">{group.door.label}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {group.sectors.map(sector=>{
                  const on=sectorIds.includes(sector.id)
                  return (
                    <button key={sector.id} type="button" onClick={()=>toggleSector(sector.id)} aria-pressed={on}
                      className={`border px-3 py-1.5 text-[12px] font-medium transition-colors ${on?'border-ink bg-ink text-white':'border-border bg-white text-body hover:border-secondary'}`}>
                      {sector.label}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </section>
      )}

      <section className="dashboard-card space-y-4"><p className="eyebrow">Professional details</p><Field label="Current role level"><select className="input-field" value={profile.role_level||''} onChange={e=>u('role_level',e.target.value)}><option value="">Select</option>{ROLE_LEVELS.map(r=><option key={r}>{r}</option>)}</select></Field><Field label="Headline"><input className="input-field" value={profile.headline||''} onChange={e=>u('headline',e.target.value)} placeholder="e.g. Spa Manager | Luxury Hospitality | Commercial & People Leadership"/></Field><Field label="Bio"><textarea rows={4} className="input-field" value={profile.bio||''} onChange={e=>u('bio',e.target.value)}/></Field><div className="grid sm:grid-cols-3 gap-4"><Field label="Experience years"><input type="number" className="input-field" value={profile.experience_years||''} onChange={e=>u('experience_years',e.target.value)}/></Field>{profile.agency_available?<><Field label="Agency day rate min (£)"><input type="number" className="input-field" value={profile.day_rate_min||''} onChange={e=>u('day_rate_min',e.target.value)}/></Field><Field label="Agency day rate max (£)"><input type="number" className="input-field" value={profile.day_rate_max||''} onChange={e=>u('day_rate_max',e.target.value)}/></Field></>:null}</div><Field label="Availability"><select className="input-field" value={profile.availability_status||''} onChange={e=>u('availability_status',e.target.value)}>{AVAILABILITY_STATUSES.map(a=><option key={a.value} value={a.value}>{a.label}</option>)}</select></Field></section>

      {/* Languages, not nationality. A property with Gulf guests needs Arabic;
          one taking French coach parties needs French. That is a genuine
          occupational requirement and lawful to ask. Nationality is a protected
          characteristic, and right to work - which the profile already carries -
          is the lawful version of what an employer actually needs to know. */}
      <section className="dashboard-card space-y-4">
        <div>
          <p className="eyebrow">Languages</p>
          <p className="mt-1 text-[12px] leading-6 text-secondary">
            Properties search on language. A therapist who speaks the language of their guests is worth more to a spa,
            and this is one of the few things that will put you in front of a property nobody else reaches.
          </p>
        </div>
        <LanguagePicker value={profile?.language_skills} onChange={skills => u('language_skills', skills)} />

        <div className="border-t border-border pt-4">
          <label htmlFor="cv-language" className="eyebrow block mb-1.5">What language is your CV written in?</label>
          <select
            id="cv-language" value={profile?.cv_language || 'en'}
            onChange={event => u('cv_language', event.target.value)}
            className="input-field sm:max-w-xs"
          >
            {LANGUAGES.map(language => <option key={language.code} value={language.code}>{language.label}</option>)}
          </select>
          <p className="mt-1.5 text-[11px] leading-5 text-muted">
            Upload your CV in whichever language you write best. A property seeing a strong CV in Italian reads
            international experience; a weak one in English reads as something else entirely.
          </p>
        </div>
      </section>

      <section className="dashboard-card space-y-4"><p className="eyebrow">Salary & career goals</p><p className="text-[12px] text-secondary -mt-1">Your salary expectation stays private and helps Talent House show you roles that genuinely pay what you want. The leadership questions below are <b className="text-ink">completely optional</b> - they matter for management and director roles, and skipping them never counts against you. If you're focused on treatments, just set your salary expectation and move on.</p><div className="grid sm:grid-cols-2 gap-4"><Field label="Salary expectation - from (£/year)"><input type="number" className="input-field" value={profile.salary_expectation_min||''} onChange={e=>u('salary_expectation_min',e.target.value)} placeholder="e.g. 48000"/></Field><Field label="Salary expectation - to (£/year)"><input type="number" className="input-field" value={profile.salary_expectation_max||''} onChange={e=>u('salary_expectation_max',e.target.value)} placeholder="e.g. 56000"/></Field></div><label className="flex items-start gap-2.5 cursor-pointer"><input type="checkbox" checked={profile.salary_expectation_private!==false} onChange={e=>u('salary_expectation_private',e.target.checked)} className="mt-0.5 w-4 h-4"/><span className="text-[12px] leading-5 text-secondary"><b className="text-ink">Keep my salary expectation private.</b> Talent House still uses it to score how well roles pay against what you want - but the number itself is never shown to employers unless you untick this.</span></label><div className="grid sm:grid-cols-2 gap-4"><Field label="Largest team managed"><input type="number" className="input-field" value={profile.team_size_managed||''} onChange={e=>u('team_size_managed',e.target.value)} placeholder="e.g. 12"/></Field><Field label="Revenue responsibility"><input className="input-field" value={profile.revenue_responsibility||''} onChange={e=>u('revenue_responsibility',e.target.value)} placeholder="e.g. £1.2m annual spa revenue"/></Field></div><Field label="Commercial experience"><textarea rows={3} className="input-field" value={profile.commercial_experience||''} onChange={e=>u('commercial_experience',e.target.value)} placeholder="Budgets, retail targets, membership growth, yield, KPIs you have owned..."/></Field><Field label="Portfolio or LinkedIn URL"><input className="input-field" value={profile.portfolio_url||''} onChange={e=>u('portfolio_url',e.target.value)} placeholder="https://..." /></Field></section>

      <CollapsibleCheckboxSection title="Services Offered" categories={SERVICES_CATEGORIES} selected={profile.services_offered||[]} onChange={v=>u('services_offered',v)}/>
      <CollapsibleCheckboxSection title="Product Houses" flatItems={PRODUCT_HOUSES} selected={profile.product_houses||[]} onChange={v=>u('product_houses',v)}/>
      <CollapsibleCheckboxSection title="Qualifications & Certifications" categories={QUALS_CATEGORIES} selected={profile.qualifications||[]} onChange={v=>u('qualifications',v)}/>
      <CollapsibleCheckboxSection title="Systems Experience" flatItems={SYSTEMS_FULL} selected={profile.systems_experience||[]} onChange={v=>u('systems_experience',v)}/>
      <CollapsibleCheckboxSection title="Leadership & Business Skills" flatItems={BUSINESS_SKILLS} selected={profile.business_skills||[]} onChange={v=>u('business_skills',v)}/>

      {/* Skill depth.
          The Skills Wizard asks how good you are at each thing and writes it
          to skill_proficiencies. This page never did, so a skill added here
          arrived with no depth against it - and Skill Depth is a scored
          matching factor. It is not that the profile page wiped anything: it
          simply never filled it in, so the factor quietly shrank every time
          somebody edited their skills outside the wizard. */}
      {depthSkills.length>0&&<section className="dashboard-card space-y-4">
        <div><p className="eyebrow">Skill depth</p><h2 className="text-[23px] mt-1">How good are you at each of these?</h2>
        <p className="text-[12px] text-secondary mt-2">Employers score depth, not just the list. Anything left unset is treated as intermediate, which is fair but never wins you a role you would actually walk. This is the same question the Skills Wizard asks, so the two stay in step.</p></div>
        <div className="divide-y divide-[#ececec]">
          {depthSkills.map(skill=><div key={skill} className="flex items-center justify-between gap-4 py-2.5">
            <span className="text-[13px] text-ink">{skill}</span>
            <select aria-label={`Proficiency for ${skill}`} className="input-field !py-1.5 !px-2 !text-[12px] w-36"
              value={(profile.skill_proficiencies||{})[skill]||'intermediate'}
              onChange={e=>u('skill_proficiencies',{...(profile.skill_proficiencies||{}),[skill]:e.target.value})}>
              {PROFICIENCY_OPTIONS.map(level=><option key={level} value={level}>{level[0].toUpperCase()+level.slice(1)}</option>)}
            </select>
          </div>)}
        </div>
      </section>}

      <section className="dashboard-card space-y-4"><div className="flex items-start justify-between gap-4"><div><p className="eyebrow">CV intelligence</p><h2 className="text-[23px] mt-1">Turn your CV into better matching evidence.</h2><p className="text-[12px] text-secondary mt-2">Talent House first extracts exact facts, then - only when you choose - uses AI to identify transferable leadership and commercial evidence. AI suggestions never change your profile automatically.</p></div><BrainCircuit size={22} className="text-[#555555]"/></div>
        {docUpload?.kind==='cv'?<div className="border border-border p-4" aria-live="polite"><div className="flex items-center gap-2 text-[12px] text-ink"><FileText size={14} className="shrink-0"/><span className="truncate flex-1">{docUpload.name}</span><span className="shrink-0 text-muted">{formatFileSize(docUpload.size)}</span></div><div className="progress-track mt-3"><div className="progress-indeterminate"/></div><p className="mt-2 text-[11px] text-secondary">{docUpload.stage==='uploading'?'Uploading your CV...':'Saving...'}</p></div>
        :profile.cv_url?<div className="flex items-center gap-2 border border-border rounded-lg p-3"><FileText size={14}/><a href={profile.cv_url} target="_blank" rel="noopener noreferrer" className="text-[13px] flex-1 truncate">Current CV</a><label className="text-[11px] cursor-pointer">Replace<input type="file" accept=".pdf,.docx" className="hidden" disabled={!!docUpload} onChange={handleCvUpload}/></label></div>:<label className="border border-dashed border-border rounded-lg p-5 text-center cursor-pointer block"><Upload size={16} className="mx-auto mb-2"/><span className="text-[12px]">Upload CV (PDF or .docx)</span><input type="file" accept=".pdf,.docx" className="hidden" disabled={!!docUpload} onChange={handleCvUpload}/></label>}
        {profile.cv_url&&<><label className="flex items-start gap-3 rounded-lg border border-[#dddddd] bg-[#f1f1f1] p-4"><input type="checkbox" checked={aiCvConsent} onChange={e=>setAiCvConsent(e.target.checked)} className="mt-1"/><span className="text-[11px] leading-5 text-secondary"><strong className="text-ink">Analyse my CV with Talent House AI.</strong> I understand Talent House will process the text of my CV to create career and matching suggestions. The raw CV text is not added to my public profile and suggestions are not saved unless I approve them.</span></label><button type="button" onClick={analyseCurrentCv} disabled={!aiCvConsent||analysingCv} className="btn-primary w-full inline-flex items-center justify-center gap-2 disabled:opacity-40"><Sparkles size={14}/>{analysingCv?'Analysing privately...':'Analyse CV with Talent House AI'}</button></>}
        {cvSuggestions&&<div className="rounded-xl border border-[#dddddd] bg-white p-5 space-y-4"><div className="flex items-start gap-2"><ShieldCheck size={17} className="text-[#555555]"/><div><p className="text-[14px] font-semibold">Suggestions ready</p><p className="text-[11px] text-muted">{cvSuggestions.aiEnhanced?'AI-enhanced analysis completed.':`Exact CV extraction completed. The AI half did not run${cvAiFailure?`: ${cvAiFailure}`:''}`}</p></div></div><div className="grid sm:grid-cols-2 gap-3 text-[12px]"><Mini label="Current role" value={cvSuggestions.roleLevel||'Not confidently detected'}/><Mini label="Experience" value={cvSuggestions.experienceYears?`${cvSuggestions.experienceYears} years`:'Not confidently detected'}/><Mini label="Business skills" value={`${cvSuggestions.businessSkills?.length||0} found`}/><Mini label="Career evidence" value={`${cvSuggestions.careerEvidence?.length||0} evidence points`}/></div>
          {!!cvSuggestions.progressionSignals?.length&&<div><p className="eyebrow mb-2">Progression signals</p>{cvSuggestions.progressionSignals.map(x=><p key={x} className="text-[12px] leading-5 text-secondary flex gap-2 mb-2"><CheckCircle2 size={13} className="mt-1 shrink-0"/>{x}</p>)}</div>}
          {!!cvSuggestions.careerEvidence?.length&&<div><p className="eyebrow mb-2">Evidence found in your CV</p>{cvSuggestions.careerEvidence.map(x=><p key={x} className="text-[12px] leading-5 text-secondary flex gap-2 mb-2"><CheckCircle2 size={13} className="mt-1 shrink-0"/>{x}</p>)}</div>}
          <div className="flex gap-2"><button onClick={applyCvSuggestions} className="btn-primary flex-1">Use approved suggestions</button><button onClick={()=>setCvSuggestions(null)} className="btn-secondary">Dismiss</button></div></div>}
      </section>

      {!!profile.career_evidence?.length&&<section className="dashboard-card"><p className="eyebrow">Career evidence used in matching</p><p className="text-[11px] text-muted mt-1">These are short evidence statements you approved from your CV. They help Talent House recognise progression potential without changing your current job title.</p><div className="mt-4 space-y-2">{profile.career_evidence.map((x:string)=><div key={x} className="flex gap-2 text-[12px] text-secondary"><CheckCircle2 size={13} className="mt-1 shrink-0"/>{x}</div>)}</div></section>}

      <section className="dashboard-card space-y-4"><p className="eyebrow">Documents & insurance</p><CertificateManager userId={userId}/><label className="flex gap-2 text-[13px]"><input type="checkbox" checked={!!profile.has_insurance} onChange={e=>u('has_insurance',e.target.checked)}/>I have professional insurance (optional unless a role requires it)</label>{profile.has_insurance&&(docUpload?.kind==='insurance'?<div className="border border-border p-4" aria-live="polite"><div className="flex items-center gap-2 text-[12px] text-ink"><FileText size={14} className="shrink-0"/><span className="truncate flex-1">{docUpload.name}</span><span className="shrink-0 text-muted">{formatFileSize(docUpload.size)}</span></div><div className="progress-track mt-3"><div className="progress-indeterminate"/></div><p className="mt-2 text-[11px] text-secondary">{docUpload.stage==='uploading'?'Uploading your certificate...':'Saving...'}</p></div>:profile.insurance_document_url?<a href={profile.insurance_document_url} target="_blank" rel="noopener noreferrer" className="text-[12px] underline">View insurance certificate</a>:<label className="btn-secondary inline-flex cursor-pointer">Upload insurance<input type="file" accept=".pdf" className="hidden" disabled={!!docUpload} onChange={handleInsuranceUpload}/></label>)}</section>

      <section className="dashboard-card space-y-4"><p className="eyebrow">Travel preferences</p><div className="flex flex-wrap gap-2">{TRAVEL_OPTIONS.map(t=><button type="button" key={t.value} onClick={()=>u('travel_availability',t.value)} className={`px-4 py-2 rounded-lg text-[12px] border ${profile.travel_availability===t.value?'bg-[#1c1c1c] text-white border-[#1c1c1c]':'bg-white border-border'}`}>{t.label}</button>)}</div>{profile.travel_availability==='radius'&&<Field label="Travel radius (miles)"><input type="number" className="input-field" value={profile.travel_radius_miles||''} onChange={e=>u('travel_radius_miles',e.target.value)}/></Field>}<div className="border-t border-border pt-4"><CountryMultiSelect values={profile.open_to_countries||[]} onChange={codes=>u('open_to_countries',codes)} label="Countries you would work in" hint="A resort in the Maldives cannot find you unless you say you would go. Leave this empty and you are matched only where you live."/></div></section>
      <button onClick={handleSave} disabled={saving} className="btn-primary w-full inline-flex justify-center gap-2"><Save size={14}/>{saving?'Saving...':'Save All Changes'}</button>
    </div>
  </div></DashboardShell>
}

function formatFileSize(bytes:number){if(bytes>=1048576)return `${(bytes/1048576).toFixed(1)} MB`;if(bytes>=1024)return `${Math.round(bytes/1024)} KB`;return `${bytes} B`}
function Field({label,children}:{label:string;children:React.ReactNode}){return <div><label className="block"><span className="eyebrow block mb-1.5">{label}</span>{children}</label></div>}
function Mini({label,value}:{label:string;value:string}){return <div className="rounded-lg bg-[#f1f1f1] p-3"><p className="text-[10px] text-muted">{label}</p><p className="font-semibold text-ink mt-1">{value}</p></div>}