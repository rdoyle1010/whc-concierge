import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native'
import { router } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { supabase } from '../src/lib/supabase'

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL || 'https://talenthousecollective.co.uk'
const listFromText = (value: string) => value.split('\n').map(v => v.trim()).filter(Boolean)
const textFromList = (value: unknown) => Array.isArray(value) ? value.join('\n') : ''

type Profile = Record<string, any> & { id: string; property_photos?: string[] }

export default function PropertyProfileScreen() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { load() }, [])

  async function authFetch(path: string, options?: RequestInit) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) throw new Error('Your session has expired. Please sign in again.')
    const response = await fetch(`${WEB_URL}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}`, ...(options?.headers || {}) },
    })
    const body = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(body?.error || 'Could not update property profile.')
    return body
  }

  async function load() {
    setLoading(true); setError('')
    try {
      const data = await authFetch('/api/mobile/employer/property')
      setProfile({ ...data.profile, property_photos: data.profile?.property_photos || [] })
    } catch (e: any) { setError(e?.message || 'Could not load property profile.') }
    finally { setLoading(false) }
  }

  function update(field: string, value: any) {
    setProfile(current => current ? { ...current, [field]: value } : current)
  }

  async function save() {
    if (!profile) return
    setSaving(true); setError('')
    try {
      const payload = {
        company_name: profile.company_name || '', property_name: profile.property_name || '', contact_name: profile.contact_name || '',
        contact_phone: profile.contact_phone || '', contact_email: profile.contact_email || '', website: profile.website || '',
        location: profile.location || '', postcode: profile.postcode || '', company_type: profile.company_type || '', property_type: profile.property_type || '',
        star_rating: profile.star_rating || '', tagline: profile.tagline || '', about_text: profile.about_text || '', logo_url: profile.logo_url || null,
        num_treatment_rooms: profile.num_treatment_rooms || null, team_size: profile.team_size || null,
        commute_car_required: Boolean(profile.commute_car_required), nearest_transport: profile.nearest_transport || '',
        transport_walk_minutes: profile.transport_walk_minutes || null, parking_available: Boolean(profile.parking_available),
        taxi_support: Boolean(profile.taxi_support), taxi_notes: profile.taxi_notes || '', travel_notes: profile.travel_notes || '',
        highlights: listFromText(profile.highlights_text || textFromList(profile.highlights)),
        culture_points: listFromText(profile.culture_text || textFromList(profile.culture_points)),
        services_offered: listFromText(profile.services_text || textFromList(profile.services_offered)),
        product_houses_used: listFromText(profile.brands_text || textFromList(profile.product_houses_used)),
        systems_used: listFromText(profile.systems_text || textFromList(profile.systems_used)),
        tripadvisor_url: profile.tripadvisor_url || '', treatment_menu_url: profile.treatment_menu_url || '', guest_review_summary: profile.guest_review_summary || '',
        agency_available: Boolean(profile.agency_available), agency_note: profile.agency_note || '', property_photos: profile.property_photos || [],
      }
      const data = await authFetch('/api/mobile/employer/property', { method: 'POST', body: JSON.stringify(payload) })
      setProfile({ ...data.profile, property_photos: data.profile?.property_photos || [] })
      Alert.alert('Property profile saved', 'Your property, travel and staff-access information is now updated across Talent House.')
    } catch (e: any) { setError(e?.message || 'Could not save property profile.') }
    finally { setSaving(false) }
  }

  async function chooseLogo() {
    if (!profile) return
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) { Alert.alert('Photo permission required', 'Allow photo access to choose your property logo.'); return }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9, allowsMultipleSelection: false })
    if (result.canceled || !result.assets?.[0]) return
    const asset = result.assets[0]
    setUploadingLogo(true); setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Your session has expired.')
      const ext = (asset.fileName?.split('.').pop() || asset.mimeType?.split('/').pop() || 'jpg').replace(/[^a-z0-9]/gi, '')
      const form = new FormData()
      form.append('file', { uri: asset.uri, name: asset.fileName || `logo-${Date.now()}.${ext}`, type: asset.mimeType || 'image/jpeg' } as any)
      form.append('bucket', 'property-photos')
      form.append('path', `logos/${profile.id}-${Date.now()}.${ext}`)
      const response = await fetch(`${WEB_URL}/api/upload`, { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}` }, body: form })
      const uploaded = await response.json().catch(() => ({}))
      if (!response.ok || !uploaded.url) throw new Error(uploaded?.error || 'Logo upload failed.')
      const saved = await authFetch('/api/mobile/employer/property', { method: 'POST', body: JSON.stringify({ logo_url: uploaded.url }) })
      setProfile({ ...saved.profile, property_photos: saved.profile?.property_photos || [] })
      Alert.alert('Logo updated', 'Your new property logo is now saved to your Employer profile.')
    } catch (e: any) { setError(e?.message || 'Could not upload logo.') }
    finally { setUploadingLogo(false) }
  }

  async function removeLogo() {
    if (!profile?.logo_url) return
    setUploadingLogo(true); setError('')
    try {
      const saved = await authFetch('/api/mobile/employer/property', { method: 'POST', body: JSON.stringify({ logo_url: null }) })
      setProfile({ ...saved.profile, property_photos: saved.profile?.property_photos || [] })
    } catch (e: any) { setError(e?.message || 'Could not remove logo.') }
    finally { setUploadingLogo(false) }
  }

  async function addPhoto() {
    if (!profile || (profile.property_photos || []).length >= 6) {
      Alert.alert('Photo limit reached', 'You can show up to six property photos. Remove one before adding another.')
      return
    }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) { Alert.alert('Photo permission required', 'Allow photo access to choose a property image.'); return }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85, allowsMultipleSelection: false })
    if (result.canceled || !result.assets?.[0]) return
    const asset = result.assets[0]
    setUploading(true); setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Your session has expired.')
      const ext = (asset.fileName?.split('.').pop() || asset.mimeType?.split('/').pop() || 'jpg').replace(/[^a-z0-9]/gi, '')
      const form = new FormData()
      form.append('file', { uri: asset.uri, name: asset.fileName || `property-${Date.now()}.${ext}`, type: asset.mimeType || 'image/jpeg' } as any)
      form.append('bucket', 'property-photos')
      form.append('path', `${profile.id}-${Date.now()}.${ext}`)
      const response = await fetch(`${WEB_URL}/api/upload`, { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}` }, body: form })
      const uploaded = await response.json().catch(() => ({}))
      if (!response.ok || !uploaded.url) throw new Error(uploaded?.error || 'Photo upload failed.')
      const next = [...(profile.property_photos || []), uploaded.url].slice(0, 6)
      const saved = await authFetch('/api/mobile/employer/property', { method: 'POST', body: JSON.stringify({ property_photos: next }) })
      setProfile({ ...saved.profile, property_photos: saved.profile?.property_photos || [] })
    } catch (e: any) { setError(e?.message || 'Could not upload photo.') }
    finally { setUploading(false) }
  }

  async function removePhoto(url: string) {
    if (!profile) return
    const next = (profile.property_photos || []).filter(item => item !== url)
    setProfile({ ...profile, property_photos: next })
    try { await authFetch('/api/mobile/employer/property', { method: 'POST', body: JSON.stringify({ property_photos: next }) }) }
    catch (e: any) { setError(e?.message || 'Could not remove photo.'); await load() }
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color="#0b2f4d" /></View>
  if (!profile) return <View style={styles.center}><Text style={styles.error}>{error || 'Property profile not found.'}</Text></View>

  return <ScrollView style={styles.scroll} contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
    <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Back</Text></Pressable>
    <Text style={styles.eyebrow}>PROPERTY PROFILE</Text>
    <Text style={styles.title}>Show Talent what working here is really like.</Text>
    <Text style={styles.intro}>Keep your property, spa operation and travel information accurate across Jobs, Agency and Residency.</Text>
    {error ? <Text style={styles.error}>{error}</Text> : null}

    <Section title="Property identity">
      <Text style={styles.label}>Property logo</Text>
      <View style={styles.logoRow}>
        <View style={styles.logoFrame}>{profile.logo_url ? <Image source={{ uri: profile.logo_url }} style={styles.logo} resizeMode="contain" /> : <Text style={styles.logoPlaceholder}>No logo</Text>}</View>
        <View style={styles.logoActions}>
          <Pressable onPress={chooseLogo} disabled={uploadingLogo} style={styles.secondaryCompact}><Text style={styles.secondaryText}>{uploadingLogo ? 'Uploading...' : profile.logo_url ? 'Change logo' : 'Add logo'}</Text></Pressable>
          {profile.logo_url ? <Pressable onPress={removeLogo} disabled={uploadingLogo}><Text style={styles.removeLogoText}>Remove logo</Text></Pressable> : null}
        </View>
      </View>
      <Text style={styles.help}>Use your official property or hotel brand mark.</Text>
      <Field label="Property name" value={profile.property_name} onChange={v => update('property_name', v)} />
      <Field label="Company / brand" value={profile.company_name} onChange={v => update('company_name', v)} />
      <Field label="Tagline" value={profile.tagline} onChange={v => update('tagline', v)} />
      <Field label="About the property" value={profile.about_text} onChange={v => update('about_text', v)} multiline />
      <View style={styles.two}><Field label="Location" value={profile.location} onChange={v => update('location', v)} /><Field label="Postcode" value={profile.postcode} onChange={v => update('postcode', v)} /></View>
      <View style={styles.two}><Field label="Property type" value={profile.property_type} onChange={v => update('property_type', v)} /><Field label="Star rating" value={profile.star_rating} onChange={v => update('star_rating', v)} /></View>
      <Field label="Website" value={profile.website} onChange={v => update('website', v)} />
      <Field label="Treatment menu URL" value={profile.treatment_menu_url} onChange={v => update('treatment_menu_url', v)} />
      <Field label="TripAdvisor URL" value={profile.tripadvisor_url} onChange={v => update('tripadvisor_url', v)} />
    </Section>

    <Section title="Property photos">
      <Text style={styles.help}>Add up to six genuine property and spa images to help Talent understand the environment.</Text>
      <View style={styles.photoGrid}>{(profile.property_photos || []).map(url => <View key={url} style={styles.photoWrap}><Image source={{ uri: url }} style={styles.photo} /><Pressable onPress={() => removePhoto(url)} style={styles.remove}><Text style={styles.removeText}>Remove</Text></Pressable></View>)}</View>
      <Pressable onPress={addPhoto} disabled={uploading} style={styles.secondary}><Text style={styles.secondaryText}>{uploading ? 'Uploading...' : `Add property photo (${(profile.property_photos || []).length}/6)`}</Text></Pressable>
    </Section>

    <Section title="Spa operation">
      <View style={styles.two}><Field label="Treatment rooms" value={profile.num_treatment_rooms?.toString()} onChange={v => update('num_treatment_rooms', v)} keyboard="number-pad" /><Field label="Spa team size" value={profile.team_size?.toString()} onChange={v => update('team_size', v)} keyboard="number-pad" /></View>
      <Field label="Services offered (one per line)" value={profile.services_text ?? textFromList(profile.services_offered)} onChange={v => update('services_text', v)} multiline />
      <Field label="Product houses used (one per line)" value={profile.brands_text ?? textFromList(profile.product_houses_used)} onChange={v => update('brands_text', v)} multiline />
      <Field label="Systems used (one per line)" value={profile.systems_text ?? textFromList(profile.systems_used)} onChange={v => update('systems_text', v)} multiline />
      <Field label="Property highlights (one per line)" value={profile.highlights_text ?? textFromList(profile.highlights)} onChange={v => update('highlights_text', v)} multiline />
      <Field label="Culture & team points (one per line)" value={profile.culture_text ?? textFromList(profile.culture_points)} onChange={v => update('culture_text', v)} multiline />
    </Section>

    <Section title="Travel & access for staff">
      <Field label="Nearest station, Tube or bus stop" value={profile.nearest_transport} onChange={v => update('nearest_transport', v)} />
      <Field label="Approximate walk from transport (minutes)" value={profile.transport_walk_minutes?.toString()} onChange={v => update('transport_walk_minutes', v)} keyboard="number-pad" />
      <Toggle label="A car is realistically required" value={Boolean(profile.commute_car_required)} onChange={v => update('commute_car_required', v)} />
      <Toggle label="Staff parking is available" value={Boolean(profile.parking_available)} onChange={v => update('parking_available', v)} />
      <Toggle label="Taxi support may be available" value={Boolean(profile.taxi_support)} onChange={v => update('taxi_support', v)} />
      <Field label="Taxi support details" value={profile.taxi_notes} onChange={v => update('taxi_notes', v)} multiline />
      <Field label="Travel / arrival notes" value={profile.travel_notes} onChange={v => update('travel_notes', v)} multiline />
    </Section>

    <Section title="Agency readiness">
      <Toggle label="This property uses Agency cover" value={Boolean(profile.agency_available)} onChange={v => update('agency_available', v)} />
      <Field label="Agency arrival / working note" value={profile.agency_note} onChange={v => update('agency_note', v)} multiline />
    </Section>

    <Section title="Guest reputation context">
      <Field label="Property-supplied guest review summary" value={profile.guest_review_summary} onChange={v => update('guest_review_summary', v)} multiline />
    </Section>

    <Pressable onPress={save} disabled={saving} style={styles.primary}><Text style={styles.primaryText}>{saving ? 'Saving...' : 'Save property profile'}</Text></Pressable>
  </ScrollView>
}

function Section({ title, children }: { title: string; children: any }) { return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{children}</View> }
function Field({ label, value, onChange, multiline, keyboard }: { label: string; value?: string | null; onChange: (v: string) => void; multiline?: boolean; keyboard?: any }) { return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput value={value || ''} onChangeText={onChange} multiline={multiline} keyboardType={keyboard} style={[styles.input, multiline && styles.multiline]} /></View> }
function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) { return <View style={styles.toggle}><Text style={styles.toggleLabel}>{label}</Text><Switch value={value} onValueChange={onChange} trackColor={{ false: '#d9e0e4', true: '#92a7b3' }} thumbColor="#fff" /></View> }

const styles = StyleSheet.create({
  scroll:{flex:1,backgroundColor:'#fff'},page:{paddingHorizontal:18,paddingTop:18,paddingBottom:36},center:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:'#fff',padding:24},back:{color:'#66747c',fontSize:14,marginBottom:25},eyebrow:{color:'#71808a',fontSize:8,letterSpacing:2,marginBottom:8},title:{color:'#0b2f4d',fontSize:28,lineHeight:34,fontWeight:'500'},intro:{color:'#66747c',fontSize:13,lineHeight:20,marginTop:8,marginBottom:20},error:{color:'#9b2c2c',fontSize:11,marginBottom:14},
  section:{borderWidth:1,borderColor:'#dce3e7',padding:15,marginBottom:12},sectionTitle:{color:'#173246',fontSize:17,fontWeight:'600',marginBottom:12},field:{marginBottom:11,flex:1},label:{color:'#5d6d76',fontSize:10,fontWeight:'600',marginBottom:5},input:{borderWidth:1,borderColor:'#d9e1e5',paddingHorizontal:11,paddingVertical:10,color:'#173246',fontSize:12,backgroundColor:'#fff'},multiline:{minHeight:76,textAlignVertical:'top'},two:{flexDirection:'row',gap:8},help:{color:'#71808a',fontSize:10,lineHeight:16,marginBottom:10},
  toggle:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:10,paddingVertical:8,borderBottomWidth:1,borderBottomColor:'#eef1f2'},toggleLabel:{color:'#526976',fontSize:11,flex:1},logoRow:{flexDirection:'row',alignItems:'center',gap:12,marginBottom:9},logoFrame:{width:78,height:78,borderWidth:1,borderColor:'#dce3e7',backgroundColor:'#f7f9fa',alignItems:'center',justifyContent:'center',padding:7},logo:{width:'100%',height:'100%'},logoPlaceholder:{color:'#8b979e',fontSize:9},logoActions:{flex:1,gap:8},secondaryCompact:{borderWidth:1,borderColor:'#0b2f4d',paddingVertical:10,alignItems:'center'},removeLogoText:{color:'#8b3c3c',fontSize:10,fontWeight:'600'},
  photoGrid:{flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:11},photoWrap:{width:'48%',borderWidth:1,borderColor:'#e0e6e9',padding:5},photo:{width:'100%',height:105,backgroundColor:'#f2f4f6'},remove:{paddingVertical:7,alignItems:'center'},removeText:{color:'#8b3c3c',fontSize:10,fontWeight:'600'},primary:{backgroundColor:'#0b2f4d',paddingVertical:15,alignItems:'center',marginTop:5},primaryText:{color:'#fff',fontWeight:'700',fontSize:12},secondary:{borderWidth:1,borderColor:'#0b2f4d',paddingVertical:12,alignItems:'center'},secondaryText:{color:'#0b2f4d',fontSize:11,fontWeight:'700'}
})
