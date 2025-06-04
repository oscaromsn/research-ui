// 1. GenerateInitialSearchQueries
//    Input: legal_question: string
//    Output: LegalQueryAnalysis (contains initial SearchQueryItem[] and reasoning)

function GenerateLegalSearchQueries(legal_question: string) -> LegalQueryAnalysis {
  client QueryGeneration
  prompt #"
You are an expert legal research assistant. Return ONLY valid JSON with no markdown formatting.

Legal question: {{legal_question}}

Return a JSON object with the following EXACT structure - all fields are required:

{{ ctx.output_format }}

CRITICAL:
- Include ALL 5 reasoning fields
- No markdown, no code blocks, no explanations
- Generate 3-5 search queries
  "#
}
