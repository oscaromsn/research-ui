import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  createSchema,
  formatValidators,
  parse,
  safeParse,
} from "@/lib/schemas/utils";

describe("Schema Utils", () => {
  const testSchema = z.object({
    name: z.string().min(1, "Name is required"),
    age: z.number().positive("Age must be positive"),
    email: z.string().email("Invalid email format"),
  });

  describe("parse function", () => {
    it("should parse valid data successfully", () => {
      const validData = {
        name: "John Doe",
        age: 30,
        email: "john@example.com",
      };

      const result = parse(testSchema, validData);
      expect(result).toEqual(validData);
    });

    it("should throw formatted error for invalid data", () => {
      const invalidData = {
        name: "",
        age: -5,
        email: "invalid-email",
      };

      expect(() => parse(testSchema, invalidData)).toThrow();

      try {
        parse(testSchema, invalidData);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        if (error instanceof Error) {
          expect(error.name).toBe("ValidationError");
          expect(error.message).toContain("Invalid data:");
          expect(error.message).toContain("name: Name is required");
          expect(error.message).toContain("age: Age must be positive");
          expect(error.message).toContain("email: Invalid email format");
        }
      }
    });

    it("should use custom error message", () => {
      const invalidData = { name: "", age: -5, email: "invalid" };

      expect(() =>
        parse(testSchema, invalidData, "Custom validation failed")
      ).toThrow("Custom validation failed:");
    });

    it("should re-throw non-Zod errors", () => {
      const throwingSchema = z.string().transform(() => {
        throw new Error("Transform error");
      });

      expect(() => parse(throwingSchema, "test")).toThrow("Transform error");
    });
  });

  describe("safeParse function", () => {
    it("should return parsed data for valid input", () => {
      const validData = {
        name: "John Doe",
        age: 30,
        email: "john@example.com",
      };

      const result = safeParse(testSchema, validData);
      expect(result).toEqual(validData);
    });

    it("should return undefined for invalid input", () => {
      const invalidData = {
        name: "",
        age: -5,
        email: "invalid-email",
      };

      const result = safeParse(testSchema, invalidData);
      expect(result).toBeUndefined();
    });

    it("should handle null and undefined inputs", () => {
      expect(safeParse(testSchema, null)).toBeUndefined();
      expect(safeParse(testSchema, undefined)).toBeUndefined();
    });
  });

  describe("createSchema function", () => {
    it("should create a schema wrapper with helper methods", () => {
      const wrappedSchema = createSchema(testSchema);

      expect(wrappedSchema.schema).toBe(testSchema);
      expect(typeof wrappedSchema.parse).toBe("function");
      expect(typeof wrappedSchema.safeParse).toBe("function");
      expect(typeof wrappedSchema.refine).toBe("function");
      expect(typeof wrappedSchema.extend).toBe("function");
    });

    it("should provide working parse method", () => {
      const wrappedSchema = createSchema(testSchema);
      const validData = { name: "John", age: 25, email: "john@test.com" };

      expect(wrappedSchema.parse(validData)).toEqual(validData);
      expect(() =>
        wrappedSchema.parse({ name: "", age: -1, email: "bad" })
      ).toThrow();
    });

    it("should provide working safeParse method", () => {
      const wrappedSchema = createSchema(testSchema);
      const validData = { name: "John", age: 25, email: "john@test.com" };
      const invalidData = { name: "", age: -1, email: "bad" };

      expect(wrappedSchema.safeParse(validData)).toEqual(validData);
      expect(wrappedSchema.safeParse(invalidData)).toBeUndefined();
    });

    it("should provide working refine method", () => {
      const baseSchema = createSchema(z.string());
      const refinedSchema = baseSchema.refine((schema) =>
        schema.min(5, "Must be at least 5 characters")
      );

      expect(refinedSchema.parse("hello")).toBe("hello");
      expect(() => refinedSchema.parse("hi")).toThrow(
        "Must be at least 5 characters"
      );
    });

    it("should provide working extend method", () => {
      const stringSchema = createSchema(z.string());
      const numberSchema = stringSchema.extend((_schema) =>
        z.number().transform(String)
      );

      expect(numberSchema.parse(123)).toBe("123");
    });

    it("should chain methods correctly", () => {
      const chainedSchema = createSchema(z.string())
        .refine((schema) => schema.min(3))
        .refine((schema) => schema.max(10));

      expect(chainedSchema.parse("hello")).toBe("hello");
      expect(() => chainedSchema.parse("hi")).toThrow();
      expect(() => chainedSchema.parse("this is too long")).toThrow();
    });
  });

  describe("formatValidators", () => {
    describe("isISODate", () => {
      it("should validate ISO date strings", () => {
        expect(formatValidators.isISODate("2023-12-25T10:30:00.000Z")).toBe(
          true
        );
        expect(formatValidators.isISODate("2023-01-01T00:00:00.123Z")).toBe(
          true
        );
      });

      it("should reject invalid date formats", () => {
        expect(formatValidators.isISODate("2023-12-25")).toBe(false);
        expect(formatValidators.isISODate("2023-12-25T10:30:00Z")).toBe(false); // Missing milliseconds
        expect(formatValidators.isISODate("invalid-date")).toBe(false);
        expect(formatValidators.isISODate(null)).toBe(false);
        expect(formatValidators.isISODate(undefined)).toBe(false);
        expect(formatValidators.isISODate(123)).toBe(false);
      });
    });

    describe("isUUID", () => {
      it("should validate UUID strings", () => {
        expect(
          formatValidators.isUUID("123e4567-e89b-12d3-a456-426614174000")
        ).toBe(true);
        expect(
          formatValidators.isUUID("550e8400-e29b-41d4-a716-446655440000")
        ).toBe(true);
      });

      it("should reject invalid UUID formats", () => {
        expect(formatValidators.isUUID("not-a-uuid")).toBe(false);
        expect(formatValidators.isUUID("123e4567-e89b-12d3-a456")).toBe(false); // Too short
        expect(
          formatValidators.isUUID("123e4567-e89b-12d3-a456-426614174000-extra")
        ).toBe(false); // Too long
        expect(formatValidators.isUUID(null)).toBe(false);
        expect(formatValidators.isUUID(undefined)).toBe(false);
        expect(formatValidators.isUUID(123)).toBe(false);
      });
    });
  });

  describe("Real-world Integration Scenarios", () => {
    it("should handle API response validation", () => {
      const apiResponseSchema = createSchema(
        z.object({
          id: z.string().refine(formatValidators.isUUID, "Invalid UUID"),
          createdAt: z
            .string()
            .refine(formatValidators.isISODate, "Invalid ISO date"),
          data: z.object({
            name: z.string().min(1),
            status: z.enum(["active", "inactive"]),
          }),
        })
      );

      const validResponse = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        createdAt: "2023-12-25T10:30:00.000Z",
        data: {
          name: "Test Item",
          status: "active" as const,
        },
      };

      expect(apiResponseSchema.parse(validResponse)).toEqual(validResponse);

      const invalidResponse = {
        id: "invalid-uuid",
        createdAt: "invalid-date",
        data: {
          name: "",
          status: "unknown",
        },
      };

      expect(apiResponseSchema.safeParse(invalidResponse)).toBeUndefined();
    });

    it("should handle environment-like validation with detailed error messages", () => {
      const envSchema = createSchema(
        z.object({
          DATABASE_URL: z.string().url("Must be a valid URL"),
          MAX_CONNECTIONS: z
            .string()
            .transform(Number)
            .pipe(z.number().positive()),
          DEBUG: z.string().transform((val) => val === "true"),
        })
      );

      const validEnv = {
        DATABASE_URL: "postgresql://user:pass@localhost:5432/db",
        MAX_CONNECTIONS: "10",
        DEBUG: "true",
      };

      const parsed = envSchema.parse(validEnv);
      expect(parsed).toEqual({
        DATABASE_URL: "postgresql://user:pass@localhost:5432/db",
        MAX_CONNECTIONS: 10,
        DEBUG: true,
      });

      const invalidEnv = {
        DATABASE_URL: "not-a-url",
        MAX_CONNECTIONS: "-5",
        DEBUG: "maybe",
      };

      expect(() =>
        envSchema.parse(invalidEnv, "Environment validation failed")
      ).toThrow("Environment validation failed:");
    });

    it("should work with complex nested schemas", () => {
      const documentSchema = createSchema(
        z.object({
          id: z.string().refine(formatValidators.isUUID),
          metadata: z.object({
            title: z.string().min(1),
            author: z.string().min(1),
            tags: z.array(z.string()).min(1),
            publishedAt: z.string().refine(formatValidators.isISODate),
          }),
          content: z.string().min(10),
          stats: z.object({
            wordCount: z.number().positive(),
            readTime: z.number().positive(),
          }),
        })
      );

      const complexDocument = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        metadata: {
          title: "Legal Research Methods",
          author: "Jane Smith",
          tags: ["legal", "research", "methods"],
          publishedAt: "2023-12-25T10:30:00.000Z",
        },
        content: "This is a comprehensive guide to legal research methods...",
        stats: {
          wordCount: 5000,
          readTime: 15,
        },
      };

      expect(documentSchema.parse(complexDocument)).toEqual(complexDocument);
      expect(documentSchema.safeParse({ id: "invalid" })).toBeUndefined();
    });

    it("should integrate with existing project types", () => {
      // Mock ClientLegalEntity-like schema using schema utilities
      const legalEntitySchema = createSchema(
        z.object({
          name: z.string().min(1, "Entity name required"),
          type: z.enum([
            "Case",
            "Statute",
            "Regulation",
            "Person",
            "Organization",
            "LegalConcept",
            "Jurisdiction",
          ]),
          details: z.string().optional(),
          confidence: z.number().min(0).max(1).optional(),
        })
      );

      const validEntity = {
        name: "Test Case v. Example",
        type: "Case" as const,
        details: "Important legal precedent",
        confidence: 0.95,
      };

      expect(legalEntitySchema.parse(validEntity)).toEqual(validEntity);

      // Test refinement for confidence threshold
      const baseSchema = legalEntitySchema.schema;
      const highConfidenceSchema = baseSchema.refine(
        (data) => !data.confidence || data.confidence >= 0.5,
        "Confidence must be at least 50%"
      );

      expect(highConfidenceSchema.parse(validEntity)).toEqual(validEntity);
      expect(() =>
        highConfidenceSchema.parse({ ...validEntity, confidence: 0.3 })
      ).toThrow("Confidence must be at least 50%");
    });
  });
});
