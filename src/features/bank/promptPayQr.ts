import QRCode from 'qrcode'

function field(tag: string, value: string): string {
  return `${tag}${String(value.length).padStart(2, '0')}${value}`
}

function crc16(data: string): string {
  let crc = 0xffff
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

/** Normalize PromptPay ID to the format required by the spec.
 *  Phone (10 digits starting with 0): 0XXXXXXXXX → 0066XXXXXXXXX
 *  Tax ID / citizen ID (13 digits): used as-is
 */
function normalizeId(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, '')
  if (digits.length === 10 && digits.startsWith('0')) {
    return '0066' + digits.slice(1)  // mobile
  }
  return digits  // 13-digit national/tax ID
}

/** Build the EMVCo PromptPay QR payload string. */
export function buildPromptPayPayload(promptPayId: string, amountBaht?: number): string {
  const id = normalizeId(promptPayId)
  const merchantInfo = field('00', 'A000000677010111') + field('01', id)

  const parts = [
    field('00', '01'),          // format indicator
    field('01', '12'),          // dynamic (one-time)
    field('29', merchantInfo),  // PromptPay merchant account info
    field('53', '764'),         // currency THB
  ]

  if (amountBaht != null && amountBaht > 0) {
    parts.push(field('54', amountBaht.toFixed(2)))
  }

  parts.push(field('58', 'TH'))  // country
  parts.push('6304')             // CRC tag — value appended below

  const payload = parts.join('')
  return payload + crc16(payload)
}

/** Generate a PromptPay QR code as a PNG data URL. */
export async function promptPayDataUrl(
  promptPayId: string,
  amountBaht?: number,
): Promise<string> {
  const payload = buildPromptPayPayload(promptPayId, amountBaht)
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 300,
    color: { dark: '#000000', light: '#ffffff' },
  })
}
