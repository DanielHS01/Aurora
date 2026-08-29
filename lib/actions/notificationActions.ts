'use server'

import { markNotificationRead as markRead } from '@/lib/queries/notifications'
import { revalidatePath } from 'next/cache'

export async function markNotificationRead(notificationId: string) {
  await markRead(notificationId)
  revalidatePath('/dashboard')
}