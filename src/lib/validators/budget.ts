import { z } from 'zod'

export const budgetEntrySchema = z.object({
  konto_id: z.uuid('Ungültige Konto-ID'),
  betrag: z.number().finite('Ungültiger Betrag'),
})

export const saveBudgetsSchema = z.object({
  jahr: z.number().int().min(2000).max(2100),
  entries: z.array(budgetEntrySchema).max(2000),
})

export type SaveBudgetsInput = z.infer<typeof saveBudgetsSchema>
