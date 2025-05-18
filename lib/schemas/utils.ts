import { z } from "zod";

/**
 * Parse data with the provided schema, throwing a formatted error if validation fails
 */
export function parse<T extends z.ZodType>(
  schema: T,
  data: unknown,
  errorMessage = "Invalid data"
): z.infer<T> {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedError = new Error(
        `${errorMessage}: ${error.errors
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join(", ")}`
      );
      formattedError.name = "ValidationError";
      throw formattedError;
    }
    throw error;
  }
}

/**
 * Safely parse data with the provided schema, returning undefined if validation fails
 */
export function safeParse<T extends z.ZodType>(
  schema: T,
  data: unknown
): z.infer<T> | undefined {
  const result = schema.safeParse(data);
  return result.success ? result.data : undefined;
}

/**
 * Creates a typed schema validator with helpful methods
 */
export function createSchema<T extends z.ZodType>(schema: T) {
  return {
    schema,
    parse: (data: unknown, errorMessage?: string) => parse(schema, data, errorMessage),
    safeParse: (data: unknown) => safeParse(schema, data),
    refine: <U extends T>(refineFn: (schema: T) => U) => createSchema(refineFn(schema)),
    extend: <U extends z.ZodType>(extendFn: (schema: T) => U) => createSchema(extendFn(schema))
  };
}

/**
 * Validate specific formats (useful for API validation)
 */
export const formatValidators = {
  /**
   * Validates if a value is a valid ISO date string
   */
  isISODate: (value: unknown): value is string => {
    if (typeof value !== 'string') return false;
    return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(value);
  },
  
  /**
   * Validates if a value is a valid UUID
   */
  isUUID: (value: unknown): value is string => {
    if (typeof value !== 'string') return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }
};