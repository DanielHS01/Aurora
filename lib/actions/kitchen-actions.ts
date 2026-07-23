'use server'

import { requireBusinessAccess } from '@/lib/auth/session'
import {
  createKitchenTicket,
  updateKitchenTicketStatus,
} from '@/lib/queries/kitchen'
import type { KitchenTicketStatus } from '@/lib/types'
import { revalidatePath } from 'next/cache'

export async function createKitchenTicketAction(businessId: string, orderId: string) {
  await requireBusinessAccess(businessId)
  const ticket = await createKitchenTicket(businessId, orderId)
  revalidatePath('/kitchen')
  return ticket
}

export async function updateKitchenTicketStatusAction(
  ticketId: string,
  businessId: string,
  status: KitchenTicketStatus
) {
  await requireBusinessAccess(businessId)
  await updateKitchenTicketStatus(ticketId, status)
  revalidatePath('/kitchen')
}