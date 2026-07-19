'use server'

import { requireBusinessAccess } from '@/lib/auth/session'
import {
  createTable,
  updateTable,
  updateTableStatus,
  deleteTable,
  createBusinessArea,
} from '@/lib/queries/tables'
import type { TableStatus } from '@/lib/types'
import { revalidatePath } from 'next/cache'

export async function createBusinessAreaAction(formData: FormData) {
  const businessId = formData.get('businessId') as string
  const name = (formData.get('name') as string)?.trim()

  await requireBusinessAccess(businessId)

  if (!name) {
    throw new Error('El nombre del área es obligatorio')
  }

  const area = await createBusinessArea({ business_id: businessId, name })
  revalidatePath('/dashboard/tables')
  return area
}

export async function createTableAction(formData: FormData) {
  const businessId = formData.get('businessId') as string
  const areaId = (formData.get('areaId') as string) || null
  const tableNumber = (formData.get('tableNumber') as string)?.trim()
  const capacity = Number(formData.get('capacity') ?? 2)

  await requireBusinessAccess(businessId)

  if (!tableNumber) {
    throw new Error('El número de mesa es obligatorio')
  }

  await createTable({
    business_id: businessId,
    area_id: areaId,
    table_number: tableNumber,
    capacity,
  })

  revalidatePath('/dashboard/tables')
}

export async function updateTableAction(
  tableId: string,
  businessId: string,
  formData: FormData
) {
  await requireBusinessAccess(businessId)

  const tableNumber = (formData.get('tableNumber') as string)?.trim()
  const capacity = Number(formData.get('capacity'))
  const areaId = (formData.get('areaId') as string) || null

  if (!tableNumber) {
    throw new Error('El número de mesa es obligatorio')
  }

  await updateTable(tableId, { table_number: tableNumber, capacity, area_id: areaId })
  revalidatePath('/dashboard/tables')
}

export async function updateTableStatusAction(
  tableId: string,
  businessId: string,
  status: TableStatus
) {
  await requireBusinessAccess(businessId)
  await updateTableStatus(tableId, status)
  revalidatePath('/dashboard/tables')
}

export async function deleteTableAction(tableId: string, businessId: string) {
  await requireBusinessAccess(businessId)
  await deleteTable(tableId)
  revalidatePath('/dashboard/tables')
}