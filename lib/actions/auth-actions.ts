'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { translateAuthError } from '@/lib/utils/auth-errors'
import { generateBusinessSlug } from '@/lib/utils/slugify'
import { createBusinessWithOwner } from '@/lib/queries/businesses'
import { completeInvitedBusinessUser } from '@/lib/queries/business-users'
import { UserFacingError } from '@/lib/errors'
import { runAction, type ActionResult } from '@/lib/utils/actionResult'
import type { BusinessRole } from '@/lib/types'

// "barber shop" con espacio: es el valor que usan la base de datos y el formulario
const ALLOWED_BUSINESS_TYPES = ['restaurant', 'barber shop', 'optical'] as const
type BusinessType = (typeof ALLOWED_BUSINESS_TYPES)[number]

const MIN_PASSWORD_LENGTH = 8

async function checkMaintenanceBlock(): Promise<void> {
  const supabase = await createClient()
  const { data: isActive } = await supabase.rpc('is_maintenance_active')

  if (isActive) {
    throw new UserFacingError(
      'El sistema está en mantenimiento en este momento. Por favor intenta más tarde.'
    )
  }
}

export async function signUpAction(formData: FormData): Promise<ActionResult> {
  return runAction(async () => {
    await checkMaintenanceBlock()

    const email = (formData.get('email') as string)?.trim()
    const password = formData.get('password') as string
    const fullName = (formData.get('fullName') as string)?.trim()
    const phone = (formData.get('phone') as string)?.trim() || undefined
    const businessName = (formData.get('businessName') as string)?.trim()
    const businessType = formData.get('businessType') as string

    // Validaciones server-side: la fuente de verdad real
    if (!fullName) throw new UserFacingError('El nombre completo es obligatorio')
    if (!email) throw new UserFacingError('El correo es obligatorio')
    if (!password || password.length < MIN_PASSWORD_LENGTH) {
      throw new UserFacingError('La contraseña debe tener al menos 8 caracteres.')
    }
    if (!businessName) throw new UserFacingError('El nombre del negocio es obligatorio')
    if (!ALLOWED_BUSINESS_TYPES.includes(businessType as BusinessType)) {
      throw new UserFacingError('Selecciona un tipo de negocio válido')
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
          // Metadata "pending": se lee una sola vez al confirmar el correo
          // (completeBusinessSetupAction) y se limpia ahí mismo.
          pending_business_name: businessName,
          pending_business_slug: businessSlug,
          pending_business_type: businessType,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    })

    if (error) {
      console.error('SUPABASE SIGNUP ERROR:', error)
      throw new UserFacingError(translateAuthError(error.message))
    }

    // Supabase no lanza error si el correo ya existe (evita enumeración):
    // responde "éxito" con identities vacío. Hay que detectarlo a mano.
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      throw new UserFacingError(
        'Ya existe una cuenta con ese correo. Si no la confirmaste, revisa tu bandeja de spam o intenta recuperar tu contraseña.'
      )
    }
  })
}

/**
 * Se llama desde /auth/confirm justo después de verifyOtp. Sigue lanzando
 * errores a propósito: su único llamador solo los registra, y si falla
 * el usuario termina en /setup-business, donde puede reintentar.
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

/** Sin redirect(): el formulario navega al dashboard cuando recibe ok. */
export async function retryBusinessSetupAction(formData: FormData): Promise<ActionResult> {
  return runAction(async () => {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) throw new UserFacingError('Tu sesión expiró. Inicia sesión de nuevo.')

    const name = (formData.get('businessName') as string)?.trim()
    const businessType = formData.get('businessType') as string

    if (!name) throw new UserFacingError('El nombre del negocio es obligatorio')
    if (!ALLOWED_BUSINESS_TYPES.includes(businessType as BusinessType)) {
      throw new UserFacingError('Selecciona un tipo de negocio válido')
    }

    await createBusinessWithOwner({
      name,
      slug: generateBusinessSlug(name),
      business_type: businessType as BusinessType,
    })

    await supabase.auth.updateUser({
      data: {
        pending_business_name: null,
        pending_business_slug: null,
        pending_business_type: null,
      },
    })
  })
}

export async function completeEmployeeInviteAction(password: string): Promise<ActionResult> {
  return runAction(async () => {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) throw new UserFacingError('Tu sesión expiró. Abre de nuevo el enlace de tu invitación.')

    if (!password || password.length < MIN_PASSWORD_LENGTH) {
      throw new UserFacingError('La contraseña debe tener al menos 8 caracteres.')
    }

    // Los invitados todavía no tienen contraseña: la crean en este paso
    const { error: passwordError } = await supabase.auth.updateUser({ password })
    if (passwordError) {
      throw new UserFacingError(translateAuthError(passwordError.message))
    }

    const meta = user.user_metadata ?? {}
    const pendingBusinessId = meta.pending_business_id as string | undefined
    const pendingRole = meta.pending_business_role as string | undefined

    if (!pendingBusinessId || !pendingRole) return

    await completeInvitedBusinessUser(pendingBusinessId, user.id, pendingRole as BusinessRole)

    await supabase.auth.updateUser({
      data: { pending_business_id: null, pending_business_role: null },
    })
  })
}

export async function signInAction(formData: FormData): Promise<ActionResult> {
  return runAction(async () => {
    const email = (formData.get('email') as string)?.trim()
    const password = formData.get('password') as string

    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      throw new UserFacingError(translateAuthError(error.message))
    }

    const { data: maintenanceActive } = await supabase.rpc('is_maintenance_active')
    if (maintenanceActive) {
      const { data: isPlatformAdmin } = await supabase.rpc('is_current_user_platform_admin')
      if (!isPlatformAdmin) {
        await supabase.auth.signOut()
        throw new UserFacingError(
          'El sistema está en mantenimiento en este momento. Por favor intenta más tarde.'
        )
      }
    }

    // Sin redirect(): LoginForm navega cuando recibe ok
  })
}

export async function signOutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function requestPasswordResetAction(formData: FormData): Promise<ActionResult> {
  return runAction(async () => {
    const email = (formData.get('email') as string)?.trim()
    if (!email) throw new UserFacingError('Ingresa tu correo')

    const supabase = await createClient()

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/update-password`,
    })

    if (error) {
      throw new UserFacingError(translateAuthError(error.message))
    }
  })
}

/** Sin redirect(): el formulario muestra "Contraseña actualizada" y navega. */
export async function updatePasswordAction(formData: FormData): Promise<ActionResult> {
  return runAction(async () => {
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (!password || password.length < MIN_PASSWORD_LENGTH) {
      throw new UserFacingError('La contraseña debe tener al menos 8 caracteres.')
    }
    if (password !== confirmPassword) {
      throw new UserFacingError('Las contraseñas no coinciden')
    }

    const supabase = await createClient()

    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      throw new UserFacingError(translateAuthError(error.message))
    }
  })
}