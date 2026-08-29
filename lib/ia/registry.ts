import type { AiTool } from './core/types'
import { checkBusinessHoursTool } from './tools/checkBusinessHours'
import { buildCreateReservationTool } from './tools/createReservationTool'
import { buildCreateOrderTool } from './tools/createOrderTool'

export async function getToolsForBusiness(
  businessId: string,
  businessType: string | null
): Promise<AiTool[]> {
  const tools: AiTool[] = [checkBusinessHoursTool]

  if (businessType === 'restaurant') {
    // Ambas herramientas son independientes entre sí — antes se
    // construían una detrás de otra, cada una con su propia consulta.
    const [reservationTool, orderTool] = await Promise.all([
      buildCreateReservationTool(businessId),
      buildCreateOrderTool(businessId),
    ])
    tools.push(reservationTool, orderTool)
  }

  return tools
}