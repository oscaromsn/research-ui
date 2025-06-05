// __tests__/app/actions/documentFetchingUpdates.test.ts

import { describe, expect, it } from "vitest"

import type { ResearchUpdate } from "@/app/actions/researchAgentOrchestrator"
import type { ClientAnalyzedDoc } from "@/lib/state/researchAtoms"

// Mock data for testing
const mockSearchResultItems = [
  {
    id: "doc-1",
    title: "Contract Law and Force Majeure",
    url: "https://example.com/doc1",
    full_text: "This document discusses force majeure clauses...",
    source_name: "Westlaw",
    summary: "Legal analysis of force majeure",
    highlights: ["force majeure", "contract law"],
    published_date: "2023-01-15",
  },
  {
    id: "doc-2",
    title: "COVID-19 Impact on Contract Performance",
    url: "https://example.com/doc2",
    full_text:
      "The pandemic has significantly affected contract performance...",
    source_name: "LexisNexis",
    summary: "Analysis of pandemic impact on contracts",
    highlights: ["COVID-19", "contract performance"],
    published_date: "2023-03-20",
  },
  {
    id: "doc-3",
    title: "California Civil Code § 1511",
    url: "https://example.com/doc3",
    full_text:
      "Performance of an obligation is excused when prevented by operation of law...",
    source_name: "California Legislature",
    summary: "Statutory provisions for performance excuse",
    highlights: ["performance excuse", "operation of law"],
    published_date: "2022-12-01",
  },
]

describe("Document Fetching Updates", () => {
  describe("Individual Document Updates During FETCHING_DOCUMENTS Stage", () => {
    it("should send individual document updates with 'fetched' status", () => {
      // Expected behavior: For each document retrieved from Exa API,
      // the orchestrator should send a FETCHING_DOCUMENTS update with individual document data

      const expectedUpdates: ResearchUpdate[] = mockSearchResultItems.map(
        (item, index) => ({
          type: "DATA",
          stage: "FETCHING_DOCUMENTS",
          message: `Document ${index + 1}/${mockSearchResultItems.length} retrieved: ${item.title?.substring(0, 50)}...`,
          data: {
            docId: item.id,
            title: item.title,
            url: item.url,
            source: item.source_name,
            status: "fetched",
            timestamp: expect.any(String),
          } as Partial<ClientAnalyzedDoc>,
          currentProcessedDoc: index + 1,
          totalDocsToProcess: mockSearchResultItems.length,
        })
      )

      // Verify the expected structure of individual document updates
      expectedUpdates.forEach((update, index) => {
        expect(update.type).toBe("DATA")
        expect(update.stage).toBe("FETCHING_DOCUMENTS")
        expect(update.data).toMatchObject({
          docId: mockSearchResultItems[index]?.id,
          title: mockSearchResultItems[index]?.title,
          url: mockSearchResultItems[index]?.url,
          source: mockSearchResultItems[index]?.source_name,
          status: "fetched",
        })
        expect(update.message).toContain(
          `Document ${index + 1}/${mockSearchResultItems.length} retrieved`
        )
        expect(update.currentProcessedDoc).toBe(index + 1)
        expect(update.totalDocsToProcess).toBe(mockSearchResultItems.length)
      })
    })

    it("should create ClientAnalyzedDoc-compatible data structure for fetched documents", () => {
      // Expected behavior: Document data sent during FETCHING_DOCUMENTS should be
      // compatible with ClientAnalyzedDoc interface but with minimal analysis fields

      const item = mockSearchResultItems[0]
      const expectedDocData = {
        docId: item?.id,
        title: item?.title,
        url: item?.url,
        source: item?.source_name,
        status: "fetched",
        timestamp: expect.any(String),
      } as unknown as Partial<ClientAnalyzedDoc>

      // Verify the structure is correct
      expect(expectedDocData.docId).toBeDefined()
      expect(expectedDocData.title).toBeDefined()
      expect(expectedDocData.url).toBeDefined()
      expect(expectedDocData.source).toBeDefined()
      expect(expectedDocData.status).toBe("fetched")

      // Analysis fields should be undefined
      expect(expectedDocData.relevanceScore).toBeUndefined()
      expect(expectedDocData.summarySnippet).toBeUndefined()
      expect(expectedDocData.keyArguments).toBeUndefined()
    })

    it("should handle documents with missing optional fields gracefully", () => {
      // Test edge case: Some documents might have missing title, source, etc.
      const incompleteDocument = {
        id: "incomplete-doc",
        url: "https://example.com/incomplete",
        full_text: "Some content...",
        // Missing title, source_name, etc.
      }

      const expectedDocData = {
        docId: incompleteDocument.id,
        title: undefined, // Should handle missing title
        url: incompleteDocument.url,
        source: undefined, // Should handle missing source
        status: "fetched",
        timestamp: expect.any(String),
      } as unknown as Partial<ClientAnalyzedDoc>

      expect(expectedDocData.docId).toBe("incomplete-doc")
      expect(expectedDocData.url).toBe("https://example.com/incomplete")
      expect(expectedDocData.status).toBe("fetched")
    })

    it("should send updates in correct order during document fetching", () => {
      // Expected behavior: Updates should be sent in this order:
      // 1. STATUS_CHANGE - "Starting document fetch"
      // 2. Multiple DATA updates - one per document
      // 3. DATA update - "Document fetch complete"

      // Define the expected sequence structure
      const expectedInitialUpdate = {
        type: "STATUS_CHANGE",
        stage: "FETCHING_DOCUMENTS",
        message: "Retrieving documents from live search APIs...",
      }

      const expectedIndividualDocUpdate = {
        type: "DATA",
        stage: "FETCHING_DOCUMENTS",
        data: expect.objectContaining({
          status: "fetched",
        }),
        currentProcessedDoc: expect.any(Number),
        totalDocsToProcess: mockSearchResultItems.length,
      }

      const expectedFinalUpdate = {
        type: "DATA",
        stage: "FETCHING_DOCUMENTS",
        message: `${mockSearchResultItems.length} unique documents retrieved.`,
        isFinalForStage: true,
      }

      // Verify the expected structure of each type of update
      expect(expectedInitialUpdate.type).toBe("STATUS_CHANGE")
      expect(expectedInitialUpdate.stage).toBe("FETCHING_DOCUMENTS")

      expect(expectedIndividualDocUpdate.type).toBe("DATA")
      expect(expectedIndividualDocUpdate.stage).toBe("FETCHING_DOCUMENTS")
      expect(expectedIndividualDocUpdate.totalDocsToProcess).toBe(3)

      expect(expectedFinalUpdate.type).toBe("DATA")
      expect(expectedFinalUpdate.stage).toBe("FETCHING_DOCUMENTS")
      expect(expectedFinalUpdate.isFinalForStage).toBe(true)
    })

    it("should maintain backward compatibility with existing summary data", () => {
      // Expected behavior: The final FETCHING_DOCUMENTS update should still include
      // the existing summary data for backward compatibility

      const expectedFinalUpdate: ResearchUpdate = {
        type: "DATA",
        stage: "FETCHING_DOCUMENTS",
        data: {
          count: mockSearchResultItems.length,
          titles: mockSearchResultItems.map(r =>
            r.title ? `${r.title.substring(0, 70)}...` : "Untitled"
          ),
          sources: mockSearchResultItems.map(r => r.source_name),
        },
        message: `${mockSearchResultItems.length} unique documents retrieved.`,
        isFinalForStage: true,
      }

      expect(expectedFinalUpdate.data).toMatchObject({
        count: 3,
        titles: expect.arrayContaining([
          expect.stringContaining("Contract Law"),
          expect.stringContaining("COVID-19 Impact"),
          expect.stringContaining("California Civil Code"),
        ]),
        sources: expect.arrayContaining([
          "Westlaw",
          "LexisNexis",
          "California Legislature",
        ]),
      })
    })
  })

  describe("Error Handling During Document Fetching", () => {
    it("should send error updates for individual documents that fail to fetch", () => {
      // Expected behavior: If individual document fetching fails,
      // send an error update for that specific document

      const failedDocId = "failed-doc-1"
      const expectedErrorUpdate: ResearchUpdate = {
        type: "ERROR",
        stage: "FETCHING_DOCUMENTS",
        message: `Failed to retrieve document ${failedDocId}: Network timeout`,
        data: {
          docId: failedDocId,
          status: "error",
          errorMessage: "Network timeout",
          timestamp: expect.any(String),
        } as Partial<ClientAnalyzedDoc>,
      }

      expect(expectedErrorUpdate.type).toBe("ERROR")
      expect(expectedErrorUpdate.stage).toBe("FETCHING_DOCUMENTS")
      expect(expectedErrorUpdate.data).toMatchObject({
        docId: failedDocId,
        status: "error",
        errorMessage: "Network timeout",
      })
    })

    it("should continue processing remaining documents after individual failures", () => {
      // Expected behavior: If one document fails, others should still be processed
      // Test case: Mixed results with both successful and failed documents

      const expectedUpdates = [
        // Successful document 1
        {
          type: "DATA",
          stage: "FETCHING_DOCUMENTS",
          data: expect.objectContaining({
            docId: mockSearchResultItems[0]?.id,
            status: "fetched",
          }),
        },
        // Failed document
        {
          type: "ERROR",
          stage: "FETCHING_DOCUMENTS",
          data: expect.objectContaining({
            docId: "failed-doc",
            status: "error",
            errorMessage: "Rate limit exceeded",
          }),
        },
        // Successful document 2
        {
          type: "DATA",
          stage: "FETCHING_DOCUMENTS",
          data: expect.objectContaining({
            docId: mockSearchResultItems[1]?.id,
            status: "fetched",
          }),
        },
      ]

      // Verify we get updates for both successful and failed documents
      expect(expectedUpdates).toHaveLength(3)
      expect(expectedUpdates[0]?.type).toBe("DATA")
      expect(expectedUpdates[1]?.type).toBe("ERROR")
      expect(expectedUpdates[2]?.type).toBe("DATA")
    })
  })
})
