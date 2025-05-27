// Mock for BAML client to avoid real API calls during testing

import { vi } from "vitest";

export const b = {
    GenerateLegalSearchQueries: vi.fn(),
    AnalyzeSingleDocument: vi.fn(),
    AssessResearchAndPlanNextSteps: vi.fn(),
    SynthesizeOverallFindings: vi.fn(),
    GenerateFinalLegalReport: vi.fn(),
    stream: {
        GenerateLegalSearchQueries: vi.fn(),
        AnalyzeSingleDocument: vi.fn(),
        AssessResearchAndPlanNextSteps: vi.fn(),
        SynthesizeOverallFindings: vi.fn(),
        GenerateFinalLegalReport: vi.fn(),
    },
};

// Export default for default imports
export default b;
