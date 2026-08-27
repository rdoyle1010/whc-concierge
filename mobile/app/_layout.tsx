import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { View } from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import MobileNav from '../src/components/MobileNav'

export default function RootLayout() {
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
