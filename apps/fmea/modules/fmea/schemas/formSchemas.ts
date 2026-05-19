/**
 * Validation Schemas for FMEA Module
 */

import { z } from "zod";

/* ── File Upload ────────────────────────────────────────────────── */

export const fileUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size > 0, "File cannot be empty")
    .refine((file) => file.name.endsWith(".xlsx"), "File must be .xlsx format")
    .refine(
      (file) => file.size < 50 * 1024 * 1024,
      "File size must be less than 50MB",
    ),
});

/* ── FMEA Row ────────────────────────────────────────────────────── */

export const fmeaRowSchema = z.object({
  id: z.string(),
  process_step: z.string().max(500),
  function: z.string().max(500),
  failure_mode: z.string().min(1, "Failure mode is required").max(500),
  failure_effect: z.string().max(1000),
  severity: z.number().int().min(1).max(10),
  failure_cause: z.string().min(1, "Failure cause is required").max(500),
  occurrence: z.number().int().min(1).max(10),
  prevention_control: z.string().max(500),
  detection_control: z.string().max(500),
  detection: z.number().int().min(1).max(10),
  ap_current: z.enum(["H", "M", "L"]),
  action_recommended: z.string().max(500),
  responsible: z.string().max(255),
  target_date: z.string().max(50),
  classification: z.string().optional(),
  special_characteristic: z.string().optional(),
  source_reference: z.object({
    sheet: z.string(),
    row: z.number(),
  }),
});

export type FmeaRowType = z.infer<typeof fmeaRowSchema>;

/* ── Validation Result ──────────────────────────────────────────── */

export const fmeaValidationResponseSchema = z.object({
  success: z.boolean(),
  validationResult: z
    .object({
      rows_total: z.number(),
      rows_valid: z.number(),
      rows_with_issues: z.number(),
      completeness_score: z.number(),
      ap_compliance_score: z.number(),
      issues: z.array(
        z.object({
          row_id: z.string(),
          ruleId: z.string(),
          severity: z.enum(["Critical", "High", "Medium"]),
          message: z.string(),
          field: z.string(),
          suggested_value: z.string().optional(),
          confidence: z.enum(["High", "Medium", "Low"]),
        }),
      ),
      issue_summaries: z.array(
        z.object({
          ruleId: z.string(),
          severity: z.enum(["Critical", "High", "Medium"]),
          field: z.string(),
          summary: z.string(),
          count: z.number(),
          row_ids: z.array(z.string()),
          source_rows: z.array(z.number()),
        }),
      ).optional(),
      ai_findings: z.array(
        z.object({
          row_id: z.string(),
          ruleId: z.string(),
          title: z.string(),
          explanation: z.string(),
          recommended_action: z.string(),
          confidence: z.enum(["High", "Medium", "Low"]),
        }),
      ).optional(),
      ap_mismatches: z.array(
        z.object({
          row_id: z.string(),
          current_ap: z.enum(["H", "M", "L"]),
          expected_ap: z.enum(["H", "M", "L"]),
        }),
      ),
      statistics: z.object({
        issues_by_severity: z.record(z.string(), z.number()),
        issues_by_rule: z.record(z.string(), z.number()),
        mandatory_fields_filled: z.number().optional(),
        mandatory_fields_expected: z.number().optional(),
        rows_with_correct_ap: z.number().optional(),
        rows_with_ap_context: z.number().optional(),
        rows_with_incorrect_ap: z.number().optional(),
        rows_with_ap_not_evaluatable: z.number().optional(),
      }),
    })
    .optional(),
  rows: z.array(fmeaRowSchema).optional(),
  error: z.string().optional(),
  headerMap: z.record(z.string(), z.string()).optional(),
  headerConfidence: z.enum(["High", "Medium", "Low"]).optional(),
  parserWarnings: z.array(z.string()).optional(),
});

/* ── Redeem code ────────────────────────────────────────────────── */

export const fmeaRedeemSchema = z.object({
  code: z
    .string()
    .min(1, 'Code is required')
    .max(64, 'Code too long')
    .trim(),
});

/* ── FMEA Validate API Request ──────────────────────────────────── */

export const fmeaValidateRequestSchema = z.object({
  file: z
    .string()
    .min(1, 'File is required')
    .describe('Base64-encoded .xlsx file'),
  sheet_index: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe('Sheet index to parse (0-based, default 0)'),
  header_row: z
    .number()
    .int()
    .min(1)
    .optional()
    .describe('Explicit header row number (1-based)'),
  language: z
    .enum(['de', 'en'])
    .default('en')
    .describe('Language for AI findings generation'),
});

export type FmeaValidateRequest = z.infer<typeof fmeaValidateRequestSchema>;

/* ── FMEA Redeem Request ─────────────────────────────────────────── */

export const fmeaRedeemRequestSchema = z.object({
  code: z
    .string()
    .min(1, 'Code is required')
    .max(64, 'Code too long')
    .trim(),
  toolId: z
    .string()
    .optional()
    .describe('Tool ID (defaults to tool_fmea)'),
});

export type FmeaRedeemRequest = z.infer<typeof fmeaRedeemRequestSchema>;

