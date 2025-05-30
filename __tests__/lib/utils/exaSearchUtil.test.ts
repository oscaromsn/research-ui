import axios, { isAxiosError } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SearchQueryItem } from "@/baml_client/types";
import { executeExaSearch } from "@/lib/utils/exaSearchUtil";

// Mock axios
vi.mock("axios", () => ({
    default: {
        post: vi.fn(),
    },
    isAxiosError: vi.fn(),
}));

const mockedAxios = axios as unknown as {
    post: ReturnType<typeof vi.fn>;
};
const mockedIsAxiosError = isAxiosError as unknown as ReturnType<typeof vi.fn>;

// Mock dotenv to prevent loading real environment variables
vi.mock("dotenv", () => ({
    config: vi.fn(() => ({})),
}));

// Get the actual API key from .env.test (loaded by Vitest config)
const EXA_API_KEY_FROM_ENV = process.env.EXA_API_KEY;

beforeEach(() => {
    vi.resetModules();
});

afterEach(() => {
    vi.clearAllMocks();
});

describe("executeExaSearch", () => {
    it("should load EXA_API_KEY from environment variables", () => {
        // Verify that the API key is loaded from .env.test
        expect(EXA_API_KEY_FROM_ENV).toBeDefined();
        expect(typeof EXA_API_KEY_FROM_ENV).toBe("string");
        expect(EXA_API_KEY_FROM_ENV).not.toBe("");
    });

    const mockSearchQuery: SearchQueryItem = {
        query_string: "legal precedents for copyright infringement",
        expected_information: [
            "Recent court cases involving copyright infringement",
            "Key legal arguments in copyright cases",
        ],
    };

    const mockExaResponse = {
        data: {
            results: [
                {
                    id: "exa-1234",
                    url: "https://example.com/article1",
                    title: "Copyright Infringement Case Study",
                    author: "John Doe",
                    score: 0.95,
                    publishedDate: "2023-04-15",
                    text: "This is the full text of the article about copyright infringement.",
                    highlights: [
                        "Important highlight 1 about copyright.",
                        "Another important point about infringement.",
                    ],
                },
                {
                    id: "exa-5678",
                    url: "https://example.com/article2",
                    title: "Legal Analysis of Recent Copyright Cases",
                    author: "Jane Smith",
                    score: 0.85,
                    publishedDate: "2023-03-10",
                    text: "Full text discussing recent copyright cases and their implications.",
                    highlights: [
                        "Key legal precedent established in case X.",
                        "The court ruled that...",
                    ],
                },
            ],
            autopromptString: "Modified search query for better results",
            requestId: "req-9876",
        },
    };

    it("should throw an error with empty EXA_API_KEY", async () => {
        // Mock the environment variable to be undefined
        const originalEnv = process.env.EXA_API_KEY;
        delete process.env.EXA_API_KEY;

        // Re-import the module to get the updated environment
        vi.resetModules();
        const { executeExaSearch: executeExaSearchWithoutKey } = await import("@/lib/utils/exaSearchUtil");

        try {
            await expect(executeExaSearchWithoutKey(mockSearchQuery)).rejects.toThrow(
                "EXA_API_KEY environment variable is not set. Please check your .env.local file."
            );
        } finally {
            // Restore the original environment variable
            if (originalEnv) {
                process.env.EXA_API_KEY = originalEnv;
            }
            vi.resetModules();
        }
    });

    it("should correctly build request body based on parameters", async () => {
        // Setup
        mockedAxios.post.mockResolvedValueOnce(mockExaResponse);

        // Execute
        await executeExaSearch(mockSearchQuery, 10, true, 5);

        // Verify
        expect(mockedAxios.post).toHaveBeenCalledTimes(1);

        const [url, requestBody, config] = mockedAxios.post.mock.calls[0];

        // Check URL
        expect(url).toBe("https://api.exa.ai/search");

        // Check request body
        expect(requestBody).toEqual({
            query: mockSearchQuery.query_string,
            num_results: 10,
            type: "auto",
            contents: {
                text: true,
                highlights: {
                    num_sentences: 5,
                },
            },
        });

        // Check config
        expect(config?.headers).toEqual({
            "Content-Type": "application/json",
            "x-api-key": EXA_API_KEY_FROM_ENV,
        });
    });

    it("should build request body with different numResults values", async () => {
        // Setup
        mockedAxios.post.mockResolvedValueOnce(mockExaResponse);

        // Execute with different numResults
        await executeExaSearch(mockSearchQuery, 3, true, 2);

        // Verify
        const [, requestBody] = mockedAxios.post.mock.calls[0];
        expect(requestBody.num_results).toBe(3);
        expect(requestBody.contents.highlights.num_sentences).toBe(2);
    });

    it("should build request body with fetchFullText false", async () => {
        // Setup
        mockedAxios.post.mockResolvedValueOnce(mockExaResponse);

        // Execute with fetchFullText false
        await executeExaSearch(mockSearchQuery, 5, false, 3);

        // Verify
        const [, requestBody] = mockedAxios.post.mock.calls[0];
        expect(requestBody.contents.text).toBeUndefined();
        expect(requestBody.contents.highlights.num_sentences).toBe(3);
    });

    it("should correctly transform Exa API response to BAML SearchResultItem[]", async () => {
        // Setup
        mockedAxios.post.mockResolvedValueOnce(mockExaResponse);
        vi.spyOn(console, "log").mockImplementation(() => {}); // Silence console logs

        // Set a fixed date for testing
        const fixedDate = new Date("2023-05-01T12:00:00Z");
        vi.spyOn(global, "Date").mockImplementation(
            () => fixedDate as unknown as Date,
        );

        // Execute
        const results = await executeExaSearch(mockSearchQuery);

        // Verify
        expect(results).toHaveLength(2);

        // Check first result
        expect(results[0]).toEqual({
            id: "https://example.com/article1",
            url: "https://example.com/article1",
            title: "Copyright Infringement Case Study",
            source_name: "Exa Search",
            snippet:
                "Important highlight 1 about copyright. ... Another important point about infringement.",
            full_text:
                "This is the full text of the article about copyright infringement.",
            published_date: "2023-04-15",
            retrieval_date: "2023-05-01T12:00:00.000Z",
            author: "John Doe",
            score: 0.95,
            original_query: mockSearchQuery,
            metadata: {
                exa_internal_id: "exa-1234",
                exa_autoprompt: "Modified search query for better results",
            },
        });

        // Check second result
        expect(results[1].url).toBe("https://example.com/article2");
        expect(results[1].title).toBe(
            "Legal Analysis of Recent Copyright Cases",
        );
    });

    it("should handle response with missing optional fields", async () => {
        // Setup response with minimal required fields
        const minimalResponse = {
            data: {
                results: [
                    {
                        id: "exa-minimal",
                        url: "https://example.com/minimal",
                        // Missing: title, author, score, publishedDate, text, highlights
                    },
                ],
                requestId: "req-minimal",
            },
        };

        mockedAxios.post.mockResolvedValueOnce(minimalResponse);
        vi.spyOn(console, "log").mockImplementation(() => {});

        // Execute
        const results = await executeExaSearch(mockSearchQuery);

        // Verify
        expect(results).toHaveLength(1);
        expect(results[0]).toEqual({
            id: "https://example.com/minimal",
            url: "https://example.com/minimal",
            title: null,
            source_name: "Exa Search",
            snippet: null,
            full_text: null,
            published_date: null,
            retrieval_date: expect.any(String),
            author: null,
            score: null,
            original_query: mockSearchQuery,
            metadata: {
                exa_internal_id: "exa-minimal",
            },
        });
    });

    it("should handle response with different publishedDate formats", async () => {
        // Setup response with ISO8601 format
        const responseWithISODate = {
            data: {
                results: [
                    {
                        id: "exa-iso-date",
                        url: "https://example.com/iso-date",
                        title: "Article with ISO Date",
                        publishedDate: "2023-04-15T10:30:00Z",
                        text: "Article content",
                    },
                ],
            },
        };

        mockedAxios.post.mockResolvedValueOnce(responseWithISODate);

        // Execute
        const results = await executeExaSearch(mockSearchQuery);

        // Verify
        expect(results[0].published_date).toBe("2023-04-15T10:30:00Z");
    });

    it("should properly set retrieval_date as ISO8601 string", async () => {
        // Setup
        mockedAxios.post.mockResolvedValueOnce(mockExaResponse);
        
        // Set a fixed date for testing
        const fixedDate = new Date("2023-05-01T12:00:00Z");
        vi.spyOn(global, "Date").mockImplementation(() => fixedDate as unknown as Date);

        // Execute
        const results = await executeExaSearch(mockSearchQuery);

        // Verify
        expect(results[0].retrieval_date).toBe("2023-05-01T12:00:00.000Z");
        expect(new Date(results[0].retrieval_date).toISOString()).toBe("2023-05-01T12:00:00.000Z");
    });

    it("should handle API errors correctly", async () => {
        // Setup
        const apiError = new Error("API error");
        (
            apiError as Error & {
                response: { status: number; data: { message: string } };
            }
        ).response = {
            status: 401,
            data: { message: "Unauthorized" },
        };
        mockedAxios.post.mockRejectedValueOnce(apiError);
        mockedIsAxiosError.mockReturnValueOnce(true);

        vi.spyOn(console, "error").mockImplementation(() => {}); // Silence console errors

        // Execute & Verify
        await expect(executeExaSearch(mockSearchQuery)).rejects.toThrow(
            'Exa API authentication failed. Status 401: {"message":"Unauthorized"}',
        );
    });

    it("should handle non-axios errors correctly", async () => {
        // Setup
        const genericError = new Error("Something went wrong");
        mockedAxios.post.mockRejectedValueOnce(genericError);
        mockedIsAxiosError.mockReturnValueOnce(false);

        vi.spyOn(console, "error").mockImplementation(() => {}); // Silence console errors

        // Execute & Verify
        await expect(executeExaSearch(mockSearchQuery)).rejects.toThrow(
            "Something went wrong",
        );
    });

    it("should handle 429 rate limit errors correctly", async () => {
        // Setup
        const rateLimitError = new Error("Rate limit exceeded");
        (
            rateLimitError as Error & {
                response: { status: number; data: { error: string } };
            }
        ).response = {
            status: 429,
            data: { error: "Too many requests" },
        };
        mockedAxios.post.mockRejectedValueOnce(rateLimitError);
        mockedIsAxiosError.mockReturnValueOnce(true);

        vi.spyOn(console, "error").mockImplementation(() => {});

        // Execute & Verify
        await expect(executeExaSearch(mockSearchQuery)).rejects.toThrow(
            'Rate limit exceeded for Exa API. Status 429: {"error":"Too many requests"}',
        );
    });

    it("should handle 403 forbidden errors correctly", async () => {
        // Setup
        const forbiddenError = new Error("Forbidden");
        (
            forbiddenError as Error & {
                response: { status: number; data: { message: string } };
            }
        ).response = {
            status: 403,
            data: { message: "Invalid API key" },
        };
        mockedAxios.post.mockRejectedValueOnce(forbiddenError);
        mockedIsAxiosError.mockReturnValueOnce(true);

        vi.spyOn(console, "error").mockImplementation(() => {});

        // Execute & Verify
        await expect(executeExaSearch(mockSearchQuery)).rejects.toThrow(
            'Exa API authentication failed. Status 403: {"message":"Invalid API key"}',
        );
    });

    it("should handle 500 server errors correctly", async () => {
        // Setup
        const serverError = new Error("Internal server error");
        (
            serverError as Error & {
                response: { status: number; data: { error: string } };
            }
        ).response = {
            status: 500,
            data: { error: "Internal server error" },
        };
        mockedAxios.post.mockRejectedValueOnce(serverError);
        mockedIsAxiosError.mockReturnValueOnce(true);

        vi.spyOn(console, "error").mockImplementation(() => {});

        // Execute & Verify
        await expect(executeExaSearch(mockSearchQuery)).rejects.toThrow(
            'Exa API server error. Status 500: {"error":"Internal server error"}',
        );
    });

    it("should properly handle missing highlights", async () => {
        // Setup
        const responseWithoutHighlights = {
            data: {
                results: [
                    {
                        id: "exa-1234",
                        url: "https://example.com/article1",
                        title: "Copyright Infringement Case Study",
                        author: "John Doe",
                        score: 0.95,
                        publishedDate: "2023-04-15",
                        text: "This is the full text of the article about copyright infringement.",
                        // No highlights provided
                    },
                ],
                requestId: "req-9876",
            },
        };

        mockedAxios.post.mockResolvedValueOnce(responseWithoutHighlights);

        // Execute
        const results = await executeExaSearch(mockSearchQuery);

        // Verify
        expect(results).toHaveLength(1);
        expect(results[0].snippet).toBeNull();
    });

    it("should set contents.text=true when fetchFullText is true", async () => {
        // Setup
        mockedAxios.post.mockResolvedValueOnce(mockExaResponse);

        // Execute
        await executeExaSearch(mockSearchQuery, 5, true, 0);

        // Verify
        const [, requestBody] = mockedAxios.post.mock.calls[0];
        expect(requestBody.contents.text).toBe(true);
        expect(requestBody.contents.highlights).toBeUndefined();
    });

    it("should not include highlights when numHighlightSentences is 0", async () => {
        // Setup
        mockedAxios.post.mockResolvedValueOnce(mockExaResponse);

        // Execute
        await executeExaSearch(mockSearchQuery, 5, false, 0);

        // Verify
        const [, requestBody] = mockedAxios.post.mock.calls[0];
        expect(requestBody.contents.text).toBeUndefined();
        expect(requestBody.contents.highlights).toBeUndefined();
    });
});
