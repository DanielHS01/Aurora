import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'

function getKey(): Buffer {
  const key = process.env.AI_CREDENTIALS_ENCRYPTION_KEY
  if (!key) {
    throw new Error('Falta AI_CREDENTIALS_ENCRYPTION_KEY en las variables de entorno')
  }
  return Buffer.from(key, 'base64')
}

/**
 * Cifra un objeto de credenciales (API keys, tokens) antes de guardarlo
 * en la base de datos. La llave vive solo en variables de entorno,
 * nunca en Postgres — así que un dump de la DB por sí solo no expone
 * ninguna credencial real.
 */
export function encryptCredentials(data: Record<string, string>): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv)

  const plaintext = JSON.stringify(data)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()

  // Empaquetamos iv + authTag + datos cifrados en un solo string base64
  return Buffer.concat([iv, authTag, encrypted]).toString('base64')
}

export function decryptCredentials(encryptedValue: string): Record<string, string> {
  const raw = Buffer.from(encryptedValue, 'base64')

  const iv = raw.subarray(0, 12)
  const authTag = raw.subarray(12, 28)
  const encrypted = raw.subarray(28)

  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv)
  decipher.setAuthTag(authTag)

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
  return JSON.parse(decrypted.toString('utf8'))
}