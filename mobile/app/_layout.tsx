import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { View } from 'react-native'
import MobileNav from '../src/components/MobileNav'

export default function RootLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <StatusBar style="dark" />
      <View style={{ flex: 1 }}><Stack screenOptions={{ headerShown: false, animation: 'fade' }} /></View>
      <MobileNav />
    </View>
  )
}
