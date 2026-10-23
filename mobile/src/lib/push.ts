import { Platform } from 'react-native'
import Constants from 'expo-constants'
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import { supabase } from './supabase'

const WEB_URL=process.env.EXPO_PUBLIC_WEB_URL||'https://talenthousecollective.co.uk'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

async function scheduleAgencyShiftReminders(userId:string){
  try{
    const scheduled=await Notifications.getAllScheduledNotificationsAsync()
    await Promise.all(scheduled.filter(item=>String(item.content?.data?.kind||'')==='agency_shift_reminder').map(item=>Notifications.cancelScheduledNotificationAsync(item.identifier)))

    const {data:profile}=await supabase.from('profiles').select('role').eq('id',userId).maybeSingle()
    const role=profile?.role==='employer'?'employer':'talent'
    let profileId:string|null=null
    if(role==='employer'){
      const {data}=await supabase.from('employer_profiles').select('id').eq('user_id',userId).maybeSingle();profileId=data?.id||null
    }else{
      const {data}=await supabase.from('candidate_profiles').select('id').eq('user_id',userId).maybeSingle();profileId=data?.id||null
    }
    if(!profileId)return

    let query=supabase.from('agency_bookings').select('id,shift_date,shift_start_time,shift_type,status').in('status',['accepted','confirmed'])
    query=role==='employer'?query.eq('employer_id',profileId):query.eq('candidate_id',profileId)
    const {data:bookings}=await query.order('shift_date',{ascending:true}).limit(30)
    const now=Date.now()
    for(const booking of bookings||[]){
      if(!booking.shift_date)continue
      const start=String(booking.shift_start_time||'09:00').slice(0,5)
      const shiftStart=new Date(`${booking.shift_date}T${start}:00`)
      const shiftMs=shiftStart.getTime()
      if(!Number.isFinite(shiftMs)||shiftMs<=now)continue
      const title=booking.shift_type||'Agency shift'
      const reminders=[
        {when:shiftMs-24*60*60*1000,body:`${title} is tomorrow. Open Agency to re-check your Fact File, travel and arrival details.`},
        {when:shiftMs-2*60*60*1000,body:`${title} starts in 2 hours. Check travel, arrival point and contact details before you set off.`},
      ]
      for(const reminder of reminders){
        if(reminder.when<=now)continue
        await Notifications.scheduleNotificationAsync({
          content:{title:'Agency shift reminder',body:reminder.body,data:{kind:'agency_shift_reminder',bookingId:booking.id,route:'/agency'},badge:1,sound:true},
          trigger:{type:Notifications.SchedulableTriggerInputTypes.DATE,date:new Date(reminder.when)},
        })
      }
    }
  }catch(error){console.warn('[Agency reminders skipped]',error)}
}

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
  const {data:{session}}=await supabase.auth.getSession()
  if(!session?.access_token)return token

  const response=await fetch(`${WEB_URL}/api/mobile/push-token`,{
    method:'POST',
    headers:{Authorization:`Bearer ${session.access_token}`,'Content-Type':'application/json'},
    body:JSON.stringify({
      expoPushToken:token,
      platform:Platform.OS,
      deviceName:Device.deviceName||Device.modelName||null,
      appVersion:Constants.expoConfig?.version||null,
    }),
  })
  if(!response.ok)console.warn('[Push registration failed]',response.status)

  await scheduleAgencyShiftReminders(user.id)
  return token
}
