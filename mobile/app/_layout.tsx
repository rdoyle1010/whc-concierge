import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { AppState, View } from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import MobileNav from '../src/components/MobileNav'
import { supabase } from '../src/lib/supabase'
import { registerPushNotifications } from '../src/lib/push'

export default function RootLayout() {
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
      if (!active || !session || (event !== 'SIGNED_IN' && event !== 'TOKEN_REFRESHED')) return
      registerPushNotifications().catch(error => console.warn('[Push registration skipped]', error))
    })
    const appStateListener = AppState.addEventListener('change', state => {
      if (state === 'active') register()
    })

    return () => {
      active = false
      listener.subscription.unsubscribe()
      appStateListener.remove()
    }
  }, [])

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
