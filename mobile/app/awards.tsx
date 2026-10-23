import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../src/lib/supabase'
import { palette, radius, space, type } from '../src/lib/theme'

type Role='talent'|'employer'
type AwardItem={name:string;issuer?:string;year?:string;url?:string}
const blank=():AwardItem=>({name:'',issuer:'',year:'',url:''})

export default function AwardsScreen(){
 const [role,setRole]=useState<Role>('talent')
 const [profileId,setProfileId]=useState('')
 const [awards,setAwards]=useState<AwardItem[]>([])
 const [loading,setLoading]=useState(true)
 const [saving,setSaving]=useState(false)
 const [error,setError]=useState('')

 useEffect(()=>{void load()},[])

 async function load(){
  const {data:{user}}=await supabase.auth.getUser()
  if(!user){router.replace('/login');return}
  const {data:account}=await supabase.from('profiles').select('role').eq('id',user.id).maybeSingle()
  const resolved:Role=account?.role==='employer'?'employer':'talent'
  setRole(resolved)
  const table=resolved==='talent'?'candidate_profiles':'employer_profiles'
  const {data,error:e}=await supabase.from(table).select('id,awards').eq('user_id',user.id).maybeSingle()
  if(e)setError(e.message)
  if(data){setProfileId(data.id);setAwards(Array.isArray(data.awards)?data.awards:[])}
  setLoading(false)
 }

 function update(index:number,key:keyof AwardItem,value:string){setAwards(current=>current.map((award,i)=>i===index?{...award,[key]:value}:award))}

 async function save(){
  if(!profileId)return
  setSaving(true);setError('')
  const clean=awards.map(award=>({
   name:String(award.name||'').trim().slice(0,180),
   issuer:String(award.issuer||'').trim().slice(0,180),
   year:String(award.year||'').trim().slice(0,20),
   url:String(award.url||'').trim().slice(0,500),
  })).filter(award=>award.name)
  const table=role==='talent'?'candidate_profiles':'employer_profiles'
  const {error:e}=await supabase.from(table).update({awards:clean}).eq('id',profileId)
  setSaving(false)
  if(e){setError(e.message);return}
  setAwards(clean)
  Alert.alert('Saved','Your awards and recognition have been updated.')
 }

 if(loading)return <View style={styles.center}><ActivityIndicator color={palette.ink}/></View>

 return <ScrollView style={styles.scroll} contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
  <Pressable onPress={()=>router.back()} style={styles.backButton}><Text style={styles.back}>‹ Back</Text></Pressable>
  <Text style={styles.eyebrow}>{role==='talent'?'CAREER PROFILE':'PROPERTY PROFILE'}</Text>
  <Text style={styles.title}>Awards & recognition</Text>
  <Text style={styles.intro}>{role==='talent'?'Build a credible record of professional recognition. Add genuine awards, the awarding body and evidence where available.':'Build a credible record of property and spa recognition so Talent can understand the strength of your brand.'}</Text>
  {error?<Text style={styles.error}>{error}</Text>:null}

  <View style={styles.summaryCard}>
   <View><Text style={styles.summaryEyebrow}>RECOGNITION RECORD</Text><Text style={styles.summaryNumber}>{awards.length}</Text><Text style={styles.summaryCopy}>award{awards.length===1?'':'s'} currently recorded</Text></View>
   <Pressable onPress={()=>setAwards(current=>[...current,blank()])} style={styles.add}><Text style={styles.addText}>Add award</Text></Pressable>
  </View>

  <View style={styles.list}>{awards.length===0?<View style={styles.empty}>
   <Text style={styles.emptyEyebrow}>BUILD YOUR RECORD</Text>
   <Text style={styles.emptyTitle}>No awards added yet.</Text>
   <Text style={styles.emptyCopy}>Only add recognition you can stand behind. Including the awarding body, year and evidence makes the record more useful and credible.</Text>
  </View>:awards.map((award,index)=><View key={index} style={styles.card}>
   <View style={styles.cardTop}><View><Text style={styles.cardLabel}>AWARD {index+1}</Text><Text style={styles.cardHeading}>{award.name||'New recognition'}</Text></View><Pressable onPress={()=>setAwards(current=>current.filter((_,i)=>i!==index))} style={styles.removeButton}><Text style={styles.remove}>Remove</Text></Pressable></View>
   <Text style={styles.label}>Award name</Text>
   <TextInput style={styles.input} value={award.name||''} onChangeText={value=>update(index,'name',value)} placeholder="e.g. Best Hotel Spa UK" placeholderTextColor={palette.quiet}/>
   <Text style={styles.label}>Awarding body</Text>
   <TextInput style={styles.input} value={award.issuer||''} onChangeText={value=>update(index,'issuer',value)} placeholder="e.g. Good Spa Guide" placeholderTextColor={palette.quiet}/>
   <View style={styles.row}>
    <View style={styles.half}><Text style={styles.label}>Year</Text><TextInput style={styles.input} value={award.year||''} onChangeText={value=>update(index,'year',value)} placeholder="2026" placeholderTextColor={palette.quiet}/></View>
    <View style={styles.half}><Text style={styles.label}>Evidence link</Text><TextInput style={styles.input} value={award.url||''} onChangeText={value=>update(index,'url',value)} placeholder="https://" placeholderTextColor={palette.quiet} autoCapitalize="none"/></View>
   </View>
   {award.url?<Pressable onPress={()=>Linking.openURL(award.url!)} style={styles.evidenceRow}><Text style={styles.evidenceText}>Open supporting evidence</Text><Text style={styles.arrow}>→</Text></Pressable>:null}
  </View>)}</View>

  <View style={styles.note}><Text style={styles.noteEyebrow}>CREDIBILITY</Text><Text style={styles.noteTitle}>Recognition should add trust, not decoration.</Text><Text style={styles.noteCopy}>Use this record for genuine industry, property, professional or employer awards. Talent House can then present recognition as evidence rather than a promotional badge.</Text></View>

  <Pressable disabled={saving} onPress={save} style={[styles.save,saving&&styles.disabled]}><Text style={styles.saveText}>{saving?'Saving…':'Save recognition record'}</Text></Pressable>
 </ScrollView>
}

const styles=StyleSheet.create({
 scroll:{flex:1,backgroundColor:palette.stone},
 page:{paddingHorizontal:space.page,paddingTop:18,paddingBottom:118},
 center:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:palette.stone},
 backButton:{alignSelf:'flex-start',paddingVertical:6,marginBottom:22},
 back:{color:palette.muted,fontSize:13,fontFamily:type.sans},
 eyebrow:{color:palette.quiet,fontSize:8,letterSpacing:2.2,fontWeight:'700',marginBottom:9,fontFamily:type.sans},
 title:{color:palette.inkStrong,fontSize:34,lineHeight:40,fontWeight:'400',fontFamily:type.serif},
 intro:{color:palette.muted,fontSize:13,lineHeight:20,marginTop:10,marginBottom:22,fontFamily:type.sans},
 error:{color:palette.danger,fontSize:11,lineHeight:17,marginBottom:14,fontFamily:type.sans},
 summaryCard:{backgroundColor:palette.inkStrong,padding:18,borderRadius:radius.large,marginBottom:16,flexDirection:'row',alignItems:'flex-end',justifyContent:'space-between',gap:14},
 summaryEyebrow:{color:'#C8D1D2',fontSize:7.5,letterSpacing:1.4,fontWeight:'700',fontFamily:type.sans},
 summaryNumber:{color:palette.paper,fontFamily:type.serif,fontSize:31,fontWeight:'400',marginTop:4},
 summaryCopy:{color:'#D8DEDF',fontSize:9.5,marginTop:2,fontFamily:type.sans},
 add:{borderWidth:1,borderColor:'rgba(255,255,255,.3)',paddingHorizontal:13,paddingVertical:10,borderRadius:radius.medium},
 addText:{color:palette.paper,fontSize:10,fontWeight:'700',fontFamily:type.sans},
 list:{gap:11},
 card:{borderWidth:1,borderColor:palette.line,padding:17,backgroundColor:palette.paper,borderRadius:radius.large},
 cardTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start',gap:12,marginBottom:8},
 cardLabel:{fontSize:7.5,letterSpacing:1.3,color:palette.quiet,fontWeight:'700',fontFamily:type.sans},
 cardHeading:{color:palette.inkStrong,fontFamily:type.serif,fontSize:18,lineHeight:22,marginTop:4},
 removeButton:{paddingVertical:5,paddingLeft:8},
 remove:{color:palette.danger,fontSize:9.5,fontWeight:'700',fontFamily:type.sans},
 label:{color:palette.quiet,fontSize:8,letterSpacing:.8,marginTop:11,marginBottom:5,fontWeight:'700',fontFamily:type.sans},
 input:{borderWidth:1,borderColor:palette.line,paddingHorizontal:12,paddingVertical:11,color:palette.text,fontSize:11.5,backgroundColor:palette.stone,borderRadius:radius.medium,fontFamily:type.sans},
 row:{flexDirection:'row',gap:10},
 half:{flex:1},
 evidenceRow:{borderTopWidth:1,borderTopColor:palette.line,marginTop:14,paddingTop:12,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
 evidenceText:{color:palette.ink,fontSize:10,fontWeight:'700',fontFamily:type.sans},
 arrow:{color:palette.ink,fontSize:15},
 empty:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,padding:19,borderRadius:radius.large},
 emptyEyebrow:{color:palette.quiet,fontSize:7.5,letterSpacing:1.2,fontWeight:'700',fontFamily:type.sans},
 emptyTitle:{color:palette.inkStrong,fontSize:20,lineHeight:25,fontWeight:'400',fontFamily:type.serif,marginTop:5},
 emptyCopy:{color:palette.muted,fontSize:10.5,lineHeight:17,marginTop:5,fontFamily:type.sans},
 note:{backgroundColor:palette.stoneDeep,padding:17,borderRadius:radius.large,marginTop:18},
 noteEyebrow:{color:palette.quiet,fontSize:7.5,letterSpacing:1.2,fontWeight:'700',fontFamily:type.sans},
 noteTitle:{color:palette.inkStrong,fontSize:18,lineHeight:23,fontWeight:'400',fontFamily:type.serif,marginTop:5},
 noteCopy:{color:palette.muted,fontSize:10.5,lineHeight:17,marginTop:5,fontFamily:type.sans},
 save:{backgroundColor:palette.ink,paddingVertical:14,alignItems:'center',marginTop:18,borderRadius:radius.medium},
 saveText:{color:palette.paper,fontSize:11,fontWeight:'700',fontFamily:type.sans},
 disabled:{opacity:.5},
})