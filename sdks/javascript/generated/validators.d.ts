// AUTO-GENERATED FILE. DO NOT EDIT.
import type { ErrorObject } from 'ajv';
export interface ValidationResult { valid: boolean; errors: null | ErrorObject[]; }
export function validate(name: string, data: unknown): ValidationResult;
export function validateMessageEnvelope(data: unknown): ValidationResult;\nexport function validateResponseEnvelope(data: unknown): ValidationResult;\nexport function validatePayload(data: unknown): ValidationResult;\nexport function validateSuperpowerResponse(data: unknown): ValidationResult;\nexport function validateErrorResponse(data: unknown): ValidationResult;
export const availableValidators: string[];
