import { z } from 'zod'

export const rechtsformValues = [
  'GmbH',
  'AG',
  'UG',
  'GmbH_und_Co_KG',
  'Einzelunternehmen',
  'Sonstiges',
] as const

export type Rechtsform = (typeof rechtsformValues)[number]

/**
 * Form schema — all fields are strings.
 * Optional fields accept empty strings; the server treats empty as "not set"
 * and writes NULL to the database.
 */
export const mandantFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name erforderlich.')
    .max(200, 'Name darf höchstens 200 Zeichen lang sein.'),
  rechtsform: z.enum(rechtsformValues, {
    error: 'Bitte wähle eine Rechtsform.',
  }),
  basiswaehrung: z
    .string()
    .regex(/^[A-Z]{3}$/, 'ISO-Code aus 3 Großbuchstaben, z.B. EUR.'),
  geschaeftsjahr_start: z
    .string()
    .regex(
      /^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/,
      'Format MM-TT, z.B. 01-01.'
    ),
  ust_idnr: z.string().refine(
    (v) => v === '' || (v.trim().length >= 4 && v.trim().length <= 20),
    { message: 'USt-IdNr muss 4–20 Zeichen lang sein.' }
  ),
  diamant_mandantennummer: z
    .string()
    .max(50, 'Mandantennummer darf höchstens 50 Zeichen lang sein.'),
})

export const updateMandantSchema = mandantFormSchema.extend({
  id: z.uuid('Ungültige Mandant-ID.'),
})

export const deleteMandantSchema = z.object({
  id: z.uuid('Ungültige Mandant-ID.'),
  confirmName: z.string().min(1, 'Bestätigung erforderlich.'),
})

export const switchMandantSchema = z.object({
  mandantId: z.uuid('Ungültige Mandant-ID.'),
})

export type MandantFormValues = z.infer<typeof mandantFormSchema>
// Kept for callers that referenced the old name (forms use MandantFormValues).
export type MandantInput = MandantFormValues
export type UpdateMandantInput = z.infer<typeof updateMandantSchema>
export type DeleteMandantInput = z.infer<typeof deleteMandantSchema>
export type SwitchMandantInput = z.infer<typeof switchMandantSchema>
