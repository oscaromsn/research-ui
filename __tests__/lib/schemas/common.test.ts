import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  createEnumSchema,
  date,
  number,
  object,
  record,
  string,
  transform,
} from "@/lib/schemas/common";

describe("Schema Common Utilities", () => {
  describe("String Validators", () => {
    it("should validate non-empty strings", () => {
      expect(string.nonEmpty.parse("test")).toBe("test");
      expect(() => string.nonEmpty.parse("")).toThrow("Cannot be empty");
      expect(() => string.nonEmpty.parse("   ")).toThrow("Cannot be empty");
    });

    it("should validate email addresses", () => {
      expect(string.email.parse("test@example.com")).toBe("test@example.com");
      expect(() => string.email.parse("invalid-email")).toThrow(
        "Invalid email address"
      );
    });

    it("should validate URLs", () => {
      expect(string.url.parse("https://example.com")).toBe(
        "https://example.com"
      );
      expect(() => string.url.parse("not-a-url")).toThrow("Invalid URL");
    });

    it("should validate UUIDs", () => {
      const validUuid = "123e4567-e89b-12d3-a456-426614174000";
      expect(string.uuid.parse(validUuid)).toBe(validUuid);
      expect(() => string.uuid.parse("not-a-uuid")).toThrow("Invalid UUID");
    });

    it("should validate strong passwords", () => {
      const strongPassword = "SecurePass123";
      expect(string.password.parse(strongPassword)).toBe(strongPassword);

      expect(() => string.password.parse("short")).toThrow(
        "Password must be at least 8 characters"
      );
      expect(() => string.password.parse("nouppercase123")).toThrow(
        "Password must contain at least one uppercase letter"
      );
      expect(() => string.password.parse("NOLOWERCASE123")).toThrow(
        "Password must contain at least one lowercase letter"
      );
      expect(() => string.password.parse("NoNumbers")).toThrow(
        "Password must contain at least one number"
      );
    });

    it("should convert numeric strings to numbers", () => {
      expect(string.numeric.parse("123")).toBe(123);
      expect(() => string.numeric.parse("abc")).toThrow(
        "Must be a valid integer"
      );
    });

    it("should validate date strings", () => {
      expect(string.date.parse("2023-01-01")).toBe("2023-01-01");
      expect(() => string.date.parse("invalid-date")).toThrow(
        "Invalid date string"
      );
    });
  });

  describe("Number Validators", () => {
    it("should validate positive numbers", () => {
      expect(number.positive.parse(5)).toBe(5);
      expect(() => number.positive.parse(-1)).toThrow(
        "Must be a positive number"
      );
      expect(() => number.positive.parse(0)).toThrow(
        "Must be a positive number"
      );
    });

    it("should validate non-negative numbers", () => {
      expect(number.nonNegative.parse(0)).toBe(0);
      expect(number.nonNegative.parse(5)).toBe(5);
      expect(() => number.nonNegative.parse(-1)).toThrow("Cannot be negative");
    });

    it("should validate integers", () => {
      expect(number.integer.parse(5)).toBe(5);
      expect(() => number.integer.parse(5.5)).toThrow("Must be an integer");
    });
  });

  describe("Date Validators", () => {
    it("should validate future dates", () => {
      const futureDate = new Date(Date.now() + 86400000); // tomorrow
      expect(date.future.parse(futureDate)).toEqual(futureDate);

      const pastDate = new Date(Date.now() - 86400000); // yesterday
      expect(() => date.future.parse(pastDate)).toThrow(
        "Date must be in the future"
      );
    });

    it("should validate past dates", () => {
      const pastDate = new Date(Date.now() - 86400000); // yesterday
      expect(date.past.parse(pastDate)).toEqual(pastDate);

      const futureDate = new Date(Date.now() + 86400000); // tomorrow
      expect(() => date.past.parse(futureDate)).toThrow(
        "Date must be in the past"
      );
    });
  });

  describe("Object Patterns", () => {
    it("should validate pagination parameters", () => {
      expect(object.pagination.parse({})).toEqual({ page: 1, limit: 10 });
      expect(object.pagination.parse({ page: 2, limit: 20 })).toEqual({
        page: 2,
        limit: 20,
      });

      expect(() => object.pagination.parse({ page: 0 })).toThrow();
      expect(() => object.pagination.parse({ limit: 101 })).toThrow();
    });

    it("should validate sorting parameters", () => {
      expect(object.sorting.parse({})).toEqual({ sortOrder: "asc" });
      expect(
        object.sorting.parse({ sortBy: "name", sortOrder: "desc" })
      ).toEqual({
        sortBy: "name",
        sortOrder: "desc",
      });
    });
  });

  describe("Type Transformers", () => {
    it("should make schemas nullable", () => {
      const nullableString = transform.nullable(z.string());
      expect(nullableString.parse("test")).toBe("test");
      expect(nullableString.parse(null)).toBe(null);
    });

    it("should make schemas optional", () => {
      const optionalString = transform.optional(z.string());
      expect(optionalString.parse("test")).toBe("test");
      expect(optionalString.parse(undefined)).toBe(undefined);
    });

    it("should convert nullish to undefined", () => {
      expect(transform.nullishToUndefined.parse("test")).toBe("test");
      expect(transform.nullishToUndefined.parse(null)).toBe(undefined);
      expect(transform.nullishToUndefined.parse(undefined)).toBe(undefined);
      expect(transform.nullishToUndefined.parse("")).toBe(undefined);
    });
  });

  describe("Record Types", () => {
    it("should validate string records", () => {
      const data = { key1: "value1", key2: "value2" };
      expect(record.string.parse(data)).toEqual(data);
      expect(() => record.string.parse({ key1: 123 })).toThrow();
    });

    it("should validate number records", () => {
      const data = { key1: 1, key2: 2 };
      expect(record.number.parse(data)).toEqual(data);
      expect(() => record.number.parse({ key1: "string" })).toThrow();
    });

    it("should validate boolean records", () => {
      const data = { key1: true, key2: false };
      expect(record.boolean.parse(data)).toEqual(data);
      expect(() => record.boolean.parse({ key1: "string" })).toThrow();
    });
  });

  describe("Enum Schema Creator", () => {
    it("should create enum schemas from TypeScript enums", () => {
      enum TestEnum {
        VALUE1 = "value1",
        VALUE2 = "value2",
        VALUE3 = "value3",
      }

      const enumSchema = createEnumSchema(TestEnum);
      expect(enumSchema.parse("value1")).toBe("value1");
      expect(enumSchema.parse("value2")).toBe("value2");
      expect(() => enumSchema.parse("invalid")).toThrow();
    });

    it("should handle mixed number/string enums by filtering strings", () => {
      enum Mixed {
        StringValue = "string",
        NumberValue = 1,
      }

      const mixedSchema = createEnumSchema(Mixed);
      expect(mixedSchema.parse("string")).toBe("string");
      // Should not accept the number value since we filter to strings only
      expect(() => mixedSchema.parse("1")).toThrow();
    });
  });

  describe("Real-world Usage Patterns", () => {
    it("should compose validators for complex schemas", () => {
      const userSchema = z.object({
        name: string.nonEmpty,
        email: string.email,
        age: number.positive,
        website: string.url.optional(),
        preferences: record.boolean,
      });

      const validUser = {
        name: "John Doe",
        email: "john@example.com",
        age: 30,
        website: "https://johndoe.com",
        preferences: { newsletter: true, notifications: false },
      };

      expect(userSchema.parse(validUser)).toEqual(validUser);
    });

    it("should work with environment-like configurations", () => {
      const configSchema = z.object({
        apiUrl: string.url,
        maxRetries: number.nonNegative,
        timeout: string.numeric,
        enableLogging: z.string().transform((val) => val === "true"),
      });

      const config = {
        apiUrl: "https://api.example.com",
        maxRetries: 3,
        timeout: "5000",
        enableLogging: "true",
      };

      const parsed = configSchema.parse(config);
      expect(parsed).toEqual({
        apiUrl: "https://api.example.com",
        maxRetries: 3,
        timeout: 5000,
        enableLogging: true,
      });
    });

    it("should handle API pagination and sorting", () => {
      const apiQuerySchema = z.object({
        search: string.nonEmpty.optional(),
        ...object.pagination.shape,
        ...object.sorting.shape,
      });

      expect(apiQuerySchema.parse({})).toEqual({
        page: 1,
        limit: 10,
        sortOrder: "asc",
      });

      expect(
        apiQuerySchema.parse({
          search: "legal cases",
          page: 2,
          limit: 20,
          sortBy: "date",
          sortOrder: "desc",
        })
      ).toEqual({
        search: "legal cases",
        page: 2,
        limit: 20,
        sortBy: "date",
        sortOrder: "desc",
      });
    });
  });

  describe("Integration with Existing Types", () => {
    it("should validate legal entity types", () => {
      enum LegalEntityType {
        CASE = "Case",
        STATUTE = "Statute",
        REGULATION = "Regulation",
        PERSON = "Person",
        ORGANIZATION = "Organization",
        LEGAL_CONCEPT = "LegalConcept",
        JURISDICTION = "Jurisdiction",
      }

      const legalEntitySchema = z.object({
        name: string.nonEmpty,
        type: createEnumSchema(LegalEntityType),
        details: string.nonEmpty.optional(),
        confidence: number.nonNegative.max(1).optional(),
      });

      const validEntity = {
        name: "Test Case v. Example Corp",
        type: "Case",
        details: "A landmark case regarding corporate law",
        confidence: 0.85,
      };

      expect(legalEntitySchema.parse(validEntity)).toEqual(validEntity);
    });

    it("should validate research configuration", () => {
      const researchConfigSchema = z.object({
        maxQueries: number.positive.max(10),
        maxDocuments: number.positive.max(50),
        timeoutMs: number.positive,
        enableDetailedLogging: z.boolean().default(false),
        apiUrl: string.url,
      });

      const config = {
        maxQueries: 5,
        maxDocuments: 20,
        timeoutMs: 30000,
        enableDetailedLogging: true,
        apiUrl: "https://api.exa.ai",
      };

      expect(researchConfigSchema.parse(config)).toEqual(config);
    });
  });
});
