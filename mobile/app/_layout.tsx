import { useEffect } from 'react'
import { Stack, router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { View } from 'react-native'
import * as Notifications from 'expo-notifications'
import { registerPushNotifications } from '../src/lib/push'
import MobileNav from '../src/components/MobileNav'

function mobileDestination(destination: string) {
  const exact: Record<string, string> = {
    '/talent/applications': '/applications',
    '/employer/applications': '/applications',
    '/talent/messages': '/messages',
    '/employer/messages': '/messages',
    '/talent/notifications': '/notifications',
    '/employer/notifications': '/notifications',
    '/talent/agency': '/agency',
    '/employer/agency': '/agency',
    '/talent/residency': '/residency',
    '/employer/residency': '/residency',
  }
  return exact[destination] || destination
}

function useNotificationRouting() {
  useEffect(() => {
    function openNotification(notification: Notifications.Notification) {
      const data = notification.request.content.data || {}
      const destination = typeof data.url === 'string' ? data.url : typeof data.link === 'string' ? data.link : ''
      const route = mobileDestination(destination)
      if (route.startsWith('/')) {
        router.push(route as never)
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
