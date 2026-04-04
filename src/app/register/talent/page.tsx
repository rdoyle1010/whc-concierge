'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ROLE_LEVELS, TRAVEL_OPTIONS, AVAILABILITY_STATUSES } from '@/lib/constants'
import CollapsibleCheckboxSection from '@/components/CollapsibleCheckboxSection'
import { Upload, Check } from 'lucide-react'

// ─── SECTION A: Services Offered ───
const SERVICES_CATEGORIES = [
  { name: 'Massage & Bodywork', items: ['Swedish Massage', 'Deep Tissue Massage', 'Hot Stone Massage', 'Sports Massage', 'Lymphatic Drainage', 'Pregnancy Massage', 'Thai Massage', 'Lomi Lomi', 'Shiatsu', 'Reflexology', 'Aromatherapy Massage'] },
  { name: 'Facial Treatments', items: ['Classic Facial', 'Anti-Ageing Facial', 'Microdermabrasion', 'Chemical Peel', 'LED Therapy', 'Microneedling', 'Dermaplaning', 'Hydrafacial', 'Lymphatic Facial', 'Bespoke Facial'] },
  { name: 'Body Treatments', items: ['Body Wrap', 'Body Scrub', 'Hydrotherapy', 'Mud Treatment', 'Thalassotherapy', 'Detox Treatment', 'Slimming Treatment'] },
  { name: 'Beauty & Aesthetics', items: ['Manicure', 'Pedicure', 'Gel Nails', 'Nail Art', 'Lash Extensions', 'Lash Lift & Tint', 'Brow Shaping', 'Brow Lamination', 'HD Brows', 'Waxing', 'Threading', 'Tinting', 'Semi-Permanent Makeup', 'Spray Tan'] },
  { name: 'Hair', items: ['Cutting', 'Colouring', 'Highlights', 'Blow Dry', 'Hair Up', 'Keratin Treatment', 'Scalp Treatment', 'Barbering'] },
  { name: 'Wellness & Movement', items: ['Yoga', 'Pilates', 'Meditation', 'Breathwork', 'Sound Healing', 'Reiki', 'Crystal Healing', 'Chakra Balancing', 'Hypnotherapy', 'Life Coaching', 'Nutrition Consultation', 'Personal Training', 'Fitness Classes', 'Swimming Instruction', 'Golf Instruction'] },
  { name: 'Holistic & Eastern', items: ['Acupuncture', 'Acupressure', 'Ayurvedic Treatments', 'Abhyanga', 'Shirodhara', 'Marma Therapy', 'Traditional Chinese Medicine', 'Cupping', 'Gua Sha', 'Moxibustion'] },
  { name: 'Medical Aesthetics', items: ['Botox/Fillers', 'Laser Hair Removal', 'IPL', 'Skin Peels', 'Mesotherapy', 'PRP', 'Collagen Induction', 'HIFU'] },
  { name: 'Water Therapies', items: ['Flotation Therapy', 'Watsu', 'Aqua Wellness', 'Hydrotherapy Pool'] },
]

// ─── SECTION B: Product Houses ───
const PRODUCT_HOUSES_FULL = [
  'ESPA', 'Elemis', 'Decléor', 'Comfort Zone', 'La Stone', 'Kama Ayurveda',
  '111SKIN', 'Wildsmith', 'Dr Barbara Sturm', 'VOYA', 'Bamford',
  'Subtle Energies', 'Sodashi', 'Ila Spa', 'Thalgo', 'Guinot', 'Dermalogica',
  'IMAGE Skincare', 'Environ', 'Medik8', 'Murad', 'Payot', 'Caudalie',
  'Clarins', 'Sisley', 'La Mer', 'Darphin', 'Valmont', 'Biologique Recherche',
  'QMS Medicosmetics', 'Intraceuticals', 'Babor', 'Germaine de Capuccini',
  'Anne Semonin', 'Susanne Kaufmann', 'Aromatherapy Associates',
  'REN Clean Skincare', 'Eve Lom', 'Liz Earle', 'Cowshed', 'Oriela Frank',
  'Grown Alchemist', 'Mauli Rituals', 'Temple Spa', 'Sothys', 'Repêchage', 'Other',
]

// ─── SECTION C: Qualifications & Certifications ───
const QUALIFICATIONS_CATEGORIES = [
  { name: 'Industry Qualifications', items: ['CIDESCO', 'CIBTAC', 'ITEC', 'VTCT', 'City & Guilds', 'BTEC Level 2 Beauty', 'BTEC Level 3 Beauty', 'NVQ Level 2 Beauty', 'NVQ Level 3 Beauty', 'NVQ Level 4 Beauty', 'NVQ Level 2 Hairdressing', 'NVQ Level 3 Hairdressing', 'HND Beauty', 'Degree in Beauty Therapy'] },
  { name: 'Specialist Certifications', items: ['First Aid', 'Manual Handling', 'COSHH', 'Food Hygiene Level 2', 'Level 3 Sports Massage', 'Level 4 Sports Massage', 'Ayurvedic Practitioner Diploma', 'Hot Stone Certified', 'Lymphatic Drainage Certified', 'Pregnancy Massage Certified', 'Medical Aesthetics Certificate', 'Laser/IPL Certified', 'Dermaplaning Certified', 'Microneedling Certified', 'Reflexology Diploma', 'Aromatherapy Diploma', 'Reiki Level 1', 'Reiki Level 2', 'Reiki Master', 'Yoga Teacher 200hr', 'Yoga Teacher 500hr', 'Pilates Instructor', 'Personal Training Level 3', 'Nutrition Advisor', 'Life Coach Certificate'] },
  { name: 'Systems', items: ['Book4Time', 'SpaSoft', 'Mindbody', 'Spa Booker', 'Treatwell', 'Premier Software', 'Rezlynx', 'Opera PMS', 'Concept', 'Shortcuts', 'Salon IQ', 'Other'] },
]

export default function TalentRegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    // Step 1
    email: '', password: '', confirmPassword: '',
    full_name: '', phone: '', postcode: '', has_car: false,
    // Step 2
    role_level: '', bio: '', experience_years: '', headline: '',
    day_rate_min: '', day_rate_max: '', availability_status: 'immediately',
    // Step 3
    services_offered: [] as string[],
    product_houses: [] as string[],
    qualifications: [] as string[],
    travel_availability: 'uk_only',
    travel_radius_miles: '', travel_postcode: '',
    // Step 4
    has_insurance: false,
    agreed_terms: false,
  })

  const [cvFile, setCvFile] = useState<File | null>(null)
  const [certFiles, setCertFiles] = useState<File[]>([])
  const [insuranceFile, setInsuranceFile] = useState<File | null>(null)

  const update = (field: string, value: any) => setForm({ ...form, [field]: value })

  const uploadFile = async (file: File, path: string): Promise<string | null> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('bucket', 'talent-documents')
    formData.append('path', path)
    const res = await fetch('/api/upload', { method: 'POST', body: formData })
    const data = await res.json()
    return res.ok ? data.url : null
  }

  const handleSubmit = async () => {
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return }
    setLoading(true)
    setError('')

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email, password: form.password,
      options: { data: { role: 'talent', full_name: form.full_name } }
    })
    if (authError) { setError(authError.message); setLoading(false); return }
    if (!authData.user) { setError('Registration failed'); setLoading(false); return }

    const userId = authData.user.id

    // Upload documents
    let cv_url: string | null = null
    let insurance_document_url: string | null = null
    let certificates_urls: string[] = []

    if (cvFile) cv_url = await uploadFile(cvFile, `${userId}/cv.${cvFile.name.split('.').pop() || 'pdf'}`)
    if (insuranceFile) insurance_document_url = await uploadFile(insuranceFile, `${userId}/insurance.${insuranceFile.name.split('.').pop() || 'pdf'}`)
    for (const cert of certFiles) {
      const url = await uploadFile(cert, `${userId}/certificates/${Date.now()}-${cert.name}`)
      if (url) certificates_urls.push(url)
    }

    // Calculate completion score
    let score = 0
    if (form.full_name) score += 10
    if (form.phone) score += 5
    if (form.role_level) score += 15
    if (form.bio) score += 10
    if (form.headline) score += 5
    if (form.services_offered.length > 0) score += 15
    if (form.product_houses.length > 0) score += 10
    if (form.qualifications.length > 0) score += 15
    if (cv_url) score += 10
    if (form.has_insurance) score += 5

    // Extract systems from qualifications (they're stored together in the form)
    const systemsList = ['Book4Time', 'SpaSoft', 'Mindbody', 'Spa Booker', 'Treatwell', 'Premier Software', 'Rezlynx', 'Opera PMS', 'Concept', 'Shortcuts', 'Salon IQ', 'Other']
    const systems_experience = form.qualifications.filter(q => systemsList.includes(q))
    const qualifications_only = form.qualifications.filter(q => !systemsList.includes(q))

    // Insert profile — NO email column (email lives in auth.users)
    const profileData: Record<string, any> = {
      user_id: userId,
      full_name: form.full_name,
      phone: form.phone || null,
      postcode: form.postcode || null,
      location: form.postcode || null,
      has_car: form.has_car,
      role_level: form.role_level || null,
      bio: form.bio || null,
      headline: form.headline || null,
      experience_years: form.experience_years ? parseInt(form.experience_years) : null,
      day_rate_min: form.day_rate_min ? parseInt(form.day_rate_min) : null,
      day_rate_max: form.day_rate_max ? parseInt(form.day_rate_max) : null,
      availability_status: form.availability_status,
      services_offered: form.services_offered.length > 0 ? form.services_offered : null,
      product_houses: form.product_houses.length > 0 ? form.product_houses : null,
      qualifications: qualifications_only.length > 0 ? qualifications_only : null,
      systems_experience: systems_experience.length > 0 ? systems_experience : null,
      travel_availability: form.travel_availability,
      travel_radius_miles: form.travel_radius_miles ? parseInt(form.travel_radius_miles) : null,
      has_insurance: form.has_insurance,
      insurance_document_url,
      cv_url,
      certificates_urls: certificates_urls.length > 0 ? certificates_urls : null,
      approval_status: 'pending',
      profile_completion_score: score,
    }

    // POST to server-side API route (uses service role key to bypass RLS)
    const res = await fetch('/api/register/talent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, profileData }),
    })
    const result = await res.json()

    if (!res.ok) {
      setError(result.error || 'Failed to create profile')
      setLoading(false)
      return
    }

    router.push('/talent/dashboard')
  }

  const stepValid = (s: number) => {
    if (s === 1) return form.full_name && form.email && form.password && form.password === form.confirmPassword
    if (s === 2) return form.role_level
    return true
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-neutral-100 px-4 py-4 flex items-center justify-between max-w-3xl mx-auto">
        <Link href="/" className="text-black font-semibold tracking-tight">WHC Concierge</Link>
        <Link href="/login?role=talent" className="text-sm text-neutral-400 hover:text-black">Already have an account?</Link>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-black mb-2">Create your profile</h1>
        <p className="text-neutral-400 mb-10">Join the luxury wellness careers community</p>

        {/* Progress */}
        <div className="flex items-center space-x-2 mb-10">
          {[1,2,3,4].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div className={`w-8 h-8 flex items-center justify-center text-sm font-medium ${
                step > s ? 'bg-black text-white' : step === s ? 'border-2 border-black text-black' : 'border border-neutral-200 text-neutral-300'
              }`}>{step > s ? <Check size={14} /> : s}</div>
              {s < 4 && <div className={`flex-1 h-px mx-2 ${step > s ? 'bg-black' : 'bg-neutral-200'}`} />}
            </div>
          ))}
        </div>

        {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 mb-6">{error}</div>}

        {/* ── Step 1: Account & Personal ── */}
        {step === 1 && (
          <div className="space-y-5">
            <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-6">Step 1 — Account & Personal Details</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Full Name *</label><input type="text" value={form.full_name} onChange={(e) => update('full_name', e.target.value)} className="input-field" /></div>
              <div className="col-span-2"><label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Email *</label><input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} className="input-field" /></div>
              <div><label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Password *</label><input type="password" value={form.password} onChange={(e) => update('password', e.target.value)} className="input-field" /></div>
              <div><label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Confirm *</label><input type="password" value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} className="input-field" /></div>
              <div><label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Phone</label><input type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} className="input-field" /></div>
              <div><label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Postcode</label><input type="text" value={form.postcode} onChange={(e) => update('postcode', e.target.value)} className="input-field" /></div>
            </div>
            <label className="flex items-center space-x-3 cursor-pointer py-2">
              <input type="checkbox" checked={form.has_car} onChange={(e) => update('has_car', e.target.checked)} className="w-4 h-4 border-neutral-300 text-black focus:ring-black rounded-sm" />
              <span className="text-sm text-neutral-600">I have access to a car</span>
            </label>
            <button type="button" onClick={() => setStep(2)} disabled={!stepValid(1)} className="btn-primary w-full disabled:opacity-40">Continue</button>
          </div>
        )}

        {/* ── Step 2: Professional Profile ── */}
        {step === 2 && (
          <div className="space-y-5">
            <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-6">Step 2 — Professional Profile</p>
            <div>
              <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Role Level *</label>
              <select value={form.role_level} onChange={(e) => update('role_level', e.target.value)} className="input-field">
                <option value="">Select your role level</option>
                {ROLE_LEVELS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div><label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Headline</label><input type="text" value={form.headline} onChange={(e) => update('headline', e.target.value)} className="input-field" placeholder="e.g. Senior Spa Therapist | CIDESCO Qualified | 8 Years Experience" /></div>
            <div><label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Bio</label><textarea rows={4} value={form.bio} onChange={(e) => update('bio', e.target.value)} className="input-field" placeholder="Tell employers about your experience and what you're looking for..." /></div>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Experience (years)</label><input type="number" value={form.experience_years} onChange={(e) => update('experience_years', e.target.value)} className="input-field" /></div>
              <div><label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Day Rate Min (£)</label><input type="number" value={form.day_rate_min} onChange={(e) => update('day_rate_min', e.target.value)} className="input-field" /></div>
              <div><label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Day Rate Max (£)</label><input type="number" value={form.day_rate_max} onChange={(e) => update('day_rate_max', e.target.value)} className="input-field" /></div>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Availability</label>
              <select value={form.availability_status} onChange={(e) => update('availability_status', e.target.value)} className="input-field">
                {AVAILABILITY_STATUSES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </div>
            <div className="flex gap-3"><button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1">Back</button><button type="button" onClick={() => setStep(3)} disabled={!stepValid(2)} className="btn-primary flex-1 disabled:opacity-40">Continue</button></div>
          </div>
        )}

        {/* ── Step 3: Services, Product Houses, Qualifications ── */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-4">Step 3 — Skills & Qualifications</p>

            {/* Section A: Services Offered */}
            <CollapsibleCheckboxSection
              title="A — Services Offered"
              categories={SERVICES_CATEGORIES}
              selected={form.services_offered}
              onChange={(v) => update('services_offered', v)}
            />

            {/* Section B: Product Houses */}
            <CollapsibleCheckboxSection
              title="B — Product Houses"
              flatItems={PRODUCT_HOUSES_FULL}
              selected={form.product_houses}
              onChange={(v) => update('product_houses', v)}
            />

            {/* Section C: Qualifications & Certifications */}
            <CollapsibleCheckboxSection
              title="C — Qualifications & Certifications"
              categories={QUALIFICATIONS_CATEGORIES}
              selected={form.qualifications}
              onChange={(v) => update('qualifications', v)}
            />

            {/* Travel */}
            <div className="pt-4">
              <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">Travel Availability</label>
              <div className="flex flex-wrap gap-2">
                {TRAVEL_OPTIONS.map((t) => (
                  <button type="button" key={t.value} onClick={() => update('travel_availability', t.value)}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${form.travel_availability === t.value ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-500'}`}>
                    {t.label}
                  </button>
                ))}
              </div>
              {form.travel_availability === 'radius' && (
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div><label className="block text-xs text-neutral-500 mb-1">Miles</label><input type="number" value={form.travel_radius_miles} onChange={(e) => update('travel_radius_miles', e.target.value)} className="input-field" placeholder="25" /></div>
                  <div><label className="block text-xs text-neutral-500 mb-1">From Postcode</label><input type="text" value={form.travel_postcode} onChange={(e) => update('travel_postcode', e.target.value)} className="input-field" /></div>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4"><button type="button" onClick={() => setStep(2)} className="btn-secondary flex-1">Back</button><button type="button" onClick={() => setStep(4)} className="btn-primary flex-1">Continue</button></div>
          </div>
        )}

        {/* ── Step 4: Documents ── */}
        {step === 4 && (
          <div className="space-y-6">
            <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-2">Step 4 — Documents & Verification</p>

            <div>
              <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">CV (PDF or Word)</label>
              <label className="flex items-center justify-center border border-dashed border-neutral-300 py-6 cursor-pointer hover:border-black transition-colors">
                <div className="text-center"><Upload size={20} className="mx-auto text-neutral-300 mb-2" /><p className="text-sm text-neutral-400">{cvFile ? cvFile.name : 'Click to upload CV'}</p></div>
                <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setCvFile(e.target.files?.[0] || null)} className="hidden" />
              </label>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Certificates (PDFs)</label>
              <label className="flex items-center justify-center border border-dashed border-neutral-300 py-6 cursor-pointer hover:border-black transition-colors">
                <div className="text-center"><Upload size={20} className="mx-auto text-neutral-300 mb-2" /><p className="text-sm text-neutral-400">{certFiles.length > 0 ? `${certFiles.length} file(s) selected` : 'Click to upload certificates'}</p></div>
                <input type="file" accept=".pdf" multiple onChange={(e) => setCertFiles(Array.from(e.target.files || []))} className="hidden" />
              </label>
            </div>

            <div>
              <label className="flex items-center space-x-3 cursor-pointer mb-2">
                <input type="checkbox" checked={form.has_insurance} onChange={(e) => update('has_insurance', e.target.checked)} className="w-4 h-4 border-neutral-300 text-black focus:ring-black rounded-sm" />
                <span className="text-sm text-neutral-600">I have professional insurance</span>
              </label>
              {form.has_insurance && (
                <label className="flex items-center justify-center border border-dashed border-neutral-300 py-4 cursor-pointer hover:border-black transition-colors mt-2">
                  <div className="text-center"><p className="text-sm text-neutral-400">{insuranceFile ? insuranceFile.name : 'Upload insurance certificate'}</p></div>
                  <input type="file" accept=".pdf" onChange={(e) => setInsuranceFile(e.target.files?.[0] || null)} className="hidden" />
                </label>
              )}
            </div>

            {/* Terms & Conditions */}
            <div className="border border-border rounded-lg p-4 max-h-48 overflow-y-auto text-[12px] text-secondary leading-relaxed">
              <p className="font-medium text-ink mb-2">Terms & Conditions</p>
              <p className="mb-2">By creating a profile on WHC Concierge, you agree to the following:</p>
              <p className="mb-2">1. <strong>Accuracy of information:</strong> All information provided in your profile, including qualifications, experience, and availability, must be accurate and up to date. WHC Concierge reserves the right to remove profiles containing false or misleading information.</p>
              <p className="mb-2">2. <strong>Profile review:</strong> All profiles are subject to review and approval by the WHC Concierge team. We may request additional documentation to verify your qualifications.</p>
              <p className="mb-2">3. <strong>Professional conduct:</strong> You agree to conduct yourself professionally in all interactions facilitated through the platform, including with employers, properties, and other practitioners.</p>
              <p className="mb-2">4. <strong>Data protection:</strong> Your personal data will be processed in accordance with our <a href="/privacy" className="underline text-ink">Privacy Policy</a>. We will share relevant profile information with employers who view or match with your profile.</p>
              <p className="mb-2">5. <strong>Agency bookings:</strong> For agency shifts booked through the platform, a 10% platform fee applies to the agreed rate. Payment terms are agreed between you and the property.</p>
              <p className="mb-2">6. <strong>Insurance:</strong> If you indicate you hold professional insurance, you may be asked to provide proof. For roles requiring insurance, you must maintain valid cover throughout the engagement.</p>
              <p className="mb-2">7. <strong>Intellectual property:</strong> All content, design, and functionality of WHC Concierge remains the property of Wellness House Collective Ltd.</p>
              <p>8. <strong>Termination:</strong> We reserve the right to suspend or remove your profile at any time if you breach these terms or engage in conduct that is harmful to the platform or its users.</p>
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={form.agreed_terms} onChange={(e) => update('agreed_terms', e.target.checked)} className="w-4 h-4 border-border rounded text-ink focus:ring-ink mt-0.5" />
              <span className="text-[13px] text-secondary">I have read and agree to the <Link href="/terms" className="underline text-ink">Terms & Conditions</Link> and <Link href="/privacy" className="underline text-ink">Privacy Policy</Link></span>
            </label>

            <div className="bg-surface p-4 rounded-lg text-[13px] text-muted">
              Your profile will be reviewed by our team within 24 hours. You&apos;ll receive an email once approved.
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(3)} className="btn-secondary flex-1">Back</button>
              <button type="button" onClick={handleSubmit} disabled={loading || !form.agreed_terms} className="btn-primary flex-1 disabled:opacity-40">
                {loading ? 'Creating profile...' : 'Submit for Approval'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
