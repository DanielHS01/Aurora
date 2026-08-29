const SANDBOX_BASE_URL = 'https://waba-sandbox.360dialog.io'
const PRODUCTION_BASE_URL = 'https://waba.360dialog.io'

export async function sendWhatsappMessage(
  apiKey: string,
  isSandbox: boolean,
  to: string,
  text: string
): Promise<void> {
  const baseUrl = isSandbox ? SANDBOX_BASE_URL : PRODUCTION_BASE_URL

  const res = await fetch(`${baseUrl}/v1/messages`, {
    method: 'POST',
    headers: {
      'D360-API-KEY': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text },
    }),
  })

  if (!res.ok) {
    const errorBody = await res.text()
    throw new Error(`Error enviando mensaje de WhatsApp: ${errorBody}`)
  }
}