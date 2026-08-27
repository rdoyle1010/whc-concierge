import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../src/lib/supabase'

export default function ProfileScreen() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/login'); return }
    const { data } = await supabase.from('candidate_profiles').select('id,full_name,headline,location,bio,role_level,primary_specialism,profile_visible,show_first_name_only,job_alerts_enabled').eq('user_id', user.id).maybeSingle()
    setProfile(data)
    setLoading(false)
  }

  async function save() {
    if (!profile?.id) return
    setSaving(true); setMessage('')
    const { error } = await supabase.from('candidate_profiles').update({
      headline: profile.headline || null,
      location: profile.location || null,
      bio: profile.bio || null,
      profile_visible: !!profile.profile_visible,
      show_first_name_only: !!profile.show_first_name_only,
      job_alerts_enabled: !!profile.job_alerts_enabled,
      updated_at: new Date().toISOString(),
    }).eq('id', profile.id)
    setMessage(error ? error.message : 'Profile saved.')
    setSaving(false)
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color="#092b45" /></View>
  if (!profile) return <View style={styles.center}><Text>Complete your Talent profile on the website first.</Text></View>

  const toggle = (key: string, label: string, copy: string) => <View style={styles.toggleRow}><View style={{flex:1,paddingRight:14}}><Text style={styles.toggleTitle}>{label}</Text><Text style={styles.toggleCopy}>{copy}</Text></View><Switch value={!!profile[key]} onValueChange={v => setProfile({...profile,[key]:v})} /></View>

  return <ScrollView style={styles.scroll} contentContainerStyle={styles.page}>
    <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Back</Text></Pressable>
    <Text style={styles.eyebrow}>YOUR PROFILE</Text>
    <Text style={styles.title}>{profile.full_name || 'Talent profile'}</Text>
    <Text style={styles.meta}>{[profile.role_level, profile.primary_specialism].filter(Boolean).join(' · ')}</Text>
    <Text style={styles.label}>Headline</Text><TextInput style={styles.input} value={profile.headline || ''} onChangeText={v=>setProfile({...profile,headline:v})} placeholder="Spa therapist, manager, director..." />
    <Text style={styles.label}>Location</Text><TextInput style={styles.input} value={profile.location || ''} onChangeText={v=>setProfile({...profile,location:v})} placeholder="Leeds, London, Dubai..." />
    <Text style={styles.label}>About you</Text><TextInput multiline style={[styles.input,styles.textarea]} value={profile.bio || ''} onChangeText={v=>setProfile({...profile,bio:v})} placeholder="Your experience, strengths and what you are looking for." />

    <View style={styles.section}><Text style={styles.sectionTitle}>Privacy & visibility</Text>
      <Pressable onPress={()=>router.push('/privacy-stealth')} style={styles.privacyCard}><View style={{flex:1}}><Text style={styles.privacyTitle}>Stealth Mode & blocked employers</Text><Text style={styles.privacyCopy}>Choose the exact employers, hotels or spas that must not be able to discover you.</Text></View><Text style={styles.chevron}>›</Text></Pressable>
      {toggle('profile_visible','Visible to employers','Allow eligible employers to discover your profile, except businesses you block in Stealth Mode.')}
      {toggle('show_first_name_only','First name only','Use a more private public display name.')}
      {toggle('job_alerts_enabled','Job alerts','Receive relevant role alerts when matching opportunities appear.')}
    </View>
    <Pressable onPress={() => router.push('/security')} style={styles.securityCard}><View style={{flex:1}}><Text style={styles.securityTitle}>Security & Legal</Text><Text style={styles.securityCopy}>Authenticator, privacy, GDPR, terms and data rights.</Text></View><Text style={styles.chevron}>›</Text></Pressable>
    <Pressable onPress={save} style={styles.button}><Text style={styles.buttonText}>{saving ? 'Saving...' : 'Save changes'}</Text></Pressable>
    {message ? <Text style={styles.message}>{message}</Text> : null}
  </ScrollView>
}

const styles=StyleSheet.create({scroll:{flex:1,backgroundColor:'#fff'},page:{paddingHorizontal:22,paddingTop:64,paddingBottom:44},center:{flex:1,alignItems:'center',justifyContent:'center',padding:28},back:{color:'#66747c',fontSize:13,marginBottom:34},eyebrow:{color:'#71808a',fontSize:9,letterSpacing:2.1,marginBottom:10},title:{color:'#092b45',fontSize:30,fontWeight:'500'},meta:{color:'#71808a',fontSize:12,marginTop:6,marginBottom:28},label:{color:'#173246',fontSize:12,fontWeight:'600',marginBottom:7,marginTop:14},input:{borderWidth:1,borderColor:'#dce3e7',paddingHorizontal:14,paddingVertical:13,fontSize:14,color:'#173246'},textarea:{minHeight:120,textAlignVertical:'top'},section:{marginTop:28,borderTopWidth:1,borderTopColor:'#e4e9ec'},sectionTitle:{color:'#092b45',fontSize:17,fontWeight:'600',marginTop:22,marginBottom:8},privacyCard:{borderWidth:1,borderColor:'#cfd9de',backgroundColor:'#f4f7f8',padding:16,flexDirection:'row',alignItems:'center',marginTop:8,marginBottom:4},privacyTitle:{color:'#092b45',fontSize:14,fontWeight:'700'},privacyCopy:{color:'#71808a',fontSize:11,lineHeight:17,marginTop:4},toggleRow:{flexDirection:'row',alignItems:'center',paddingVertical:16,borderBottomWidth:1,borderBottomColor:'#edf0f2'},toggleTitle:{color:'#173246',fontSize:14,fontWeight:'600'},toggleCopy:{color:'#71808a',fontSize:11,lineHeight:16,marginTop:4},securityCard:{marginTop:20,borderWidth:1,borderColor:'#dce3e7',padding:16,flexDirection:'row',alignItems:'center'},securityTitle:{color:'#092b45',fontSize:15,fontWeight:'700'},securityCopy:{color:'#71808a',fontSize:11,lineHeight:17,marginTop:4},chevron:{color:'#71808a',fontSize:24,marginLeft:12},button:{marginTop:28,backgroundColor:'#092b45',paddingVertical:15,alignItems:'center'},buttonText:{color:'#fff',fontWeight:'600'},message:{marginTop:12,color:'#66747c',fontSize:12}})