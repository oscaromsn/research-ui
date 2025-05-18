import { z } from "zod";

/**
 * Core schema primitives
 * 
 * This module provides reusable schema components that can be composed
 * for validation throughout your application.
 */

/**
 * String validators
 */
export const string = {
  /**
   * Non-empty trimmed string
   */
  nonEmpty: z.string().trim().min(1, "Cannot be empty"),
  
  /**
   * Email address
   */
  email: z.string().email("Invalid email address"),
  
  /**
   * URL
   */
  url: z.string().url("Invalid URL"),
  
  /**
   * UUID
   */
  uuid: z.string().uuid("Invalid UUID"),
  
  /**
   * Strong password
   */
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .refine(
      (value) => /[A-Z]/.test(value),
      "Password must contain at least one uppercase letter"
    )
    .refine(
      (value) => /[a-z]/.test(value),
      "Password must contain at least one lowercase letter"
    )
    .refine(
      (value) => /[0-9]/.test(value),
      "Password must contain at least one number"
    ),
  
  /**
   * Converts a string to a number
   */
  numeric: z
    .string()
    .regex(/^\d+$/, "Must be a valid integer")
    .transform((val) => Number.parseInt(val, 10)),
  
  /**
   * Validates a string as a date
   */
  date: z.string().refine(
    (value) => !Number.isNaN(Date.parse(value)),
    "Invalid date string"
  )
};

/**
 * Number validators
 */
export const number = {
  /**
   * Positive number
   */
  positive: z.number().positive("Must be a positive number"),
  
  /**
   * Non-negative number
   */
  nonNegative: z.number().nonnegative("Cannot be negative"),
  
  /**
   * Integer
   */
  integer: z.number().int("Must be an integer")
};

/**
 * Date validators
 */
export const date = {
  /**
   * Future date
   */
  future: z.date().refine(
    (date) => date > new Date(),
    "Date must be in the future"
  ),
  
  /**
   * Past date
   */
  past: z.date().refine(
    (date) => date < new Date(),
    "Date must be in the past"
  )
};

/**
 * Common object patterns
 */
export const object = {
  /**
   * Pagination parameters
   */
  pagination: z.object({
    page: z.number().int().positive().default(1),
    limit: z.number().int().positive().max(100).default(10),
  }),
  
  /**
   * Sort order
   */
  sorting: z.object({
    sortBy: z.string().optional(),
    sortOrder: z.enum(["asc", "desc"]).default("asc"),
  })
};

/**
 * Type transformers
 */
export const transform = {
  /**
   * Make a schema nullable
   */
  nullable: <T extends z.ZodTypeAny>(schema: T) =>
    z.union([schema, z.null()]),

  /**
   * Make a schema optional
   */
  optional: <T extends z.ZodTypeAny>(schema: T) =>
    z.union([schema, z.undefined()]),

  /**
   * Convert nullish string to undefined
   */
  nullishToUndefined: z
    .string()
    .nullish()
    .transform((val) => val || undefined)
};

/**
 * Common record types
 */
export const record = {
  /**
   * Record with string values
   */
  string: z.record(z.string()),
  
  /**
   * Record with number values
   */
  number: z.record(z.number()),
  
  /**
   * Record with boolean values
   */
  boolean: z.record(z.boolean())
};

/**
 * Create a Zod enum from a TypeScript enum
 */
export function createEnumSchema<T extends Record<string, string | number>>(
  enumObj: T
) {
  return z.enum(Object.values(enumObj).filter((v) => typeof v === "string") as [
    string,
    ...string[]
  ]);
}