// 1. GenerateInitialSearchQueries
//    Input: legal_question: string
//    Output: LegalQueryAnalysis (contains initial SearchQueryItem[] and reasoning)

function GenerateLegalSearchQueries(legal_question: string) -> LegalQueryAnalysis {
  client QueryGeneration
  prompt #"
You are an expert legal research assistant. Return ONLY valid JSON with no markdown formatting.

Legal question: {{legal_question}}

Return a JSON object with the following EXACT structure - all fields are required:

{
  "reasoning": {
    "analyze_legal_question": {
      "summary": "Your analysis here",
      "items_considered": ["item1", "item2"]
    },
    "consider_relevant_legal_principles": {
      "summary": "Your analysis here", 
      "items_considered": ["item1", "item2"]
    },
    "formulate_search_queries_strategy": {
      "summary": "Your analysis here",
      "items_considered": ["item1", "item2"]
    },
    "specify_expected_information_strategy": {
      "summary": "Your analysis here",
      "items_considered": ["item1", "item2"]
    },
    "ensure_comprehensive_coverage_strategy": {
      "summary": "Your analysis here",
      "items_considered": ["item1", "item2"]
    }
  },
  "search_queries": [
    {
      "query_string": "your search query here",
      "expected_information": ["info1", "info2"]
    }
  ]
}

CRITICAL: 
- Start with { and end with }
- Include ALL 5 reasoning fields
- No markdown, no code blocks, no explanations
- Generate 3-5 search queries
  "#
}