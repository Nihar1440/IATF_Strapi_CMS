import { z } from 'zod'

/* ------------------------------------------------------------------ */
/*  OEM Selection (Step 1)                                            */
/* ------------------------------------------------------------------ */

export const oemSelectionSchema = z.object({
  selectedOems: z
    .array(z.string().min(1))
    .min(1, 'Please select at least one OEM'),
  language: z.enum(['de', 'en']),
})

/* ------------------------------------------------------------------ */
/*  Process Map (Step 2)                                              */
/* ------------------------------------------------------------------ */

export const processEntrySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Process name is required'),
  owner: z.string().optional(),
})

export const processMapSchema = z.object({
  processes: z.array(processEntrySchema).min(1, 'Add at least one process'),
})

/* ------------------------------------------------------------------ */
/*  Generate Matrix Request                                           */
/* ------------------------------------------------------------------ */

export const generateMatrixSchema = z.object({
  oems: z.array(z.string().min(1)).min(1),
  processes: z.array(processEntrySchema).min(1),
  companyName: z.string().optional(),
  companyLocation: z.string().optional(),
  language: z.enum(['de', 'en']),
})

/* ------------------------------------------------------------------ */
/*  Redeem code (shared with 8D – same schema)                       */
/* ------------------------------------------------------------------ */

export const csrRedeemSchema = z.object({
  code: z
    .string()
    .min(1, 'Code is required')
    .max(64, 'Code too long')
    .trim(),
})
