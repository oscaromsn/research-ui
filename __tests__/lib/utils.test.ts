import { describe, expect, it } from "vitest";

import { cn } from "@/lib/utils";

describe("cn utility function", () => {
    it("merges class names correctly", () => {
        const result = cn("class1", "class2");
        expect(result).toBe("class1 class2");
    });

    it("handles conditional classes", () => {
        const condition = true;
        const result = cn("base-class", condition && "conditional-class");
        expect(result).toBe("base-class conditional-class");

        const falseCondition = false;
        const result2 = cn("base-class", falseCondition && "conditional-class");
        expect(result2).toBe("base-class");
    });

    it("handles array of classes", () => {
        const result = cn(["class1", "class2"]);
        expect(result).toBe("class1 class2");
    });

    it("handles object syntax", () => {
        const result = cn({
            "base-class": true,
            "disabled-class": false,
            "active-class": true,
        });
        expect(result).toBe("base-class active-class");
    });

    it("handles mixed inputs", () => {
        const result = cn(
            "base-class",
            { "conditional-class": true, "disabled-class": false },
            ["array-class1", "array-class2"],
        );
        expect(result).toBe(
            "base-class conditional-class array-class1 array-class2",
        );
    });

    it("handles undefined and null values", () => {
        const result = cn("base-class", undefined, null, "valid-class");
        expect(result).toBe("base-class valid-class");
    });

    it("handles Tailwind class merging", () => {
        // Tailwind classes with different variants of the same property
        const result = cn("p-2", "p-4", "sm:p-6");
        // The p-4 should override p-2, but sm:p-6 should be preserved
        expect(result).toBe("p-4 sm:p-6");
    });

    it("handles conflicting Tailwind classes based on specificity", () => {
        // Test that tailwind-merge correctly handles conflicting classes
        const result = cn("text-red-500", "text-blue-500");
        // The later class should win
        expect(result).toBe("text-blue-500");
    });
});
