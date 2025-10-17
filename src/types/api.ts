import { z } from 'zod'

// Helpers
export function searchParamsToObject(sp: URLSearchParams) {
  const obj: Record<string, string> = {}
  for (const [k, v] of sp.entries()) obj[k] = v
  return obj
}

export function formatZodError(error: z.ZodError) {
  const flat = error.flatten()
  return {
    fieldErrors: flat.fieldErrors,
    formErrors: flat.formErrors,
  }
}

export function buildError(error: string, opts?: { code?: string; fields?: Record<string, string[]> }) {
  return {
    error,
    ...(opts?.code ? { code: opts.code } : {}),
    ...(opts?.fields ? { fields: opts.fields } : {}),
  }
}

// Schemas
export const CheckUserQuerySchema = z.object({
  nick: z.string().trim().min(1, 'nick requis').max(32, 'nick trop long'),
})

export const RegisterBodySchema = z.object({
  nick: z.string().trim().min(3, 'nick trop court').max(32, 'nick trop long'),
  password: z.string().min(6, 'mot de passe trop court').max(128, 'mot de passe trop long'),
  email: z
    .string()
    .email('email invalide')
    .max(254, 'email trop long')
    .optional()
    .transform((v) => (v && v.length ? v : undefined)),
})

const HabboProfileLite = z.object({
  lite: z
    .string()
    .optional()
    .transform((v) => (v ? ['1', 'true', 'yes', 'on'].includes(String(v).toLowerCase()) : false)),
})

export const HabboProfileQuerySchema = z
  .union([
    z.object({ name: z.string().trim().min(1, 'name requis').max(64, 'name trop long') }),
    z.object({ id: z.string().trim().min(1, 'id requis').max(128, 'id trop long') }),
  ])
  .and(HabboProfileLite)
