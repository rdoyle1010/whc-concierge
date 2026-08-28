import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { supabase } from '../../src/lib/supabase'
import MultiSelectField from '../../src/components/MultiSelectField'
import { palette, radius, space, type } from '../../src/lib/theme'

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL || 'https://talent.wellnesshousecollective.co.uk'
const BUSINESS_SKILLS = ['Reception & Front of House','Revenue Management','Stock Control','Team Leadership','Staff Training','Rota Management','KPI Reporting','Health & Safety','COSHH Management','Budget Management','Client Consultation','Upselling & Retail','Social Media','Event Coordination','Membership Management']

type FormState = {
  job_title: string
  job_description: string
  location: string
  location_postcode: string
  radius_miles: string
  job_type: string
  contract_type: string
  required_role_level: string
  candidate_scope: string
  salary_min: string
  salary_max: string
  required_skills: string[]
  required_brands: string[]
  required_qualifications: string[]
  required_systems: string[]
  preferred_business_skills: string[]
  min_years_experience: string
  shift_pattern: string
  requirements: string
  benefits: string
  offers_accommodation: boolean
  insurance_required: boolean
  is_agency_role: boolean
  is_residency_role: boolean
}

type Taxonomy = { skills: string[]; brands: string[]; qualifications: string[]; systems: string[] }

const blank: FormState = {
  job_title: '', job_description: '', location: '', location_postcode: '', radius_miles: '', job_type: 'Full-time', contract_type: 'permanent',
  required_role_level: '', candidate_scope: 'step_up', salary_min: '', salary_max: '', required_skills: [], required_brands: [], required_qualifications: [], required_systems: [], preferred_business_skills: [],
  min_years_experience: '', shift_pattern: '', requirements: '', benefits: '', offers_accommodation: false, insurance_required: false, is_agency_role: false, is_residency_role: false,
}

export default function EmployerJobEditor() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const isNew = id === 'new'
  const [form, setForm] = useState<FormState>(blank)
  const [taxonomy, setTaxonomy] = useState<Taxonomy>({ skills: [], brands: [], qualifications: [], systems: [] })
  const [job, setJob] = useState<any>(null)
  const [loading, setLoading] = useState(!isNew)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')

  useEffect(() => { void loadTaxonomy(); if (!isNew) void load() }, [id])

  async function loadTaxonomy() {
    try {
      const [skills, brands, qualifications, systems] = await Promise.all([
        supabase.from('skills').select('name').eq('is_active', true).order('sort_order').order('name'),
        supabase.from('product_houses').select('name').eq('is_active', true).order('sort_order').order('name'),
        supabase.from('certifications').select('name').eq('is_active', true).order('sort_order').order('name'),
        supabase.from('systems').select('name').eq('is_active', true).order('sort_order').order('name'),
      ])
      setTaxonomy({
        skills: (skills.data || []).map(row => row.name).filter(Boolean),
        brands: (brands.data || []).map(row => row.name).filter(Boolean),
        qualifications: (qualifications.data || []).map(row => row.name).filter(Boolean),
        systems: (systems.data || []).map(row => row.name).filter(Boolean),
      })
    } catch { /* matching selectors remain empty rather than blocking job editing */ }
  }

  async function token() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) throw new Error('Your session has expired. Please sign in again.')
    return session.access_token
  }

  async function authFetch(path: string, options?: RequestInit) {
    const access = await token()
    const response = await fetch(`${WEB_URL}${path}`, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${access}`, ...(options?.headers || {}) } })
    const body = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(body?.error || 'Could not update this role.')
    return body
  }

  async function load() {
    setLoading(true); setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }
      const { data: employer } = await supabase.from('employer_profiles').select('id').eq('user_id', user.id).maybeSingle()
      if (!employer) throw new Error('Employer profile not found.')
      const { data, error: queryError } = await supabase.from('job_listings').select('*').eq('id', id).eq('employer_id', employer.id).maybeSingle()
      if (queryError || !data) throw new Error(queryError?.message || 'Role not found.')
      setJob(data)
      setForm({
        job_title: data.job_title || '', job_description: data.job_description || '', location: data.location || '', location_postcode: data.location_postcode || '', radius_miles: data.radius_miles ? String(data.radius_miles) : '',
        job_type: data.job_type || 'Full-time', contract_type: data.contract_type || 'permanent', required_role_level: data.required_role_level || '', candidate_scope: data.candidate_scope || 'step_up',
        salary_min: data.salary_min ? String(data.salary_min) : '', salary_max: data.salary_max ? String(data.salary_max) : '', required_skills: data.required_skills || [], required_brands: data.required_brands || data.required_product_houses || [],
        required_qualifications: data.required_qualifications || [], required_systems: data.required_systems || [], preferred_business_skills: data.preferred_business_skills || [], min_years_experience: data.min_years_experience ? String(data.min_years_experience) : '',
        shift_pattern: data.shift_pattern || '', requirements: Array.isArray(data.requirements) ? data.requirements.join('\n') : '', benefits: Array.isArray(data.benefits) ? data.benefits.join('\n') : '', offers_accommodation: Boolean(data.offers_accommodation),
        insurance_required: Boolean(data.insurance_required), is_agency_role: Boolean(data.is_agency_role), is_residency_role: Boolean(data.is_residency_role),
      })
    } catch (e: any) { setError(e?.message || 'Could not load role.') } finally { setLoading(false) }
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) { setForm(current => ({ ...current, [key]: value })) }

  function payload() {
    return {
      ...form,
      radius_miles: form.radius_miles ? Number(form.radius_miles) : null,
      salary_min: form.salary_min ? Number(form.salary_min) : null,
      salary_max: form.salary_max ? Number(form.salary_max) : null,
      min_years_experience: form.min_years_experience ? Number(form.min_years_experience) : 0,
      requirements: form.requirements.split('\n').map(v => v.trim()).filter(Boolean),
      benefits: form.benefits.split('\n').map(v => v.trim()).filter(Boolean),
    }
  }

  function validate() {
    if (form.job_title.trim().length < 5) return 'Job title must be at least 5 characters.'
    if (form.job_description.trim().length < 10) return 'Add a meaningful job description.'
    if (!form.location.trim()) return 'Location is required.'
    if (form.radius_miles && (Number(form.radius_miles) < 1 || Number(form.radius_miles) > 250)) return 'Search radius must be between 1 and 250 miles.'
    if (form.salary_min && form.salary_max && Number(form.salary_min) > Number(form.salary_max)) return 'Minimum salary cannot be higher than maximum salary.'
    return ''
  }

  async function saveDraft() {
    const validation = validate(); if (validation) { Alert.alert('Complete the role', validation); return null }
    setBusy('save'); setError('')
    try {
      if (isNew) {
        const result = await authFetch('/api/employer/jobs/create', { method: 'POST', body: JSON.stringify({ ...payload(), tier: 'Bronze', status: 'draft', is_live: false }) })
        Alert.alert('Draft saved', 'Your role is saved. You can publish it when you are ready.')
        router.replace({ pathname: '/employer-job/[id]', params: { id: result.job.id } })
        return result.job.id as string
      }
      const result = await authFetch('/api/mobile/employer/jobs/manage', { method: 'POST', body: JSON.stringify({ action: 'edit', jobId: id, ...payload() }) })
      setJob(result.job); Alert.alert('Saved', 'Your role has been updated.'); return id
    } catch (e: any) { setError(e?.message || 'Could not save role.'); return null } finally { setBusy('') }
  }

  async function publish(tier: 'Bronze' | 'Platinum') {
    const validation = validate(); if (validation) { Alert.alert('Complete the role', validation); return }
    setBusy(`publish-${tier}`); setError('')
    try {
      let jobId = id
      if (isNew) {
        const created = await authFetch('/api/employer/jobs/create', { method: 'POST', body: JSON.stringify({ ...payload(), tier, status: 'draft', is_live: false }) })
        jobId = created.job.id
      } else {
        await authFetch('/api/mobile/employer/jobs/manage', { method: 'POST', body: JSON.stringify({ action: 'edit', jobId, ...payload() }) })
      }
      const result = await authFetch('/api/mobile/employer/jobs/manage', { method: 'POST', body: JSON.stringify({ action: 'publish', jobId, tier }) })
      if (result.included) {
        Alert.alert('Role is live', `Published using your Group job allowance. ${result.remainingJobs} included Standard jobs remain.`)
        router.replace('/jobs'); return
      }
      if (result.url) {
        const amount = Number(result.amountPence || 0) / 100
        Alert.alert('Secure checkout', `Your ${tier === 'Bronze' ? 'Standard' : 'Featured'} Job is £${amount.toFixed(0)}. Stripe will open next.`)
        await Linking.openURL(result.url)
      }
    } catch (e: any) { setError(e?.message || 'Could not publish role.') } finally { setBusy('') }
  }

  async function changeStatus(action: 'closed' | 'filled') {
    if (!id || isNew) return
    Alert.alert(action === 'filled' ? 'Mark role filled?' : 'Close role?', action === 'filled' ? 'The role will come down and everyone who applied will be emailed that it has been filled.' : 'The role will come down immediately.', [
      { text: 'Cancel', style: 'cancel' },
      { text: action === 'filled' ? 'Mark filled' : 'Close role', style: 'destructive', onPress: async () => {
        setBusy(action); setError('')
        try {
          const result = await authFetch('/api/employer/jobs/status', { method: 'POST', body: JSON.stringify({ jobId: id, action }) })
          Alert.alert(action === 'filled' ? 'Role filled' : 'Role closed', action === 'filled' ? `${result.notified || 0} applicant email${result.notified === 1 ? '' : 's'} sent.` : 'The role is no longer live.')
          router.replace('/jobs')
        } catch (e: any) { setError(e?.message || 'Could not update role.') } finally { setBusy('') }
      } },
    ])
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color={palette.ink} /></View>
  const closed = ['closed', 'filled'].includes(String(job?.status || ''))
  const live = Boolean(job?.is_live) && job?.status === 'active'

  return <ScrollView style={styles.scroll} contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
    <Pressable onPress={() => router.back()} style={styles.backButton}><Text style={styles.back}>‹ Back</Text></Pressable>
    <Text style={styles.eyebrow}>EMPLOYER · RECRUITMENT</Text>
    <Text style={styles.title}>{isNew ? 'Post a role' : 'Manage role'}</Text>
    <Text style={styles.intro}>Write the role properly once. These details power matching, applications and Interview Ready, so only mark something required when it genuinely matters.</Text>

    {job ? <View style={[styles.statusCard,live&&styles.statusCardLive,closed&&styles.statusCardClosed]}>
      <View><Text style={styles.statusEyebrow}>ROLE STATUS</Text><Text style={styles.status}>{String(job.status || 'draft').replace(/_/g,' ').toUpperCase()}</Text></View>
      <Text style={styles.statusCopy}>{live ? 'This role is currently live and visible to Talent.' : closed ? 'This role is closed and can no longer be edited.' : 'This role is saved but is not live yet.'}</Text>
    </View> : null}
    {error ? <Text style={styles.error}>{error}</Text> : null}

    <SectionHeader eyebrow="01 · ROLE" title="Role basics" copy="Give candidates enough information to understand the opportunity before they ever apply." />
    <Field label="Job title"><TextInput editable={!closed} value={form.job_title} onChangeText={v => update('job_title', v)} style={styles.input} placeholder="e.g. Director of Spa" placeholderTextColor={palette.quiet} /></Field>
    <Field label="Job description"><TextInput editable={!closed} value={form.job_description} onChangeText={v => update('job_description', v)} style={[styles.input, styles.textarea]} multiline placeholder="Responsibilities, priorities, reporting line, team size and what success looks like..." placeholderTextColor={palette.quiet} /></Field>
    <View style={styles.two}><View style={styles.flex}><Field label="Location"><TextInput editable={!closed} value={form.location} onChangeText={v => update('location', v)} style={styles.input} placeholderTextColor={palette.quiet} /></Field></View><View style={styles.flex}><Field label="Postcode"><TextInput editable={!closed} autoCapitalize="characters" value={form.location_postcode} onChangeText={v => update('location_postcode', v)} style={styles.input} placeholderTextColor={palette.quiet} /></Field></View></View>
    <View style={styles.two}><View style={styles.flex}><Field label="Search radius (miles)"><TextInput editable={!closed} value={form.radius_miles} onChangeText={v => update('radius_miles', v)} keyboardType="number-pad" style={styles.input} placeholder="25" placeholderTextColor={palette.quiet} /></Field></View><View style={styles.flex}><Field label="Role level"><TextInput editable={!closed} value={form.required_role_level} onChangeText={v => update('required_role_level', v)} style={styles.input} placeholder="e.g. Spa Manager" placeholderTextColor={palette.quiet} /></Field></View></View>
    <View style={styles.two}><View style={styles.flex}><Field label="Job type"><TextInput editable={!closed} value={form.job_type} onChangeText={v => update('job_type', v)} style={styles.input} /></Field></View><View style={styles.flex}><Field label="Contract"><TextInput editable={!closed} value={form.contract_type} onChangeText={v => update('contract_type', v)} style={styles.input} /></Field></View></View>

    <Field label="Who should WHC consider?">
      <Text style={styles.fieldHelp}>This changes who enters the match pool. Choose the broadest level you would genuinely interview.</Text>
      <View style={styles.scopeRow}>{[['same_level','Same level'],['step_up','Ready to step up'],['emerging','Emerging'],['open_transferable','Transferable']].map(([value,label]) => <Pressable disabled={closed} key={value} onPress={() => update('candidate_scope', value)} style={[styles.scope,form.candidate_scope===value&&styles.scopeActive]}><Text style={[styles.scopeText,form.candidate_scope===value&&styles.scopeTextActive]}>{label}</Text></Pressable>)}</View>
    </Field>

    <View style={styles.two}><View style={styles.flex}><Field label="Minimum salary"><TextInput editable={!closed} value={form.salary_min} onChangeText={v => update('salary_min', v)} keyboardType="number-pad" style={styles.input} placeholder="35000" placeholderTextColor={palette.quiet} /></Field></View><View style={styles.flex}><Field label="Maximum salary"><TextInput editable={!closed} value={form.salary_max} onChangeText={v => update('salary_max', v)} keyboardType="number-pad" style={styles.input} placeholder="45000" placeholderTextColor={palette.quiet} /></Field></View></View>
    <View style={styles.two}><View style={styles.flex}><Field label="Minimum experience"><TextInput editable={!closed} value={form.min_years_experience} onChangeText={v => update('min_years_experience', v)} keyboardType="number-pad" style={styles.input} placeholder="3" placeholderTextColor={palette.quiet} /></Field></View><View style={styles.flex}><Field label="Shift pattern"><TextInput editable={!closed} value={form.shift_pattern} onChangeText={v => update('shift_pattern', v)} style={styles.input} placeholder="e.g. 5 days over 7" placeholderTextColor={palette.quiet} /></Field></View></View>

    <SectionHeader eyebrow="02 · MATCHING" title="What genuinely matters?" copy="These criteria feed the match score. Keep genuine must-haves separate from nice-to-have experience." />
    <MultiSelectField disabled={closed} label="Required services & treatment skills" help="Choose only skills the person genuinely needs to do this job." options={taxonomy.skills} selected={form.required_skills} onChange={value => update('required_skills', value)} />
    <MultiSelectField disabled={closed} label="Required product houses" options={taxonomy.brands} selected={form.required_brands} onChange={value => update('required_brands', value)} />
    <MultiSelectField disabled={closed} label="Required qualifications" options={taxonomy.qualifications} selected={form.required_qualifications} onChange={value => update('required_qualifications', value)} />
    <MultiSelectField disabled={closed} label="Required systems" options={taxonomy.systems} selected={form.required_systems} onChange={value => update('required_systems', value)} />
    <MultiSelectField disabled={closed} label="Preferred leadership & business skills" help="Useful evidence for fit, but not an automatic exclusion." options={BUSINESS_SKILLS} selected={form.preferred_business_skills} onChange={value => update('preferred_business_skills', value)} />

    <SectionHeader eyebrow="03 · CANDIDATE VIEW" title="Requirements & benefits" copy="This is where candidates understand the practical reality of the role, not just the title." />
    <Field label="Requirements · one per line"><TextInput editable={!closed} value={form.requirements} onChangeText={v => update('requirements', v)} style={[styles.input,styles.smallArea]} multiline placeholder="Right to work in the UK\nLevel 3 Beauty Therapy\nPrevious luxury spa experience" placeholderTextColor={palette.quiet} /></Field>
    <Field label="Benefits · one per line"><TextInput editable={!closed} value={form.benefits} onChangeText={v => update('benefits', v)} style={[styles.input,styles.smallArea]} multiline placeholder="Service charge\nMeals on duty\nHotel discounts\nTraining & development" placeholderTextColor={palette.quiet} /></Field>

    <View style={styles.toggleGroup}>
      <Toggle disabled={closed} label="Accommodation provided" help="Make this visible to candidates before they apply." value={form.offers_accommodation} onChange={value => update('offers_accommodation', value)} />
      <Toggle disabled={closed} label="Professional insurance required" help="Use this only where the role genuinely requires valid cover." value={form.insurance_required} onChange={value => update('insurance_required', value)} />
      <Toggle disabled={closed} label="Agency role" help="Flag this role as flexible Agency work where appropriate." value={form.is_agency_role} onChange={value => update('is_agency_role', value)} />
      <Toggle disabled={closed} label="Residency role" help="Flag longer-form specialist Residency opportunities." value={form.is_residency_role} onChange={value => update('is_residency_role', value)} />
    </View>

    {!closed ? <View style={styles.actions}>
      <SectionHeader eyebrow="04 · PUBLISH" title={live?'Manage this live role':'Choose how to publish'} copy={live?'You can still save edits, mark the position filled or close it early.':'Save a draft first if you are not ready. Publishing may use your Group allowance or open secure Stripe checkout.'} />
      <Pressable disabled={!!busy} onPress={saveDraft} style={styles.secondary}><Text style={styles.secondaryText}>{busy==='save'?'Saving…':isNew?'Save draft':'Save changes'}</Text></Pressable>

      {!live ? <>
        <View style={styles.priceCard}>
          <View style={styles.priceTop}><View><Text style={styles.priceEyebrow}>STANDARD JOB</Text><Text style={styles.priceTitle}>30 days</Text></View><Text style={styles.priceAmount}>£149</Text></View>
          <Text style={styles.priceCopy}>£99 for Employer Pro. Included where your Employer Group allowance is available.</Text>
          <Pressable disabled={!!busy} onPress={() => publish('Bronze')} style={styles.primary}><Text style={styles.primaryText}>{busy==='publish-Bronze'?'Preparing…':'Publish Standard Job'}</Text></Pressable>
        </View>
        <View style={[styles.priceCard,styles.featuredCard]}>
          <View style={styles.priceTop}><View><Text style={styles.priceEyebrow}>FEATURED JOB</Text><Text style={styles.priceTitle}>30 days + priority visibility</Text></View><Text style={styles.priceAmount}>£249</Text></View>
          <Text style={styles.priceCopy}>Priority search placement, relevant Talent email and featured branding.</Text>
          <Pressable disabled={!!busy} onPress={() => publish('Platinum')} style={styles.primary}><Text style={styles.primaryText}>{busy==='publish-Platinum'?'Preparing…':'Publish Featured Job'}</Text></Pressable>
        </View>
      </> : null}

      {live ? <>
        <Pressable disabled={!!busy} onPress={() => changeStatus('filled')} style={styles.primary}><Text style={styles.primaryText}>{busy==='filled'?'Updating…':'Mark role filled'}</Text></Pressable>
        <Text style={styles.closeHelp}>Marking a role filled removes it from Talent view and emails applicants that the vacancy has been filled.</Text>
        <Pressable disabled={!!busy} onPress={() => changeStatus('closed')} style={styles.danger}><Text style={styles.dangerText}>{busy==='closed'?'Updating…':'Close role without marking filled'}</Text></Pressable>
      </> : null}
    </View> : <View style={styles.closedBox}><Text style={styles.closedTitle}>This role is closed</Text><Text style={styles.closedCopy}>Its history remains available, but the role can no longer be edited or republished from this screen.</Text></View>}
  </ScrollView>
}

function SectionHeader({eyebrow,title,copy}:{eyebrow:string;title:string;copy:string}){
  return <View style={styles.sectionHeader}><Text style={styles.sectionEyebrow}>{eyebrow}</Text><Text style={styles.sectionTitle}>{title}</Text><Text style={styles.sectionHelp}>{copy}</Text></View>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <View style={styles.field}><Text style={styles.fieldLabel}>{label}</Text>{children}</View>
}

function Toggle({ label, help, value, onChange, disabled }: { label:string; help:string; value:boolean; onChange:(value:boolean)=>void; disabled:boolean }) {
  return <View style={styles.switchRow}><View style={styles.flex}><Text style={styles.toggleLabel}>{label}</Text><Text style={styles.toggleHelp}>{help}</Text></View><Switch disabled={disabled} value={value} onValueChange={onChange} trackColor={{false:palette.lineStrong,true:'#BCC8BF'}} thumbColor={palette.paper} /></View>
}

const styles=StyleSheet.create({
  scroll:{flex:1,backgroundColor:palette.stone},
  page:{paddingHorizontal:space.page,paddingTop:18,paddingBottom:120},
  center:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:palette.stone},
  backButton:{alignSelf:'flex-start',paddingVertical:6,marginBottom:22},
  back:{color:palette.muted,fontSize:13},
  eyebrow:{color:palette.quiet,fontSize:8,letterSpacing:2.2,fontWeight:'700',marginBottom:9},
  title:{color:palette.inkStrong,fontFamily:type.serif,fontSize:34,lineHeight:40,fontWeight:'400'},
  intro:{color:palette.muted,fontSize:13,lineHeight:20,marginTop:10,marginBottom:22,maxWidth:365},
  statusCard:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,padding:16,borderRadius:radius.large,marginBottom:22},
  statusCardLive:{borderColor:'#BCC8BF',backgroundColor:'#FBFCFA'},
  statusCardClosed:{borderColor:'#E1CFCF',backgroundColor:'#FBF7F6'},
  statusEyebrow:{color:palette.quiet,fontSize:7.5,letterSpacing:1.3,fontWeight:'700'},
  status:{color:palette.inkStrong,fontSize:13,fontWeight:'800',letterSpacing:.7,marginTop:4},
  statusCopy:{color:palette.muted,fontSize:10.5,lineHeight:16,marginTop:6},
  error:{color:palette.danger,fontSize:11,lineHeight:17,marginBottom:16},
  sectionHeader:{marginTop:8,marginBottom:13},
  sectionEyebrow:{color:palette.quiet,fontSize:8,letterSpacing:1.7,fontWeight:'700',marginBottom:5},
  sectionTitle:{color:palette.inkStrong,fontFamily:type.serif,fontSize:23,lineHeight:28,fontWeight:'400'},
  sectionHelp:{color:palette.muted,fontSize:10.5,lineHeight:16,marginTop:5},
  field:{marginBottom:15},
  fieldLabel:{color:palette.text,fontSize:10.5,fontWeight:'700',marginBottom:6},
  fieldHelp:{color:palette.muted,fontSize:9.5,lineHeight:15,marginBottom:9},
  input:{borderWidth:1,borderColor:palette.line,backgroundColor:palette.paper,paddingHorizontal:13,paddingVertical:12,color:palette.text,fontSize:12,borderRadius:radius.medium},
  textarea:{minHeight:150,textAlignVertical:'top'},
  smallArea:{minHeight:96,textAlignVertical:'top'},
  two:{flexDirection:'row',gap:10},
  flex:{flex:1},
  scopeRow:{flexDirection:'row',flexWrap:'wrap',gap:7},
  scope:{borderWidth:1,borderColor:palette.lineStrong,paddingHorizontal:10,paddingVertical:9,borderRadius:radius.medium,backgroundColor:palette.paper},
  scopeActive:{backgroundColor:palette.inkStrong,borderColor:palette.inkStrong},
  scopeText:{color:palette.muted,fontSize:9,fontWeight:'600'},
  scopeTextActive:{color:palette.paper},
  toggleGroup:{borderWidth:1,borderColor:palette.line,backgroundColor:palette.paper,borderRadius:radius.large,paddingHorizontal:15,marginBottom:20},
  switchRow:{flexDirection:'row',alignItems:'center',gap:12,borderBottomWidth:1,borderBottomColor:palette.line,paddingVertical:14},
  toggleLabel:{color:palette.text,fontSize:11.5,fontWeight:'700'},
  toggleHelp:{color:palette.muted,fontSize:9.5,lineHeight:15,marginTop:3},
  actions:{gap:11,marginTop:6},
  secondary:{borderWidth:1,borderColor:palette.lineStrong,paddingVertical:14,alignItems:'center',borderRadius:radius.medium,backgroundColor:palette.paper},
  secondaryText:{color:palette.ink,fontSize:10.5,fontWeight:'700'},
  primary:{backgroundColor:palette.inkStrong,paddingVertical:14,alignItems:'center',marginTop:12,borderRadius:radius.medium},
  primaryText:{color:palette.paper,fontSize:10.5,fontWeight:'700'},
  danger:{paddingVertical:14,alignItems:'center',borderWidth:1,borderColor:'#D9BCBC',borderRadius:radius.medium,backgroundColor:palette.paper},
  dangerText:{color:palette.danger,fontSize:10.5,fontWeight:'700'},
  priceCard:{borderWidth:1,borderColor:palette.line,padding:17,borderRadius:radius.large,backgroundColor:palette.paper},
  featuredCard:{borderColor:'#C9B99D',backgroundColor:'#FCFAF5'},
  priceTop:{flexDirection:'row',justifyContent:'space-between',gap:12,alignItems:'flex-start'},
  priceEyebrow:{color:palette.quiet,fontSize:7.5,letterSpacing:1.2,fontWeight:'800'},
  priceTitle:{color:palette.inkStrong,fontFamily:type.serif,fontSize:19,lineHeight:24,fontWeight:'400',marginTop:4},
  priceAmount:{color:palette.inkStrong,fontSize:17,fontWeight:'800'},
  priceCopy:{color:palette.muted,fontSize:10.5,lineHeight:16,marginTop:8},
  closeHelp:{color:palette.muted,fontSize:9.5,lineHeight:15,textAlign:'center',paddingHorizontal:8},
  closedBox:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,padding:17,borderRadius:radius.large,marginTop:15},
  closedTitle:{color:palette.inkStrong,fontFamily:type.serif,fontSize:19,fontWeight:'400'},
  closedCopy:{color:palette.muted,fontSize:10.5,lineHeight:16,marginTop:5},
})