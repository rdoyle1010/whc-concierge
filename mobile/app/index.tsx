import { useEffect } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../src/lib/supabase'
import { palette } from '../src/lib/theme'

export default function IndexScreen() {
  useEffect(() => {
    let active = true

    const routeAccount = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!active) return

      if (!session?.user) {
        router.replace('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle()

      if (!active) return
      if (profile?.role === 'admin') {
        router.replace('/admin')
        return
      }

      router.replace('/home')
    }

    void routeAccount()
    return () => { active = false }
  }, [])

  return (
    <View style={styles.page}>
      <ActivityIndicator color={palette.ink} />
    </View>
  )
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.paper,
  },
})