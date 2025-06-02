import { screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import {
  MockIntersectionObserver,
  MockResizeObserver,
  createMockAnalyzedDocument,
  createMockLegalEntity,
  createMockSearchQuery,
  renderWithProviders,
} from "./test-utils"

// Simple test component for testing renderWithProviders
const TestComponent = () => <div data-testid="test-component">Test Content</div>

describe("test-utils", () => {
  describe("renderWithProviders", () => {
    it("renders components with providers", () => {
      renderWithProviders(<TestComponent />)
      expect(screen.getByTestId("test-component")).toBeInTheDocument()
      expect(screen.getByTestId("test-component")).toHaveTextContent(
        "Test Content"
      )
    })
  })

  describe("Mock classes", () => {
    it("MockResizeObserver has the required methods", () => {
      const mockObserver = new MockResizeObserver()
      expect(mockObserver.observe).toBeDefined()
      expect(mockObserver.unobserve).toBeDefined()
      expect(mockObserver.disconnect).toBeDefined()

      // Test method calls
      mockObserver.observe({} as Element)
      mockObserver.unobserve({} as Element)
      mockObserver.disconnect()

      expect(mockObserver.observe).toHaveBeenCalled()
      expect(mockObserver.unobserve).toHaveBeenCalled()
      expect(mockObserver.disconnect).toHaveBeenCalled()
    })

    it("MockIntersectionObserver has the required methods", () => {
      const mockObserver = new MockIntersectionObserver()

      expect(mockObserver.observe).toBeDefined()
      expect(mockObserver.unobserve).toBeDefined()
      expect(mockObserver.disconnect).toBeDefined()
      expect(mockObserver.takeRecords).toBeDefined()

      // Test method calls
      mockObserver.observe({} as Element)
      mockObserver.unobserve({} as Element)
      mockObserver.disconnect()
      const records = mockObserver.takeRecords()

      expect(mockObserver.observe).toHaveBeenCalled()
      expect(mockObserver.unobserve).toHaveBeenCalled()
      expect(mockObserver.disconnect).toHaveBeenCalled()
      expect(mockObserver.takeRecords).toHaveBeenCalled()
      expect(records).toEqual([])
    })
  })

  describe("Mock data creators", () => {
    it("createMockAnalyzedDocument creates a valid document with defaults", () => {
      const doc = createMockAnalyzedDocument()

      expect(doc.searchResultId).toBe("mock-id-1")
      expect(doc.relevanceScore).toBe(8)
      expect(doc.keyArgumentsAndReasoning).toHaveLength(2)
      expect(doc.extractedEntities).toHaveLength(2)
      expect(doc.reasoning.analyzeLegalQuestion.summary).toBe(
        "Analysis of legal question"
      )
    })

    it("createMockAnalyzedDocument allows overriding properties", () => {
      const doc = createMockAnalyzedDocument({
        searchResultId: "custom-id",
        relevanceScore: 5,
      })

      expect(doc.searchResultId).toBe("custom-id")
      expect(doc.relevanceScore).toBe(5)
      // Other properties should remain at default values
      expect(doc.keyArgumentsAndReasoning).toHaveLength(2)
    })

    it("createMockSearchQuery creates a valid query with defaults", () => {
      const query = createMockSearchQuery()

      expect(query.queryString).toBe("mock search query")
      expect(query.expectedInformation).toHaveLength(2)
    })

    it("createMockSearchQuery allows overriding properties", () => {
      const query = createMockSearchQuery({
        queryString: "custom query",
      })

      expect(query.queryString).toBe("custom query")
      // Other properties should remain at default values
      expect(query.expectedInformation).toHaveLength(2)
    })

    it("createMockLegalEntity creates a valid entity with defaults", () => {
      const entity = createMockLegalEntity()

      expect(entity.name).toBe("Mock Legal Entity")
      expect(entity.type).toBe("Case")
      expect(entity.details).toBe("Details about the mock legal entity")
    })

    it("createMockLegalEntity allows overriding properties", () => {
      const entity = createMockLegalEntity({
        name: "Custom Entity",
        type: "Statute" as const,
      })

      expect(entity.name).toBe("Custom Entity")
      expect(entity.type).toBe("Statute")
      // Other properties should remain at default values
      expect(entity.details).toBe("Details about the mock legal entity")
    })
  })
})
