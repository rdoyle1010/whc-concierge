import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { supabase } from '../../src/lib/supabase'

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL || 'https://talent.wellnesshousecollective.co.uk'

type FormState = {
  job_title: string
  job_description: string
  location: string
  location_postcode: string
  job_type: string
  contract_type: string
  required_role_level: string
  candidate_scope: string
  salary_min: string
  salary_max: string
  min_years_experience: string
  shift_pattern: string
  requirements: string
  benefits: string
  offers_accommodation: boolean
}

const blank: FormState = {
  job_title: '', job_description: '', location: '', location_postcode: '', job_type: 'Full-time', contract_type: 'permanent',
  required_role_level: '', candidate_scope: 'step_up', salary_min: '', salary_max: '', min_years_experience: '', shift_pattern: '',
  requirements: '', benefits: '', offers_accommodation: false,
}

export default function EmployerJobEditor() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const isNew = id === 'new'
  const [form, setForm] = useState<FormState>(blank)
  const [job, setJob] = useState<any>(null)
  const [loading, setLoading] = useState(!isNew)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')

  useEffect(() => { if (!isNew) load() }, [id])

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
        job_title: data.job_title || '', job_description: data.job_description || '', location: data.location || '', location_postcode: data.location_postcode || '',
        job_type: data.job_type || 'Full-time', contract_type: data.contract_type || 'permanent', required_role_level: data.required_role_level || '', candidate_scope: data.candidate_scope || 'step_up',
        salary_min: data.salary_min ? String(data.salary_min) : '', salary_max: data.salary_max ? String(data.salary_max) : '', min_years_experience: data.min_years_experience ? String(data.min_years_experience) : '',
        shift_pattern: data.shift_pattern || '', requirements: Array.isArray(data.requirements) ? data.requirements.join('\n') : '', benefits: Array.isArray(data.benefits) ? data.benefits.join('\n') : '', offers_accommodation: Boolean(data.offers_accommodation),
      })
    } catch (e: any) { setError(e?.message || 'Could not load role.') } finally { setLoading(false) }
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) { setForm(current => ({ ...current, [key]: value })) }
  function payload() {
    return {
      ...form,
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

  if (loading) return <View style={styles.center}><ActivityIndicator color="#092b45" /></View>
  const closed = ['closed', 'filled'].includes(String(job?.status || ''))
  const live = Boolean(job?.is_live) && job?.status === 'active'

  return <ScrollView style={styles.scroll} contentContainerStyle={styles.page}>
    <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Back</Text></Pressable>
    <Text style={styles.eyebrow}>EMPLOYER · RECRUITMENT</Text><Text style={styles.title}>{isNew ? 'Post a role.' : 'Manage role.'}</Text>
    <Text style={styles.intro}>Write the role properly once, then use the same listing across WHC matching, applications and Interview Ready.</Text>
    {job ? <View style={styles.statusCard}><Text style={styles.status}>{String(job.status || 'draft').toUpperCase()}</Text><Text style={styles.help}>{live ? 'This role is currently live.' : closed ? 'This role is closed and cannot be edited.' : 'This role is not live yet.'}</Text></View> : null}
    {error ? <Text style={styles.error}>{error}</Text> : null}

    <Field label="Job title"><TextInput editable={!closed} value={form.job_title} onChangeText={v => update('job_title', v)} style={styles.input} placeholder="e.g. Director of Spa" /></Field>
    <Field label="Job description"><TextInput editable={!closed} value={form.job_description} onChangeText={v => update('job_description', v)} style={[styles.input, styles.textarea]} multiline placeholder="Responsibilities, priorities, reporting line, team size and what success looks like..." /></Field>
    <View style={styles.two}><View style={styles.flex}><Field label="Location"><TextInput editable={!closed} value={form.location} onChangeText={v => update('location', v)} style={styles.input} /></Field></View><View style={styles.flex}><Field label="Postcode"><TextInput editable={!closed} value={form.location_postcode} onChangeText={v => update('location_postcode', v)} style={styles.input} /></Field></View></View>
    <View style={styles.two}><View style={styles.flex}><Field label="Job type"><TextInput editable={!closed} value={form.job_type} onChangeText={v => update('job_type', v)} style={styles.input} /></Field></View><View style={styles.flex}><Field label="Contract"><TextInput editable={!closed} value={form.contract_type} onChangeText={v => update('contract_type', v)} style={styles.input} /></Field></View></View>
    <Field label="Role level"><TextInput editable={!closed} value={form.required_role_level} onChangeText={v => update('required_role_level', v)} style={styles.input} placeholder="e.g. Spa Manager" /></Field>
    <Field label="Who should WHC consider?"><View style={styles.scopeRow}>{[['same_level','Same level'],['step_up','Ready to step up'],['emerging','Emerging'],['open_transferable','Transferable']].map(([value,label]) => <Pressable disabled={closed} key={value} onPress={() => update('candidate_scope', value)} style={[styles.scope,form.candidate_scope===value&&styles.scopeActive]}><Text style={[styles.scopeText,form.candidate_scope===value&&styles.scopeTextActive]}>{label}</Text></Pressable>)}</View></Field>
    <View style={styles.two}><View style={styles.flex}><Field label="Min salary"><TextInput editable={!closed} value={form.salary_min} onChangeText={v => update('salary_min', v)} keyboardType="number-pad" style={styles.input} /></Field></View><View style={styles.flex}><Field label="Max salary"><TextInput editable={!closed} value={form.salary_max} onChangeText={v => update('salary_max', v)} keyboardType="number-pad" style={styles.input} /></Field></View></View>
    <View style={styles.two}><View style={styles.flex}><Field label="Years experience"><TextInput editable={!closed} value={form.min_years_experience} onChangeText={v => update('min_years_experience', v)} keyboardType="number-pad" style={styles.input} /></Field></View><View style={styles.flex}><Field label="Shift pattern"><TextInput editable={!closed} value={form.shift_pattern} onChangeText={v => update('shift_pattern', v)} style={styles.input} /></Field></View></View>
    <Field label="Requirements · one per line"><TextInput editable={!closed} value={form.requirements} onChangeText={v => update('requirements', v)} style={[styles.input,styles.smallArea]} multiline /></Field>
    <Field label="Benefits · one per line"><TextInput editable={!closed} value={form.benefits} onChangeText={v => update('benefits', v)} style={[styles.input,styles.smallArea]} multiline /></Field>
    <View style={styles.switchRow}><View style={styles.flex}><Text style={styles.fieldLabel}>Accommodation provided</Text><Text style={styles.help}>Make this visible to candidates before they apply.</Text></View><Switch disabled={closed} value={form.offers_accommodation} onValueChange={v => update('offers_accommodation', v)} /></View>

    {!closed ? <View style={styles.actions}>
      <Pressable disabled={!!busy} onPress={saveDraft} style={styles.secondary}><Text style={styles.secondaryText}>{busy==='save'?'Saving...':'Save changes'}</Text></Pressable>
      {!live ? <><View style={styles.priceCard}><Text style={styles.priceTitle}>Standard Job · 30 days</Text><Text style={styles.help}>£149 normally · £99 for Employer Pro · included from Group allowance.</Text><Pressable disabled={!!busy} onPress={() => publish('Bronze')} style={styles.primary}><Text style={styles.primaryText}>{busy==='publish-Bronze'?'Preparing...':'Publish Standard Job'}</Text></Pressable></View>
      <View style={styles.priceCard}><Text style={styles.priceTitle}>Featured Job · 30 days</Text><Text style={styles.help}>£249 · priority search placement, relevant Talent email and featured branding.</Text><Pressable disabled={!!busy} onPress={() => publish('Platinum')} style={styles.primary}><Text style={styles.primaryText}>{busy==='publish-Platinum'?'Preparing...':'Publish Featured Job'}</Text></Pressable></View></> : null}
      {live ? <><Pressable disabled={!!busy} onPress={() => changeStatus('filled')} style={styles.primary}><Text style={styles.primaryText}>Mark role filled</Text></Pressable><Pressable disabled={!!busy} onPress={() => changeStatus('closed')} style={styles.danger}><Text style={styles.dangerText}>Close role</Text></Pressable></> : null}
    </View> : null}
  </ScrollView>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <View style={styles.field}><Text style={styles.fieldLabel}>{label}</Text>{children}</View> }

const styles=StyleSheet.create({scroll:{flex:1,backgroundColor:'#fff'},page:{paddingHorizontal:22,paddingTop:64,paddingBottom:120},center:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:'#fff'},back:{color:'#66747c',fontSize:13,marginBottom:34},eyebrow:{color:'#71808a',fontSize:9,letterSpacing:2.1,marginBottom:10},title:{color:'#092b45',fontSize:31,lineHeight:37,fontWeight:'500'},intro:{color:'#66747c',fontSize:14,lineHeight:21,marginTop:10,marginBottom:24},statusCard:{backgroundColor:'#f4f7f8',padding:15,marginBottom:18},status:{color:'#173246',fontSize:10,fontWeight:'700',letterSpacing:1.2,marginBottom:5},help:{color:'#71808a',fontSize:10,lineHeight:16},field:{marginBottom:15},fieldLabel:{color:'#173246',fontSize:10,fontWeight:'700',marginBottom:6},input:{borderWidth:1,borderColor:'#d7e0e4',backgroundColor:'#fff',paddingHorizontal:12,paddingVertical:11,color:'#173246',fontSize:12},textarea:{minHeight:150,textAlignVertical:'top'},smallArea:{minHeight:88,textAlignVertical:'top'},two:{flexDirection:'row',gap:10},flex:{flex:1},scopeRow:{flexDirection:'row',flexWrap:'wrap',gap:7},scope:{borderWidth:1,borderColor:'#d7e0e4',paddingHorizontal:10,paddingVertical:9},scopeActive:{backgroundColor:'#092b45',borderColor:'#092b45'},scopeText:{color:'#66747c',fontSize:9},scopeTextActive:{color:'#fff'},switchRow:{flexDirection:'row',alignItems:'center',gap:12,borderTopWidth:1,borderBottomWidth:1,borderColor:'#e7edef',paddingVertical:14,marginBottom:18},actions:{gap:11},secondary:{borderWidth:1,borderColor:'#cfd9de',paddingVertical:14,alignItems:'center'},secondaryText:{color:'#173246',fontSize:11,fontWeight:'700'},primary:{backgroundColor:'#092b45',paddingVertical:14,alignItems:'center',marginTop:12},primaryText:{color:'#fff',fontSize:11,fontWeight:'700'},danger:{paddingVertical:14,alignItems:'center',borderWidth:1,borderColor:'#d9bcbc'},dangerText:{color:'#8b3c3c',fontSize:11,fontWeight:'700'},priceCard:{borderWidth:1,borderColor:'#dce3e7',padding:16},priceTitle:{color:'#173246',fontSize:14,fontWeight:'700',marginBottom:5},error:{color:'#9b2c2c',fontSize:11,lineHeight:17,marginBottom:16}})
