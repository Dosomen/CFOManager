export type FieldErrors = Record<string, string>

export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string; fieldErrors?: FieldErrors }

export function formDataToObject(formData: FormData): Record<string, string> {
  const obj: Record<string, string> = {}
  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string') obj[key] = value
  }
  return obj
}

import type { ZodError } from 'zod'

export function fieldErrorsFromZod(error: ZodError): FieldErrors {
  return Object.fromEntries(
    error.issues.map((issue) => [issue.path.join('.'), issue.message])
  )
}
