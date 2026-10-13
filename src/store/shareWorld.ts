import type { SavedWorld } from '../simulation/types.ts'

/**
 * Compartir tu mundo (jornada 14, fase 2): el estado del motor viaja en la URL
 * (`?mundo=…`) como JSON en base64 apto para URL. Quien abre el enlace recibe
 * exactamente el mundo que se compartió (sin simular ausencia) y, a partir de
 * ahí, es el suyo: se guarda como cualquier otro. Funciones puras, con tests.
 */
export const MUNDO_PARAM = 'mundo'

function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(text: string): Uint8Array | null {
  const normalized = text.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
  try {
    const binary = atob(padded)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    return bytes
  } catch {
    return null
  }
}

/** Mundo → texto para la URL (solo caracteres seguros, sin relleno). */
export function encodeWorld(saved: SavedWorld): string {
  return toBase64Url(new TextEncoder().encode(JSON.stringify(saved)))
}

/** Texto de la URL → mundo, o null si no es un guardado válido (el motor lo valida después). */
export function decodeWorld(text: string): SavedWorld | null {
  const bytes = fromBase64Url(text.trim())
  if (!bytes) return null
  try {
    const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes))
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      (parsed as SavedWorld).version === 1 &&
      typeof (parsed as SavedWorld).guardadoEn === 'number' &&
      typeof (parsed as SavedWorld).estado === 'object'
    ) {
      return parsed as SavedWorld
    }
    return null
  } catch {
    return null
  }
}

/** `?mundo=`: el mundo compartido, o null si no viene o no vale. */
export function mundoFromSearch(search: string): SavedWorld | null {
  const value = new URLSearchParams(search).get(MUNDO_PARAM)
  return value ? decodeWorld(value) : null
}

/** URL completa para compartir el mundo tal y como está ahora. */
export function shareUrl(origin: string, pathname: string, saved: SavedWorld): string {
  return `${origin}${pathname}?${MUNDO_PARAM}=${encodeWorld(saved)}`
}
