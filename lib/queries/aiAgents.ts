import { createAdminClient } from '@/lib/supabase/admin'

export async function getAiAgentConfig(
  businessId: string
): Promise<{ instructions: string | null } | null> {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('ai_agents')
    .select('instructions')
    .eq('business_id', businessId)
    .eq('is_active', true)
    .maybeSingle()

  return data
}