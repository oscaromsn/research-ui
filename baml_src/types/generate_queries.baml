// Represents a single step in the detailed reasoning process.
class ReasoningStep {
  summary string @description("Key findings, rationale, and detailed thought process for this specific analysis step. Should be comprehensive.") @stream.with_state
  items_considered string[]? @description("A list of specific legal concepts, terms, facts, statutes, cases, or principles identified, considered, or analyzed in this step.")
  // Default streaming for string[] means items may stream partially.
  // If you want each item in the list to be fully formed before appearing, you could use:
  // items_considered (string @stream.done)[]?
}

// Structured representation of the LLM's thought process.
class DetailedReasoning {
  // Ensure the structure of each reasoning step appears as soon as possible.
  analyze_legal_question ReasoningStep @description("Step 1: Analysis of the legal question (main issues, key concepts, jurisdiction, crucial facts, initial legal theories).") @stream.not_null
  consider_relevant_legal_principles ReasoningStep @description("Step 2: Consideration of relevant legal principles (constitutional law, statutory interpretations, legal doctrines, counterarguments, jurisdiction-specific interpretations).") @stream.not_null
  formulate_search_queries_strategy ReasoningStep @description("Step 3: Strategy for formulating search queries (use of Boolean operators, exact phrases, wildcards, proximity operators, date restrictions, relevant legal terminology).") @stream.not_null
  specify_expected_information_strategy ReasoningStep @description("Step 4: Approach for specifying what information is expected from each query (case law, statutes, legal principles, scholarly articles).") @stream.not_null
  ensure_comprehensive_coverage_strategy ReasoningStep @description("Step 5: Plan for ensuring the set of queries provides comprehensive coverage of the legal question while avoiding redundancy.") @stream.not_null
}

class SearchQueryItem {
  query_string string @description(#"
    The formulated search query string.
    Example: '"Title VII" AND ("adverse employment action" OR "disparate treatment") AND "circuit court"'
  "#)
  expected_information string[] @description(#"
    A list of specific types of information expected to be gathered using this query.
    Example: [
      "Circuit court cases interpreting Title VII in the context of adverse employment actions or disparate treatment.",
      "Key elements required to establish a prima facie case of employment discrimination under Title VII.",
      "Notable exceptions or defenses to Title VII claims discussed in relevant precedents."
    ]
  "#)
  // Stream each SearchQueryItem as a complete unit.
  @@stream.done
}

// Final output structure.
class LegalQueryAnalysis {
  reasoning DetailedReasoning @description("Structured thought process for analyzing the legal question and formulating search queries, following the 5-step analysis.")
  search_queries SearchQueryItem[] @description("A list of 3-5 effective search queries, each with its query string and expected information.")
}
