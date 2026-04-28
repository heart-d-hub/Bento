export type ExtractedItem = {
  name: string
  qty: number
  unitCost: number
}

// ── Text paste parser (no API needed) ────────────────────────────────────────

function parseNumber(s: string): number {
  return parseFloat(s.replace(/,/g, '')) || 0
}

export function extractItemsFromText(text: string): ExtractedItem[] {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  const results: ExtractedItem[] = []

  for (const line of lines) {
    // strip currency symbols and common Thai units
    const clean = line
      .replace(/฿/g, ' ')
      .replace(/บาท/g, ' ')
      .replace(/\bx\b/gi, ' ')
      .replace(/\bX\b/g, ' ')
      .replace(/ชิ้น|กล่อง|แพ็ค|แพ็ก|ถุง|หน่วย|ขวด|อัน|ตัว/g, ' ')
      .trim()

    // find all numbers in the line
    const numMatches = [...clean.matchAll(/[\d,]+(?:\.\d+)?/g)]
    const nums = numMatches.map((m) => ({ val: parseNumber(m[0]), idx: m.index ?? 0 }))

    if (nums.length === 0) continue

    let name = ''
    let qty = 1
    let unitCost = 0

    if (nums.length === 1) {
      // single number → price, everything else is name
      unitCost = nums[0].val
      name = clean.replace(/[\d,]+(?:\.\d+)?/g, '').trim()
    } else if (nums.length >= 2) {
      // heuristic: last number is price, second-to-last is qty (if small int)
      const last = nums[nums.length - 1]
      const secondLast = nums[nums.length - 2]

      unitCost = last.val
      const maybeQty = secondLast.val
      if (Number.isInteger(maybeQty) && maybeQty <= 9999 && maybeQty < last.val) {
        qty = maybeQty
        // name = everything before the qty number
        name = clean.slice(0, secondLast.idx).replace(/[\d,]+(?:\.\d+)?/g, '').trim()
      } else {
        // treat second-to-last as price override, last as qty? or just use last as price
        qty = 1
        name = clean.slice(0, last.idx).replace(/[\d,]+(?:\.\d+)?/g, '').trim()
      }
    }

    name = name.replace(/\s+/g, ' ').replace(/[·•\-–|]+$/, '').trim()
    if (!name || unitCost <= 0) continue

    results.push({ name, qty: Math.max(1, Math.floor(qty)), unitCost })
  }

  return results
}

// ── Claude API file parser ────────────────────────────────────────────────────

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1] ?? '')
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export async function extractPriceListFromFile(
  file: File,
  apiKey: string,
): Promise<ExtractedItem[]> {
  const b64 = await fileToBase64(file)
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
  const isImage = file.type.startsWith('image/')

  if (!isPdf && !isImage) throw new Error('รองรับเฉพาะไฟล์ PDF หรือรูปภาพ (JPG, PNG, WEBP)')

  const mediaType = isPdf ? 'application/pdf' : (file.type as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif')

  const contentBlock = isPdf
    ? { type: 'document', source: { type: 'base64', media_type: mediaType, data: b64 } }
    : { type: 'image', source: { type: 'base64', media_type: mediaType, data: b64 } }

  const headers: Record<string, string> = {
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
    'content-type': 'application/json',
  }
  if (isPdf) headers['anthropic-beta'] = 'pdfs-2024-09-25'

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            contentBlock,
            {
              type: 'text',
              text: `นี่คือใบราคาสินค้าจากผู้จำหน่าย กรุณาดึงรายการสินค้าออกมาเป็น JSON array เท่านั้น
แต่ละ item ต้องมี:
- "name": ชื่อสินค้า (string)
- "qty": จำนวนที่ระบุ ถ้าไม่มีให้ใส่ 1 (number)
- "unitCost": ราคาต่อหน่วย ถ้าไม่มีให้ใส่ 0 (number)

ตอบเฉพาะ JSON array เท่านั้น ห้ามมีข้อความอื่น
ตัวอย่าง: [{"name":"ข้าวสาร 5kg","qty":10,"unitCost":150}]`,
            },
          ],
        },
      ],
    }),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`Claude API error ${response.status}: ${body.slice(0, 200)}`)
  }

  const data = (await response.json()) as { content?: Array<{ text?: string }> }
  const text = data.content?.[0]?.text ?? ''
  const match = text.match(/\[[\s\S]*\]/)
  if (!match) throw new Error('ไม่พบรายการสินค้าในไฟล์ — ลองถ่ายรูปให้ชัดขึ้นหรือเลือกไฟล์อื่น')

  const items = JSON.parse(match[0]) as unknown[]
  return items
    .filter((x): x is Record<string, unknown> => typeof x === 'object' && x !== null)
    .map((x) => ({
      name: String(x.name ?? '').trim(),
      qty: Math.max(1, Math.floor(Number(x.qty) || 1)),
      unitCost: Math.max(0, Number(x.unitCost) || 0),
    }))
    .filter((x) => x.name.length > 0)
}
