import * as XLSX from 'xlsx'
import { deriveTyp, type KontenTyp } from './skr'

export interface ParsedKonto {
  nummer: string
  bezeichnung: string
  typ: KontenTyp
}

export interface ParsedSaldo {
  konto_nummer: string
  eb_soll: string
  eb_haben: string
  vk_soll: string
  vk_haben: string
  saldo_soll: string
  saldo_haben: string
}

export interface DiamantImportData {
  mandantHint: string | null
  mandantnrHint: string | null
  kontenrahmen: string | null
  periode: { jahr: number; monat: number } | null
  sheetCount: number
  konten: ParsedKonto[]
  salden: ParsedSaldo[]
  summen: { soll: string; haben: string }
  errors: string[]
  warnings: string[]
}

const COLUMN_PATTERNS: Record<string, RegExp> = {
  nummer: /^(konto|kontonummer|konto-?nr\.?|kto)$/i,
  bezeichnung: /^(bezeichnung|kontoname|name|konto[\s-]?bezeichnung)$/i,
  eb_soll: /^(eb\s*soll|er[oö]ffnungsbilanz\s*soll|er[oö]ffnung\s*soll)$/i,
  eb_haben: /^(eb\s*haben|er[oö]ffnungsbilanz\s*haben|er[oö]ffnung\s*haben)$/i,
  vk_soll: /^(verkehrszahlen\s*soll|vz\s*soll|verkehr\s*soll)$/i,
  vk_haben: /^(verkehrszahlen\s*haben|vz\s*haben|verkehr\s*haben)$/i,
  saldo_soll: /^(saldo\s*soll|endsaldo\s*soll)$/i,
  saldo_haben: /^(saldo\s*haben|endsaldo\s*haben)$/i,
}

type ColumnKey = keyof typeof COLUMN_PATTERNS

export async function parseDiamantFile(file: File): Promise<DiamantImportData> {
  const arrayBuffer = await file.arrayBuffer()
  return parseDiamantBuffer(arrayBuffer)
}

/**
 * Testable core: parses an already-loaded buffer. Used by `parseDiamantFile`
 * in the browser and directly by unit tests in Node.
 */
export function parseDiamantBuffer(
  buffer: ArrayBuffer | Uint8Array
): DiamantImportData {
  const result: DiamantImportData = {
    mandantHint: null,
    mandantnrHint: null,
    kontenrahmen: null,
    periode: null,
    sheetCount: 0,
    konten: [],
    salden: [],
    summen: { soll: '0.00', haben: '0.00' },
    errors: [],
    warnings: [],
  }

  let wb: XLSX.WorkBook
  try {
    wb = XLSX.read(buffer, { type: 'array', raw: false, cellDates: false })
  } catch {
    result.errors.push(
      'Datei konnte nicht gelesen werden. Ist die Datei beschädigt oder passwortgeschützt?'
    )
    return result
  }

  result.sheetCount = wb.SheetNames.length
  const sheetName = wb.SheetNames[0]
  if (!sheetName) {
    result.errors.push('Datei enthält kein Tabellenblatt.')
    return result
  }
  if (wb.SheetNames.length > 1) {
    result.warnings.push(
      `Datei enthält ${wb.SheetNames.length} Tabellenblätter — nur das erste Blatt "${sheetName}" wird verarbeitet.`
    )
  }

  const sheet = wb.Sheets[sheetName]
  // raw: true → numbers come through as numbers (not locale-formatted strings).
  // Avoids ambiguity between "1,234.56" (en-US) and "1.234,56" (de-DE).
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    raw: true,
    defval: null,
  })

  const headerRowIndex = findHeaderRow(rows)
  if (headerRowIndex < 0) {
    result.errors.push(
      'Spalten-Header nicht erkannt. Eine Zeile muss "Konto" und "Bezeichnung" enthalten.'
    )
    return result
  }

  for (let i = 0; i < headerRowIndex; i++) {
    const row = rows[i]
    if (!row || row.length < 2) continue
    const key = String(row[0] ?? '')
      .trim()
      .replace(/[:：]\s*$/, '')
      .toLowerCase()
    const val = String(row[1] ?? '').trim()
    if (!key || !val) continue
    if (key === 'mandant') result.mandantHint = val
    else if (key.includes('mandantennummer') || key.includes('mandant-nr'))
      result.mandantnrHint = val
    else if (key === 'kontenrahmen') result.kontenrahmen = val
    else if (key === 'buchungsperiode' || key === 'zeitraum') {
      const periode = parsePeriode(val)
      if (periode && !result.periode) result.periode = periode
    }
  }

  const columnIdx: Partial<Record<ColumnKey, number>> = {}
  const headerRow = rows[headerRowIndex] ?? []
  for (let i = 0; i < headerRow.length; i++) {
    const cell = String(headerRow[i] ?? '').trim()
    if (!cell) continue
    for (const key of Object.keys(COLUMN_PATTERNS) as ColumnKey[]) {
      if (COLUMN_PATTERNS[key].test(cell)) columnIdx[key] = i
    }
  }

  const requiredColumns: ColumnKey[] = ['nummer', 'bezeichnung']
  const missing = requiredColumns.filter((k) => columnIdx[k] === undefined)
  if (missing.length > 0) {
    result.errors.push(
      `Fehlende Pflicht-Spalten: ${missing.join(', ')}. Erkannt: ${headerRow
        .filter((c) => c != null && String(c).trim() !== '')
        .map(String)
        .join(', ')}`
    )
    return result
  }

  let sumSoll = 0
  let sumHaben = 0

  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const row = rows[i]
    if (!row || row.every((c) => c == null || String(c).trim() === '')) continue

    const nummerRaw = String(row[columnIdx.nummer!] ?? '').trim()
    const bezeichnung = String(row[columnIdx.bezeichnung!] ?? '').trim()

    if (
      nummerRaw.toLowerCase() === 'summen' ||
      bezeichnung.toLowerCase() === 'summen' ||
      nummerRaw.toLowerCase().startsWith('summe')
    ) {
      break
    }

    if (!nummerRaw || !bezeichnung) continue
    if (!/^\d+$/.test(nummerRaw)) continue

    const ebS = parseCell(row[columnIdx.eb_soll ?? -1])
    const ebH = parseCell(row[columnIdx.eb_haben ?? -1])
    const vkS = parseCell(row[columnIdx.vk_soll ?? -1])
    const vkH = parseCell(row[columnIdx.vk_haben ?? -1])
    const saS = parseCell(row[columnIdx.saldo_soll ?? -1])
    const saH = parseCell(row[columnIdx.saldo_haben ?? -1])

    result.konten.push({
      nummer: nummerRaw,
      bezeichnung,
      typ: deriveTyp(nummerRaw, result.kontenrahmen),
    })

    result.salden.push({
      konto_nummer: nummerRaw,
      eb_soll: ebS,
      eb_haben: ebH,
      vk_soll: vkS,
      vk_haben: vkH,
      saldo_soll: saS,
      saldo_haben: saH,
    })

    sumSoll += Number(saS)
    sumHaben += Number(saH)
  }

  if (result.konten.length === 0) {
    result.errors.push('Keine Konten-Zeilen erkannt.')
  }

  result.summen = {
    soll: sumSoll.toFixed(2),
    haben: sumHaben.toFixed(2),
  }

  return result
}

function findHeaderRow(rows: unknown[][]): number {
  for (let i = 0; i < Math.min(rows.length, 30); i++) {
    const row = rows[i]
    if (!row) continue
    let hasKonto = false
    let hasBezeichnung = false
    for (const cell of row) {
      const v = String(cell ?? '').trim()
      if (!v) continue
      if (COLUMN_PATTERNS.nummer.test(v)) hasKonto = true
      if (COLUMN_PATTERNS.bezeichnung.test(v)) hasBezeichnung = true
    }
    if (hasKonto && hasBezeichnung) return i
  }
  return -1
}

function parseCell(v: unknown): string {
  if (v == null || v === '') return '0.00'
  if (typeof v === 'number') return v.toFixed(2)
  let s = String(v).trim()
  if (!s) return '0.00'
  // Strip thousand separators and currency symbols, accept German format
  s = s.replace(/€|\s| /g, '')
  // German format: "1.234,56" — strip dots, replace comma with dot
  if (s.includes(',')) {
    s = s.replace(/\./g, '').replace(',', '.')
  }
  const n = Number(s)
  if (Number.isNaN(n)) return '0.00'
  return n.toFixed(2)
}

function parsePeriode(s: string): { jahr: number; monat: number } | null {
  // "03/2026"
  let m = s.match(/^(\d{1,2})\s*\/\s*(\d{4})/)
  if (m) return { monat: parseInt(m[1], 10), jahr: parseInt(m[2], 10) }
  // "01.03.2026 - 31.03.2026"
  m = s.match(/\d{1,2}\.(\d{1,2})\.(\d{4})/)
  if (m) return { monat: parseInt(m[1], 10), jahr: parseInt(m[2], 10) }
  return null
}
