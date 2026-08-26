import { Platform } from 'react-native'
import Constants from 'expo-constants'
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import { supabase } from './supabase'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

export async function registerPushNotifications() {
  if (!Device.isDevice) return null

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('platform-updates', {
      name: 'Platform updates',
      importance: Notifications.AndroidImportance.HIGH,
    })
  }

  const existing = await Notifications.getPermissionsAsync()
  let status = existing.status
  if (status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync()
    status = requested.status
  }
  if (status !== 'granted') return null

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId
  if (!projectId) return null

  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return token

  await supabase.from('mobile_push_tokens').upsert({
    user_id: user.id,
    expo_push_token: token,
    platform: Platform.OS,
    device_name: Device.deviceName || Device.modelName || null,
    app_version: Constants.expoConfig?.version || null,
    is_active: true,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'expo_push_token' })

  return token
}
