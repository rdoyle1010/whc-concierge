import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Image, Linking, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { router } from 'expo-router'
import { supabase } from '../src/lib/supabase'
import { palette, radius, space, type } from '../src/lib/theme'

const WEB_URL=process.env.EXPO_PUBLIC_WEB_URL||'https://talent.wellnesshousecollective.co.uk'
function certificateLabel(url:string,index:number){try{const tail=decodeURIComponent(url.split('/').pop()||'').replace(/^cert_[0-9]+_/,'').replace(/[-_]+/g,' ').trim();return tail||`Certificate ${index+1}`}catch{return `Certificate ${index+1}`}}

export default function ProfileScreen(){
  const [profile,setProfile]=useState<any>(null)
  const [userId,setUserId]=useState('')
  const [loading,setLoading]=useState(true)
  const [saving,setSaving]=useState(false)
  const [uploading,setUploading]=useState(false)
  const [message,setMessage]=useState('')

  useEffect(()=>{void load()},[])

  async function load(){
    const {data:{user}}=await supabase.auth.getUser()
    if(!user){router.replace('/login');return}
    setUserId(user.id)
    const {data}=await supabase.from('candidate_profiles').select('id,full_name,headline,location,bio,role_level,primary_specialism,profile_visible,show_first_name_only,job_alerts_enabled,certificates_urls,profile_image_url,cv_url').eq('user_id',user.id).maybeSingle()
    setProfile(data)
    setLoading(false)
  }

  async function pickPhoto(){
    if(!userId||uploading||!profile?.id)return
    const permission=await ImagePicker.requestMediaLibraryPermissionsAsync()
    if(!permission.granted){Alert.alert('Photo access','Allow photo access to choose a profile picture.');return}
    const result=await ImagePicker.launchImageLibraryAsync({mediaTypes:['images'],allowsEditing:true,aspect:[1,1],quality:.85})
    if(result.canceled||!result.assets?.[0])return
    setUploading(true);setMessage('')
    try{
      const asset=result.assets[0]
      const response=await fetch(asset.uri)
      const blob=await response.blob()
      const ext=(asset.fileName?.split('.').pop()||'jpg').replace(/[^a-zA-Z0-9]/g,'')
      const fd=new FormData()
      fd.append('file',blob as any,asset.fileName||`profile.${ext}`)
      fd.append('bucket','site-images')
      fd.append('path',`${userId}/profile/photo-${Date.now()}.${ext}`)
      fd.append('profileId',profile.id)
      fd.append('column','profile_image_url')
      const {data:{session}}=await supabase.auth.getSession()
      const res=await fetch(`${WEB_URL}/api/upload`,{method:'POST',headers:session?.access_token?{Authorization:`Bearer ${session.access_token}`}:{},body:fd})
      const body=await res.json().catch(()=>({}))
      if(!res.ok)throw new Error(body.error||'Photo upload failed')
      setProfile((p:any)=>({...p,profile_image_url:body.url}))
      setMessage('Profile photo updated.')
    }catch(e:any){setMessage(e.message||'Could not upload photo.')}
    finally{setUploading(false)}
  }

  async function save(){
    if(!profile?.id)return
    setSaving(true);setMessage('')
    const {error}=await supabase.from('candidate_profiles').update({headline:profile.headline||null,location:profile.location||null,bio:profile.bio||null,profile_visible:!!profile.profile_visible,show_first_name_only:!!profile.show_first_name_only,job_alerts_enabled:!!profile.job_alerts_enabled,updated_at:new Date().toISOString()}).eq('id',profile.id)
    setMessage(error?error.message:'Profile saved.')
    setSaving(false)
  }

  function confirmRemoveCertificate(url:string,index:number){
    Alert.alert('Remove uploaded certificate?',`Remove ${certificateLabel(url,index)} from your Talent profile? This does not affect WHC Academy certificates.`,[
      {text:'Cancel',style:'cancel'},
      {text:'Remove',style:'destructive',onPress:()=>removeUploadedCertificate(url)},
    ])
  }

  async function removeUploadedCertificate(url:string){
    if(!profile?.id)return
    const previous=Array.isArray(profile.certificates_urls)?profile.certificates_urls:[]
    const next=previous.filter((item:string)=>item!==url)
    setProfile({...profile,certificates_urls:next})
    const {error}=await supabase.from('candidate_profiles').update({certificates_urls:next,updated_at:new Date().toISOString()}).eq('id',profile.id)
    if(error){setProfile({...profile,certificates_urls:previous});setMessage('Could not remove the certificate. Please try again.')}
    else setMessage('Certificate removed from your profile.')
  }

  if(loading)return <View style={styles.center}><ActivityIndicator color={palette.ink}/></View>
  if(!profile)return <View style={styles.center}><Text style={styles.emptyStateTitle}>Talent profile not found.</Text><Text style={styles.emptyStateCopy}>Sign out and back in. If the problem continues, your Talent profile may need reconnecting.</Text></View>

  const uploadedCertificates=Array.isArray(profile.certificates_urls)?profile.certificates_urls:[]
  const completionChecks=[profile.profile_image_url,profile.headline,profile.location,profile.bio,profile.cv_url,uploadedCertificates.length>0]
  const completion=Math.round(completionChecks.filter(Boolean).length/completionChecks.length*100)
  const toggle=(key:string,label:string,copy:string)=><View style={styles.toggleRow}><View style={{flex:1,paddingRight:14}}><Text style={styles.toggleTitle}>{label}</Text><Text style={styles.toggleCopy}>{copy}</Text></View><Switch value={!!profile[key]} onValueChange={v=>setProfile({...profile,[key]:v})} trackColor={{false:palette.lineStrong,true:'#BCC8BF'}} thumbColor={palette.paper}/></View>

  return <ScrollView style={styles.scroll} contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
    <Pressable onPress={()=>router.back()} style={styles.backButton}><Text style={styles.back}>‹ Back</Text></Pressable>
    <Text style={styles.eyebrow}>CAREER PROFILE</Text>
    <Text style={styles.title}>{profile.full_name||'Talent profile'}</Text>
    <Text style={styles.meta}>{[profile.role_level,profile.primary_specialism].filter(Boolean).join(' · ')||'Build a profile employers can understand quickly.'}</Text>

    <View style={styles.progressCard}>
      <View style={styles.progressTop}><View><Text style={styles.progressEyebrow}>PROFILE STRENGTH</Text><Text style={styles.progressNumber}>{completion}%</Text></View><Text style={styles.progressHint}>{completion>=80?'Strong profile':completion>=50?'Nearly there':'Keep building'}</Text></View>
      <View style={styles.progressTrack}><View style={[styles.progressFill,{width:`${completion}%`}]} /></View>
    </View>

    <View style={styles.photoCard}>
      {profile.profile_image_url?<Image source={{uri:profile.profile_image_url}} style={styles.photo}/>:<View style={[styles.photo,styles.photoEmpty]}><Text style={styles.photoInitial}>{String(profile.full_name||'T').charAt(0)}</Text></View>}
      <View style={{flex:1}}><Text style={styles.photoTitle}>Profile photo</Text><Text style={styles.photoCopy}>Used in Talent discovery, matching and Agency.</Text><Pressable onPress={pickPhoto} disabled={uploading} style={styles.smallButton}><Text style={styles.smallButtonText}>{uploading?'Uploading…':profile.profile_image_url?'Change photo':'Add photo'}</Text></Pressable></View>
    </View>

    <View style={styles.sectionBlock}>
      <Text style={styles.sectionEyebrow}>PROFILE ESSENTIALS</Text>
      <Text style={styles.sectionTitle}>How employers understand you</Text>
      <Text style={styles.label}>Headline</Text><TextInput style={styles.input} value={profile.headline||''} onChangeText={v=>setProfile({...profile,headline:v})} placeholder="Spa therapist, manager, director..." placeholderTextColor={palette.quiet}/>
      <Text style={styles.label}>Location</Text><TextInput style={styles.input} value={profile.location||''} onChangeText={v=>setProfile({...profile,location:v})} placeholder="Leeds, London, Dubai..." placeholderTextColor={palette.quiet}/>
      <Text style={styles.label}>About you</Text><TextInput multiline style={[styles.input,styles.textarea]} value={profile.bio||''} onChangeText={v=>setProfile({...profile,bio:v})} placeholder="Your experience, strengths and what you are looking for." placeholderTextColor={palette.quiet}/>
    </View>

    <View style={styles.sectionBlock}>
      <Text style={styles.sectionEyebrow}>CAREER DOCUMENTS</Text>
      <Text style={styles.sectionTitle}>CV & qualifications</Text>
      <View style={[styles.documentCard,profile.cv_url&&styles.documentCardActive]}>
        <View style={{flex:1}}><Text style={styles.documentStatus}>{profile.cv_url?'CV ATTACHED':'CV NOT ATTACHED'}</Text><Text style={styles.documentTitle}>{profile.cv_url?'Your CV is connected to your profile':'Add your CV to strengthen matching'}</Text><Text style={styles.documentCopy}>{profile.cv_url?'Interview Ready and matching can use the CV evidence already stored on your WHC account.':'A CV gives matching and Interview Ready more evidence about your experience.'}</Text></View>
        {profile.cv_url?<Pressable onPress={()=>Linking.openURL(profile.cv_url)} style={styles.documentAction}><Text style={styles.documentActionText}>View CV</Text></Pressable>:null}
      </View>

      <Text style={styles.subsectionTitle}>Uploaded certificates</Text>
      <Text style={styles.sectionCopy}>These are documents you uploaded yourself. WHC Academy certificates remain verified records.</Text>
      {uploadedCertificates.length===0?<View style={styles.emptyCert}><Text style={styles.emptyCertTitle}>No uploaded certificates yet.</Text><Text style={styles.emptyCertCopy}>Any certificate already added to your WHC account will appear here automatically.</Text></View>:uploadedCertificates.map((url:string,index:number)=><View key={`${url}-${index}`} style={styles.certRow}><Pressable onPress={()=>Linking.openURL(url)} style={{flex:1}}><Text style={styles.certTitle} numberOfLines={1}>{certificateLabel(url,index)}</Text><Text style={styles.certOpen}>View certificate</Text></Pressable><Pressable onPress={()=>confirmRemoveCertificate(url,index)} style={styles.removeButton}><Text style={styles.removeText}>Remove</Text></Pressable></View>)}
    </View>

    <View style={styles.sectionBlock}>
      <Text style={styles.sectionEyebrow}>PRIVACY</Text>
      <Text style={styles.sectionTitle}>Control your visibility</Text>
      <Pressable onPress={()=>router.push('/privacy-stealth')} style={styles.linkCard}><View style={{flex:1}}><Text style={styles.linkCardTitle}>Stealth Mode & blocked employers</Text><Text style={styles.linkCardCopy}>Choose the exact employers, hotels or spas that must not be able to discover you.</Text></View><Text style={styles.chevron}>›</Text></Pressable>
      {toggle('profile_visible','Visible to employers','Allow eligible employers to discover your profile, except businesses you block in Stealth Mode.')}
      {toggle('show_first_name_only','First name only','Use a more private public display name.')}
      {toggle('job_alerts_enabled','Job alerts','Receive relevant role alerts when matching opportunities appear.')}
    </View>

    <Pressable onPress={()=>router.push('/security')} style={styles.securityCard}><View style={{flex:1}}><Text style={styles.securityEyebrow}>ACCOUNT</Text><Text style={styles.securityTitle}>Security, Authenticator & Legal</Text><Text style={styles.securityCopy}>Two-step verification, privacy, GDPR, Terms and safety information.</Text></View><Text style={styles.chevronLight}>›</Text></Pressable>

    <Pressable onPress={save} disabled={saving} style={[styles.button,saving&&styles.buttonDisabled]}><Text style={styles.buttonText}>{saving?'Saving…':'Save profile changes'}</Text></Pressable>
    {message?<Text style={styles.message}>{message}</Text>:null}
  </ScrollView>
}

const styles=StyleSheet.create({
  scroll:{flex:1,backgroundColor:palette.stone},
  page:{paddingHorizontal:space.page,paddingTop:18,paddingBottom:120},
  center:{flex:1,alignItems:'center',justifyContent:'center',padding:28,backgroundColor:palette.stone},
  emptyStateTitle:{color:palette.inkStrong,fontFamily:type.serif,fontSize:22,fontWeight:'400'},
  emptyStateCopy:{color:palette.muted,fontSize:12,lineHeight:18,textAlign:'center',marginTop:8},
  backButton:{alignSelf:'flex-start',paddingVertical:6,marginBottom:22},
  back:{color:palette.muted,fontSize:13},
  eyebrow:{color:palette.quiet,fontSize:8,letterSpacing:2.2,fontWeight:'700',marginBottom:9},
  title:{color:palette.inkStrong,fontSize:34,lineHeight:40,fontWeight:'400',fontFamily:type.serif},
  meta:{color:palette.muted,fontSize:12,lineHeight:18,marginTop:7,marginBottom:20},
  progressCard:{backgroundColor:palette.inkStrong,padding:18,borderRadius:radius.large,marginBottom:12},
  progressTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start'},
  progressEyebrow:{color:'#C8D1D2',fontSize:7.5,letterSpacing:1.5,fontWeight:'700'},
  progressNumber:{color:palette.paper,fontFamily:type.serif,fontSize:30,fontWeight:'400',marginTop:5},
  progressHint:{color:'#D8DEDF',fontSize:10,fontWeight:'700'},
  progressTrack:{height:3,backgroundColor:'rgba(255,255,255,.16)',marginTop:13,borderRadius:999,overflow:'hidden'},
  progressFill:{height:3,backgroundColor:'#D8DEDF'},
  photoCard:{flexDirection:'row',gap:15,alignItems:'center',borderWidth:1,borderColor:palette.line,padding:15,backgroundColor:palette.paper,borderRadius:radius.large,marginBottom:26},
  photo:{width:80,height:80,borderRadius:40},
  photoEmpty:{backgroundColor:palette.stoneDeep,alignItems:'center',justifyContent:'center'},
  photoInitial:{fontSize:30,color:palette.inkStrong,fontFamily:type.serif},
  photoTitle:{color:palette.inkStrong,fontSize:14,fontWeight:'700'},
  photoCopy:{color:palette.muted,fontSize:10.5,lineHeight:16,marginTop:3},
  smallButton:{alignSelf:'flex-start',borderWidth:1,borderColor:palette.lineStrong,paddingHorizontal:11,paddingVertical:8,marginTop:9,borderRadius:radius.medium},
  smallButtonText:{color:palette.ink,fontSize:9.5,fontWeight:'700'},
  sectionBlock:{marginBottom:30},
  sectionEyebrow:{color:palette.quiet,fontSize:8,letterSpacing:1.8,fontWeight:'700',marginBottom:6},
  sectionTitle:{color:palette.inkStrong,fontSize:23,lineHeight:28,fontWeight:'400',fontFamily:type.serif,marginBottom:12},
  label:{color:palette.text,fontSize:10.5,fontWeight:'700',marginBottom:6,marginTop:11},
  input:{borderWidth:1,borderColor:palette.line,backgroundColor:palette.paper,paddingHorizontal:13,paddingVertical:12,fontSize:13,color:palette.text,borderRadius:radius.medium},
  textarea:{minHeight:112,textAlignVertical:'top'},
  documentCard:{borderWidth:1,borderColor:palette.line,padding:15,backgroundColor:palette.paper,borderRadius:radius.large,flexDirection:'row',gap:12,alignItems:'center'},
  documentCardActive:{borderColor:'#BCC8BF',backgroundColor:'#FBFCFA'},
  documentStatus:{color:palette.sage,fontSize:7.5,fontWeight:'800',letterSpacing:1.1},
  documentTitle:{color:palette.inkStrong,fontSize:14,fontWeight:'700',marginTop:5},
  documentCopy:{color:palette.muted,fontSize:10.5,lineHeight:16,marginTop:4},
  documentAction:{borderWidth:1,borderColor:palette.lineStrong,paddingHorizontal:10,paddingVertical:9,borderRadius:radius.medium},
  documentActionText:{color:palette.ink,fontSize:9.5,fontWeight:'700'},
  subsectionTitle:{color:palette.text,fontSize:12,fontWeight:'700',marginTop:18,marginBottom:4},
  sectionCopy:{color:palette.muted,fontSize:10.5,lineHeight:16,marginBottom:10},
  emptyCert:{borderWidth:1,borderColor:palette.line,backgroundColor:palette.paper,padding:14,borderRadius:radius.medium},
  emptyCertTitle:{color:palette.inkStrong,fontSize:12,fontWeight:'700'},
  emptyCertCopy:{color:palette.muted,fontSize:10.5,lineHeight:16,marginTop:4},
  certRow:{borderWidth:1,borderColor:palette.line,padding:13,flexDirection:'row',alignItems:'center',gap:12,marginBottom:8,backgroundColor:palette.paper,borderRadius:radius.medium},
  certTitle:{color:palette.text,fontSize:11.5,fontWeight:'700'},
  certOpen:{color:palette.muted,fontSize:9.5,marginTop:4},
  removeButton:{paddingVertical:8,paddingHorizontal:8},
  removeText:{color:palette.danger,fontSize:9.5,fontWeight:'700'},
  linkCard:{borderWidth:1,borderColor:palette.line,backgroundColor:palette.paper,padding:15,flexDirection:'row',alignItems:'center',marginBottom:4,borderRadius:radius.large},
  linkCardTitle:{color:palette.inkStrong,fontSize:13.5,fontWeight:'700'},
  linkCardCopy:{color:palette.muted,fontSize:10.5,lineHeight:16,marginTop:4},
  toggleRow:{flexDirection:'row',alignItems:'center',paddingVertical:15,borderBottomWidth:1,borderBottomColor:palette.line},
  toggleTitle:{color:palette.text,fontSize:13,fontWeight:'700'},
  toggleCopy:{color:palette.muted,fontSize:10.5,lineHeight:16,marginTop:4},
  chevron:{color:palette.quiet,fontSize:22,marginLeft:12},
  securityCard:{backgroundColor:palette.inkStrong,padding:17,flexDirection:'row',alignItems:'center',borderRadius:radius.large,marginBottom:12},
  securityEyebrow:{color:'#C8D1D2',fontSize:7.5,letterSpacing:1.3,fontWeight:'700'},
  securityTitle:{color:palette.paper,fontSize:14,fontWeight:'700',marginTop:4},
  securityCopy:{color:'#D8DEDF',fontSize:10.5,lineHeight:16,marginTop:4},
  chevronLight:{color:palette.paper,fontSize:24,marginLeft:10},
  button:{marginTop:8,backgroundColor:palette.inkStrong,paddingVertical:15,alignItems:'center',borderRadius:radius.medium},
  buttonDisabled:{opacity:.55},
  buttonText:{color:palette.paper,fontSize:11.5,fontWeight:'700'},
  message:{marginTop:12,color:palette.muted,fontSize:11.5,textAlign:'center'},
})