import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { palette, radius, space, type } from '../src/lib/theme'

// A front door.
//
// The app opened straight onto a sign-in form. Somebody who has just
// downloaded it - from a link a colleague sent, from the App Store, from a
// QR code at a trade show - was asked for a password before being told what
// the thing is or who it is for. The website has a homepage doing that job.
// The app went from icon to credentials with nothing in between, which is the
// single most expensive screen to get wrong: it is the only one every new
// person sees, and the only one they can leave from without an account.
//
// Signed-in people never see this. index.tsx sends them to their dashboard.

const LINES = [
  ['Roles', 'Spa and wellness positions at properties that are actually hiring, matched against what you can genuinely do.'],
  ['Agency shifts', 'Flexible cover, agreed rate, paid after the shift. You keep one hundred per cent of the rate you agreed.'],
  ['Academy', 'Professional development with a certificate at the end, and a record properties can verify.'],
]

export default function WelcomeScreen() {
  return <ScrollView style={styles.scroll} contentContainerStyle={styles.page}>
    <View style={styles.hero}>
      <Text style={styles.eyebrow}>TALENT HOUSE COLLECTIVE</Text>
      <Text style={styles.title}>Where luxury spa and wellness professionals find their next thing.</Text>
      <Text style={styles.intro}>A register of properties worth working for, flexible shifts when you want them, and the training that gets you the job after this one.</Text>
    </View>

    {LINES.map(([heading, copy]) => <View key={heading} style={styles.line}>
      <Text style={styles.lineTitle}>{heading}</Text>
      <Text style={styles.lineCopy}>{copy}</Text>
    </View>)}

    <Pressable onPress={() => router.push('/signup')} style={styles.primary}>
      <Text style={styles.primaryText}>CREATE A TALENT ACCOUNT</Text>
    </Pressable>
    <Pressable onPress={() => router.push('/login')} style={styles.secondary}>
      <Text style={styles.secondaryText}>SIGN IN</Text>
    </Pressable>

    <Text style={styles.footnote}>Recruiting for a property? Sign in with your employer account - the app knows which one you are.</Text>
  </ScrollView>
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: palette.stone },
  page: { paddingHorizontal: space.page, paddingTop: 72, paddingBottom: 60 },
  hero: { marginBottom: 34 },
  eyebrow: { color: palette.quiet, fontSize: 8.5, letterSpacing: 2.6, fontWeight: '700', marginBottom: 16 },
  title: { color: palette.inkStrong, fontFamily: type.serif, fontSize: 33, lineHeight: 40, fontWeight: '400' },
  intro: { color: palette.muted, fontSize: 13.5, lineHeight: 21, marginTop: 14 },
  line: { borderTopWidth: 1, borderTopColor: palette.line, paddingVertical: 16 },
  lineTitle: { color: palette.inkStrong, fontSize: 14, fontWeight: '700' },
  lineCopy: { color: palette.muted, fontSize: 11.5, lineHeight: 18, marginTop: 5 },
  primary: { backgroundColor: palette.inkStrong, paddingVertical: 15, alignItems: 'center', marginTop: 30, borderRadius: radius.medium },
  primaryText: { color: palette.paper, fontSize: 11, fontWeight: '700', letterSpacing: .8 },
  secondary: { borderWidth: 1, borderColor: palette.lineStrong, paddingVertical: 14, alignItems: 'center', marginTop: 10, borderRadius: radius.medium },
  secondaryText: { color: palette.ink, fontSize: 11, fontWeight: '700', letterSpacing: .8 },
  footnote: { color: palette.quiet, fontSize: 10.5, lineHeight: 16, textAlign: 'center', marginTop: 26 },
})
