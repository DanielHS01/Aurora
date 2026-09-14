import crypto from 'crypto'

function getBaseUrl(): string {
  return process.env.WOMPI_SANDBOX === 'true'
    ? 'https://sandbox.wompi.co/v1'
    : 'https://production.wompi.co/v1'
}

function getPrivateKey(): string {
  const key = process.env.WOMPI_PRIVATE_KEY
  if (!key) throw new Error('Falta WOMPI_PRIVATE_KEY en las variables de entorno')
  return key
}

/**
 * Genera un link de pago de un solo uso — flujo MANUAL: el dueño hace
 * clic en "Pagar ahora", se le manda a este link, paga, y el webhook
 * confirma.
 */
export async function createSubscriptionPaymentLink(params: {
  amountInCents: number
  reference: string // subscriptionPaymentId, para conciliar en el webhook
  redirectUrl: string
}): Promise<{ paymentLinkUrl: string; wompiId: string }> {
  const res = await fetch(`${getBaseUrl()}/payment_links`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getPrivateKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: `Membresía Aurora — ${params.reference}`,
      description: 'Pago de membresía Aurora',
      amount_in_cents: params.amountInCents,
      currency: 'COP',
      single_use: true,
      collect_shipping: false,
      redirect_url: params.redirectUrl,
    }),
  })

  if (!res.ok) {
    throw new Error(`Error creando link de pago: ${await res.text()}`)
  }

  const data = await res.json()
  return {
    paymentLinkUrl: `https://checkout.wompi.co/l/${data.data.id}`,
    wompiId: data.data.id,
  }
}

/**
 * Cobra usando una tarjeta previamente tokenizada — flujo AUTOMÁTICO,
 * llamado desde el cron de renovación, sin intervención del dueño.
 */
export async function chargeWithSavedToken(params: {
  amountInCents: number
  reference: string
  cardToken: string
  customerEmail: string
}): Promise<{ wompiId: string; status: string }> {
  const res = await fetch(`${getBaseUrl()}/transactions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getPrivateKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount_in_cents: params.amountInCents,
      currency: 'COP',
      customer_email: params.customerEmail,
      reference: params.reference,
      payment_method: {
        type: 'CARD',
        installments: 1,
        token: params.cardToken,
      },
    }),
  })

  if (!res.ok) {
    throw new Error(`Error cobrando con tarjeta guardada: ${await res.text()}`)
  }

  const data = await res.json()
  return { wompiId: data.data.id, status: data.data.status }
}

/**
 * Valida que un webhook realmente venga de Wompi (firma HMAC), no un
 * tercero simulando una confirmación de pago falsa.
 */
export function verifyWompiSignature(
  properties: string[],
  values: Record<string, unknown>,
  timestamp: number,
  receivedChecksum: string
): boolean {
  const eventsKey = process.env.WOMPI_EVENTS_KEY
  if (!eventsKey) return false

  const concatenatedValues = properties
    .map((prop) => {
      const keys = prop.split('.')
      let value: unknown = values
      for (const k of keys) {
        value = (value as Record<string, unknown>)?.[k]
      }
      return value
    })
    .join('')

  const toHash = concatenatedValues + timestamp + eventsKey
  const calculated = crypto.createHash('sha256').update(toHash).digest('hex').toUpperCase()
  return calculated === receivedChecksum.toUpperCase()
}