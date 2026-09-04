import { useCallback, useEffect, useRef } from 'react'
import { Stack, router, usePathname } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { AppState, View } from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import MobileNav from '../src/components/MobileNav'
import { supabase } from '../src/lib/supabase'
import { registerPushNotifications } from '../src/lib/push'
import { mfaRequirement } from '../src/lib/mfa-guard'

// Screens a half-verified session is allowed to sit on. Everything else is
// account data and must wait for the second step.
const MFA_EXEMPT = ['/', '/index', '/login', '/mfa-challenge']

export default function RootLayout() {
  const pathname = usePathname()
  const pathnameRef = useRef(pathname)
  pathnameRef.current = pathname

  const enforceMfa = useCallback(async () => {
    const current = pathnameRef.current || '/'
    if (MFA_EXEMPT.includes(current)) return
    const requirement = await mfaRequirement()
    if (!requirement.required) return
    router.replace({
      pathname: '/mfa-challenge',
      params: { factorId: requirement.factorId || '', role: requirement.role || '' },
    })
  }, [])

  useEffect(() => { enforceMfa() }, [pathname, enforceMfa])

  useEffect(() => {
    let active = true

    const register = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!active || !session) return
      try {
        await registerPushNotifications()
      } catch (error) {
        console.warn('[Push registration skipped]', error)
      }
    }

    register()
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session) registerPushNotifications().catch(error => console.warn('[Push registration skipped]', error))
        enforceMfa()
      }
    })
    const appStateListener = AppState.addEventListener('change', state => {
      if (state === 'active') { register(); enforceMfa() }
    })

    return () => {
      active = false
      listener.subscription.unsubscribe()
      appStateListener.remove()
    }
  }, [enforceMfa])

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        <StatusBar style="dark" />
        <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#fff' }}>
          <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
        </SafeAreaView>
        <SafeAreaView edges={['bottom']} style={{ backgroundColor: '#fff' }}>
          <MobileNav />
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  )
}
