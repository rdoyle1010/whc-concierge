import { useEffect, useState } from 'react'
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../src/lib/supabase'
import { palette, radius, space, type } from '../src/lib/theme'

const COVER_IMAGE = 'https://raw.githubusercontent.com/rdoyle1010/whc-concierge/main/public/images/gathering-canopy.jpg'

export default function IndexScreen() {
  const [hasSession, setHasSession] = useState(false)

  useEffect(() => {
    let active = true
    supabase.auth.getUser().then(({ data }) => {
      if (active) setHasSession(Boolean(data.user))
    })
    return () => { active = false }
  }, [])

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.page}>
      <ImageBackground source={{ uri: COVER_IMAGE }} style={styles.heroImage} imageStyle={styles.heroImageInner}>
        <View style={styles.overlay} />
        <View style={styles.heroContent}>
          <View>
            <Text style={styles.wordmark}>WELLNESS HOUSE</Text>
            <Text style={styles.sub}>TALENT · EMPLOYERS · WELLNESS</Text>
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrowLight}>SPA & WELLNESS CAREERS</Text>
            <Text style={styles.titleLight}>Jobs, staffing and career growth in one place.</Text>
            <Text style={styles.introLight}>For spa and wellness professionals building their careers, and employers looking for the right people.</Text>
          </View>
        </View>
      </ImageBackground>

      <View style={styles.content}>
        {hasSession ? (
          <Pressable onPress={() => router.push('/home')} style={styles.primary}>
            <Text style={styles.primaryText}>Continue to your account</Text>
          </Pressable>
        ) : (
          <Pressable onPress={() => router.push('/login')} style={styles.primary}>
            <Text style={styles.primaryText}>Sign in</Text>
          </Pressable>
        )}

        <Text style={styles.sectionEyebrow}>CHOOSE YOUR SPACE</Text>
        <View style={styles.roleGrid}>
          <Pressable onPress={() => router.push({ pathname: '/login', params: { role: 'talent' } })} style={styles.roleCard}>
            <View style={styles.roleTop}><Text style={styles.roleEyebrow}>TALENT</Text><Text style={styles.arrow}>→</Text></View>
            <Text style={styles.roleTitle}>Find the right next move.</Text>
            <Text style={styles.roleCopy}>Permanent jobs, Agency shifts, Residency, Interview Ready, Academy and one professional profile.</Text>
          </Pressable>
          <Pressable onPress={() => router.push({ pathname: '/login', params: { role: 'employer' } })} style={styles.roleCard}>
            <View style={styles.roleTop}><Text style={styles.roleEyebrow}>EMPLOYERS</Text><Text style={styles.arrow}>→</Text></View>
            <Text style={styles.roleTitle}>Build stronger spa teams.</Text>
            <Text style={styles.roleCopy}>Post roles, discover matched Talent, manage interviews, Agency cover and recruitment in one place.</Text>
          </Pressable>
        </View>

        <View style={styles.footerNote}>
          <Text style={styles.footerEyebrow}>ONE CONNECTED PLATFORM</Text>
          <Text style={styles.footerTitle}>The app and website stay in sync.</Text>
          <Text style={styles.footerCopy}>Profiles, roles, applications, bookings and messages all use the same live Wellness House account.</Text>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll:{flex:1,backgroundColor:palette.paper},
  page:{paddingBottom:34},
  heroImage:{minHeight:500,justifyContent:'flex-end'},
  heroImageInner:{resizeMode:'cover'},
  overlay:{position:'absolute',top:0,right:0,bottom:0,left:0,backgroundColor:'rgba(8,32,49,.50)'},
  heroContent:{minHeight:500,paddingHorizontal:space.page,paddingTop:26,paddingBottom:30,justifyContent:'space-between'},
  wordmark:{color:palette.paper,fontSize:20,letterSpacing:2.1,fontWeight:'700',fontFamily:type.sans},
  sub:{color:'#E7EDF0',marginTop:4,fontSize:7.5,letterSpacing:2.3,fontFamily:type.sans},
  heroCopy:{marginTop:'auto',maxWidth:350},
  eyebrowLight:{color:'#E3EAED',fontSize:8,letterSpacing:1.8,marginBottom:10,fontWeight:'700',fontFamily:type.sans},
  titleLight:{color:palette.paper,fontSize:36,lineHeight:41,fontWeight:'400',fontFamily:type.serif},
  introLight:{color:'#EDF2F4',fontSize:13.5,lineHeight:20,marginTop:13,maxWidth:340,fontFamily:type.sans},
  content:{paddingHorizontal:space.page,paddingTop:22},
  primary:{backgroundColor:palette.ink,paddingVertical:15,alignItems:'center',marginBottom:28,borderRadius:radius.medium},
  primaryText:{color:palette.paper,fontSize:11,fontWeight:'700',fontFamily:type.sans},
  sectionEyebrow:{color:palette.quiet,fontSize:8,letterSpacing:1.9,marginBottom:10,fontWeight:'700',fontFamily:type.sans},
  roleGrid:{gap:10},
  roleCard:{borderWidth:1,borderColor:palette.line,padding:18,backgroundColor:palette.paper,borderRadius:radius.large},
  roleTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  roleEyebrow:{color:palette.quiet,fontSize:8,letterSpacing:1.7,fontWeight:'700',fontFamily:type.sans},
  arrow:{color:palette.ink,fontSize:16},
  roleTitle:{color:palette.inkStrong,fontSize:21,lineHeight:26,fontWeight:'400',fontFamily:type.serif,marginTop:7},
  roleCopy:{color:palette.muted,fontSize:11.5,lineHeight:18,marginTop:6,fontFamily:type.sans},
  footerNote:{backgroundColor:palette.stone,padding:17,marginTop:20,borderRadius:radius.large},
  footerEyebrow:{color:palette.quiet,fontSize:7.5,letterSpacing:1.4,fontWeight:'700',fontFamily:type.sans},
  footerTitle:{color:palette.inkStrong,fontSize:16,fontWeight:'400',fontFamily:type.serif,marginTop:5},
  footerCopy:{color:palette.muted,fontSize:10.5,lineHeight:17,marginTop:5,fontFamily:type.sans},
})
