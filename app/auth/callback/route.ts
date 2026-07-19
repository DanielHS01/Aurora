import { createClient } from '@/lib/supabase/server'
import { createBusinessWithOwner } from '@/lib/queries/businesses'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/test-business'

  if (code) {
    const supabase = await createClient()
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      const meta = data.user.user_metadata ?? {}
      const pendingName = meta.pending_business_name as string | undefined
      const pendingSlug = meta.pending_business_slug as string | undefined
      const pendingBusinessType = meta.pending_business_type as
        | string
        | undefined

      // Solo crea el negocio si hay metadata pendiente. Esto evita
      // duplicados si el usuario abre el link de confirmación dos veces
      // (la segunda vez ya no habrá pending_business_name porque lo
      // limpiamos abajo).
      if (pendingName && pendingSlug) {
        try {
          await createBusinessWithOwner({
            name: pendingName,
            slug: pendingSlug,
            business_type: pendingBusinessType,
          })

          await supabase.auth.updateUser({
            data: {
              pending_business_name: null,
              pending_business_slug: null,
              pending_business_type: null,
            },
          })
        } catch (err) {
          console.error('Error creando negocio tras confirmación:', err)
          return NextResponse.redirect(
            `${origin}/login?error=business_creation_failed`
          )
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}