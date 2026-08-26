import { useEffect } from 'react'
import { Stack, router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { View } from 'react-native'
import * as Notifications from 'expo-notifications'
import { registerPushNotifications } from '../src/lib/push'
import MobileNav from '../src/components/MobileNav'

function useNotificationRouting() {
  useEffect(() => {
    function openNotification(notification: Notifications.Notification) {
      const url = notification.request.content.data?.url
      if (typeof url === 'string' && url.startsWith('/')) {
        router.push(url as never)
      }
    }

    registerPushNotifications().catch(() => null)

    const lastResponse = Notifications.getLastNotificationResponse()
    if (lastResponse?.notification) openNotification(lastResponse.notification)

    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      openNotification(response.notification)
    })

    return () => subscription.remove()
  }, [])
}

export default function RootLayout() {
  useNotificationRouting()

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <StatusBar style="dark" />
      <View style={{ flex: 1 }}><Stack screenOptions={{ headerShown: false, animation: 'fade' }} /></View>
      <MobileNav />
    </View>
  )
}
