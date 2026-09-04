import { useRef, useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../src/lib/supabase'
import { ensureTalentRecords } from '../src/lib/talent-bootstrap'
import { palette, radius, space, type } from '../src/lib/theme'

export default function TalentSignupScreen(){
  const [fullName,setFullName]=useState('')
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [confirmPassword,setConfirmPassword]=useState('')
  const [accepted,setAccepted]=useState(false)
  const [loading,setLoading]=useState(false)
  const emailRef=useRef<TextInput>(null)
  const passwordRef=useRef<TextInput>(null)
  const confirmRef=useRef<TextInput>(null)

  async function createAccount(){
    const name=fullName.trim()
    const cleanEmail=email.trim().toLowerCase()
    if(name.length<2){Alert.alert('Your name','Enter your full name.');return}
    if(!cleanEmail.includes('@')){Alert.alert('Email','Enter a valid email address.');return}
    if(password.length<8){Alert.alert('Password','Use at least 8 characters.');return}
    if(password!==confirmPassword){Alert.alert('Password','The passwords do not match.');return}
    if(!accepted){Alert.alert('Before you continue','Please confirm that you agree to the platform Terms and Privacy Notice.');return}

    setLoading(true)
    try{
      const {data,error}=await supabase.auth.signUp({
        email:cleanEmail,
        password,
        options:{data:{full_name:name,role:'talent'}},
      })
      if(error)throw error
      if(!data.user)throw new Error('We could not create your account.')

      if(data.session){
        const bootstrap=await ensureTalentRecords(data.user,name)
        if(bootstrap.role!=='talent')throw new Error('This email is already linked to a different Wellness House account type.')
        router.replace('/home')
        return
      }

      Alert.alert('Check your email','Your Talent account has been created. Open the confirmation email, then return to the app and sign in.',[
        {text:'Go to sign in',onPress:()=>router.replace({pathname:'/login',params:{role:'talent'}})},
      ])
    }catch(error:any){
      const message=String(error?.message||'Could not create your account.')
      Alert.alert('Could not create account',message)
    }finally{
      setLoading(false)
    }
  }

  return <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS==='ios'?'padding':'height'} keyboardVerticalOffset={8}>
    <ScrollView style={styles.scroll} contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
      <Pressable onPress={()=>router.back()}><Text style={styles.back}>← Back</Text></Pressable>
      <Text style={styles.wordmark}>WELLNESS HOUSE</Text><Text style={styles.sub}>TALENT</Text>
      <Text style={styles.eyebrow}>CREATE YOUR ACCOUNT</Text>
      <Text style={styles.title}>One profile for your whole career.</Text>
      <Text style={styles.intro}>Create your Talent account, then build your profile, upload your CV, discover roles and manage applications from the app.</Text>

      <View style={styles.form}>
        <Text style={styles.label}>Full name</Text>
        <TextInput value={fullName} onChangeText={setFullName} returnKeyType="next" onSubmitEditing={()=>emailRef.current?.focus()} placeholder="Your full name" placeholderTextColor={palette.quiet} style={styles.input}/>
        <Text style={styles.label}>Email</Text>
        <TextInput ref={emailRef} value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" returnKeyType="next" onSubmitEditing={()=>passwordRef.current?.focus()} placeholder="you@example.com" placeholderTextColor={palette.quiet} style={styles.input}/>
        <Text style={styles.label}>Password</Text>
        <TextInput ref={passwordRef} value={password} onChangeText={setPassword} secureTextEntry returnKeyType="next" onSubmitEditing={()=>confirmRef.current?.focus()} placeholder="At least 8 characters" placeholderTextColor={palette.quiet} style={styles.input}/>
        <Text style={styles.label}>Confirm password</Text>
        <TextInput ref={confirmRef} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry returnKeyType="done" onSubmitEditing={createAccount} placeholder="Repeat your password" placeholderTextColor={palette.quiet} style={styles.input}/>

        <Pressable onPress={()=>setAccepted(current=>!current)} style={styles.consentRow}>
          <View style={[styles.checkbox,accepted&&styles.checkboxOn]}>{accepted?<Text style={styles.tick}>✓</Text>:null}</View>
          <Text style={styles.consent}>I agree to the Wellness House Terms and Privacy Notice and understand that my professional profile is used to provide Talent services.</Text>
        </Pressable>

        <Pressable disabled={loading} onPress={createAccount} style={[styles.primary,loading&&styles.disabled]}><Text style={styles.primaryText}>{loading?'Creating account…':'Create Talent account'}</Text></Pressable>
        <Pressable onPress={()=>router.replace({pathname:'/login',params:{role:'talent'}})} style={styles.signIn}><Text style={styles.signInText}>Already have an account? Sign in</Text></Pressable>
      </View>
    </ScrollView>
  </KeyboardAvoidingView>
}

const styles=StyleSheet.create({
  flex:{flex:1,backgroundColor:palette.stone},scroll:{flex:1,backgroundColor:palette.stone},page:{paddingHorizontal:space.page,paddingTop:20,paddingBottom:160},
  back:{color:palette.muted,fontSize:13,marginBottom:30},wordmark:{color:palette.inkStrong,fontSize:20,letterSpacing:2.2,fontWeight:'700'},sub:{color:palette.quiet,fontSize:9,letterSpacing:3,marginTop:4,marginBottom:38},
  eyebrow:{fontSize:8,letterSpacing:2.1,color:palette.quiet,marginBottom:10,fontWeight:'700'},title:{color:palette.inkStrong,fontSize:35,lineHeight:41,fontWeight:'400',fontFamily:type.serif},intro:{color:palette.muted,fontSize:13,lineHeight:20,marginTop:10,marginBottom:22},
  form:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,padding:18,borderRadius:radius.large},label:{color:palette.text,fontSize:11,fontWeight:'700',marginBottom:7},input:{height:52,borderWidth:1,borderColor:palette.lineStrong,backgroundColor:palette.paper,paddingHorizontal:14,marginBottom:15,color:palette.text,fontSize:15,borderRadius:radius.medium},
  consentRow:{flexDirection:'row',alignItems:'flex-start',gap:10,marginTop:2,marginBottom:17},checkbox:{width:22,height:22,borderWidth:1,borderColor:palette.lineStrong,borderRadius:5,alignItems:'center',justifyContent:'center',backgroundColor:palette.paper},checkboxOn:{backgroundColor:palette.inkStrong,borderColor:palette.inkStrong},tick:{color:palette.paper,fontSize:13,fontWeight:'800'},consent:{flex:1,color:palette.muted,fontSize:9.5,lineHeight:15},
  primary:{height:52,backgroundColor:palette.inkStrong,alignItems:'center',justifyContent:'center',borderRadius:radius.medium},primaryText:{color:palette.paper,fontSize:12,fontWeight:'700'},disabled:{opacity:.5},signIn:{paddingVertical:15,alignItems:'center'},signInText:{color:palette.ink,fontSize:10.5,fontWeight:'700'}
})
