import { z } from 'zod'

export const kontenTypValues = ['Aktiva', 'Passiva', 'Aufwand', 'Ertrag'] as const

// Numeric value as string — preserves precision when sending to the server.
const numericString = z
  .string()
  .regex(/^-?\d+(\.\d{1,4})?$/, 'Ungültiger Zahlenwert.')

export const importKontoSchema = z.object({
  nummer: z.string().trim().min(1).max(20),
  bezeichnung: z.string().trim().min(1).max(200),
  typ: z.enum(kontenTypValues),
})

export const importSaldoSchema = z.object({
  konto_nummer: z.string().trim().min(1).max(20),
  eb_soll: numericString,
  eb_haben: numericString,
  vk_soll: numericString,
  vk_haben: numericString,
  saldo_soll: numericString,
  saldo_haben: numericString,
})

export const createImportSchema = z.object({
  jahr: z.number().int().min(2000).max(2100),
  monat: z.number().int().min(1).max(12),
  dateiname: z.string().min(1).max(255),
  konten: z.array(importKontoSchema).min(1).max(5000),
  salden: z.array(importSaldoSchema).min(1).max(5000),
  summe_soll: numericString,
  summe_haben: numericString,
})

export type ImportKonto = z.infer<typeof importKontoSchema>
export type ImportSaldo = z.infer<typeof importSaldoSchema>
export type CreateImportInput = z.infer<typeof createImportSchema>
