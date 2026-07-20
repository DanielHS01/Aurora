'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { translateAuthError } from '@/lib/utils/auth-errors'
import { generateBusinessSlug } from '@/lib/utils/slugify'
import { createBusinessWithOwner } from '@/lib/queries/businesses'
import { completeInvitedBusinessUser } from '@/lib/queries/business-users'
import type { BusinessRole } from '@/lib/types'

const ALLOWED_BUSINESS_TYPES = ['restaurant', 'barbershop', 'optical'] as const
type BusinessType = (typeof ALLOWED_BUSINESS_TYPES)[number]

export async function signUpAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = (formData.get('fullName') as string)?.trim()
  const phone = (formData.get('phone') as string)?.trim() || undefined
  const businessName = (formData.get('businessName') as string)?.trim()
  const businessType = formData.get('businessType') as string

  // Validaciones server-side — la fuente de verdad real, el cliente
  // solo da feedback rápido antes de llegar aquí.
  if (!fullName) {
    throw new Error('El nombre completo es obligatorio')
  }
  if (!businessName) {
    throw new Error('El nombre del negocio es obligatorio')
  }
  if (!ALLOWED_BUSINESS_TYPES.includes(businessType as BusinessType)) {
    throw new Error('Selecciona un tipo de negocio válido')
  }

  const businessSlug = generateBusinessSlug(businessName)

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone,
        // Metadata "pending": se lee una sola vez cuando el usuario
        // confirma su correo (en /auth/confirm, vía
        // completeBusinessSetupAction), y se limpia ahí mismo tras
        // crear el negocio.
        pending_business_name: businessName,
        pending_business_slug: businessSlug,
        pending_business_type: businessType,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })

  if (error) {
    console.error('SUPABASE SIGNUP ERROR:', error)
    throw new Error(translateAuthError(error.message))
  }

  // Supabase no lanza error si el email ya existe (para evitar
  // enumeración de usuarios): responde "éxito" pero con identities
  // vacío. Hay que detectarlo manualmente.
  if (data.user && data.user.identities && data.user.identities.length === 0) {
    throw new Error(
      'Ya existe una cuenta con ese correo. Si no la confirmaste, revisa tu bandeja de spam o intenta recuperar tu contraseña.'
    )
  }
}

/**
 * Se llama desde /auth/confirm justo después de verifyOtp exitoso,
 * cuando ya hay sesión real. Lee la metadata pendiente del negocio
 * (guardada en signUpAction) y crea businesses + business_users.
 * Si no hay metadata pendiente (ej. ya se ejecutó antes), no hace nada.
 */
export async function completeBusinessSetupAction(): Promise<void> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  const meta = user.user_metadata ?? {}
  const pendingName = meta.pending_business_name as string | undefined
  const pendingSlug = meta.pending_business_slug as string | undefined
  const pendingBusinessType = meta.pending_business_type as string | undefined

  if (!pendingName || !pendingSlug) {
    return
  }

  await createBusinessWithOwner({
    name: pendingName,
    slug: pendingSlug,
    business_type: pendingBusinessType as BusinessType,
  })

  await supabase.auth.updateUser({
    data: {
      pending_business_name: null,
      pending_business_slug: null,
      pending_business_type: null,
    },
  })
}
export async function completeEmployeeInviteAction(password: string): Promise<void> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  // Los usuarios invitados no tienen contraseña todavía — la establecen
  // en este mismo paso, antes de quedar vinculados al negocio.
  const { error: passwordError } = await supabase.auth.updateUser({ password })
  if (passwordError) {
    throw new Error(translateAuthError(passwordError.message))
  }

  const meta = user.user_metadata ?? {}
  const pendingBusinessId = meta.pending_business_id as string | undefined
  const pendingRole = meta.pending_business_role as string | undefined

  if (!pendingBusinessId || !pendingRole) {
    return
  }

  await completeInvitedBusinessUser(
    pendingBusinessId,
    user.id,
    pendingRole as BusinessRole
  )

  await supabase.auth.updateUser({
    data: { pending_business_id: null, pending_business_role: null },
  })
}
export async function signInAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    throw new Error(translateAuthError(error.message))
  }

  redirect('/dashboard')
}

export async function signOutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function requestPasswordResetAction(formData: FormData) {
  const email = formData.get('email') as string

  const supabase = await createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/update-password`,
  })

  if (error) {
    throw new Error(translateAuthError(error.message))
  }
}

export async function updatePasswordAction(formData: FormData) {
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (password !== confirmPassword) {
    throw new Error('Las contraseñas no coinciden')
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    throw new Error(translateAuthError(error.message))
  }

  redirect('/dashboard')
}