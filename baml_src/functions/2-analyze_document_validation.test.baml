// Validation test specifically to catch BamlValidationError for missing required fields
test ValidateAnalyzeSingleDocumentRequiredFields {
  functions [AnalyzeSingleDocument]
  args {
    original_legal_question "What constitutes 'adverse employment action' under Title VII in the 9th Circuit?"
    document {
      id "validation_test_doc"
      url "https://example.com/test-validation"
      source_name "Test Source"
      title "Test Document for Validation"
      snippet "Test snippet for validation purposes"
      full_text "This is a test document to ensure all required fields are properly returned by the AnalyzeSingleDocument function."
      retrieval_date "2024-07-16T10:00:00Z"
      metadata {}
    }
  }

  // CRITICAL: Test all required fields are present and non-empty
  @@assert( {{ this.search_result_id is not none }} )
  @@assert( {{ this.search_result_id == "validation_test_doc" }} )
  @@assert( {{ this.relevance_score is not none }} )
  @@assert( {{ this.relevance_score >= 1 and this.relevance_score <= 10 }} )
  @@assert( {{ this.confidence_score is not none }} )
  @@assert( {{ this.confidence_score >= 1 and this.confidence_score <= 10 }} )
  @@assert( {{ this.summary is not none }} )
  @@assert( {{ this.summary | length > 0 }} )
  @@assert( {{ this.key_arguments_and_reasoning is not none }} )
  @@assert( {{ this.extracted_entities is not none }} )
  @@assert( {{ this.extracted_quotes is not none }} )

  // CRITICAL: Test complete reasoning structure is present
  @@assert( {{ this.reasoning is not none }} )
  @@assert( {{ this.reasoning.analyze_legal_question is not none }} )
  @@assert( {{ this.reasoning.analyze_legal_question.summary is not none }} )
  @@assert( {{ this.reasoning.analyze_legal_question.summary | length > 0 }} )

  @@assert( {{ this.reasoning.consider_relevant_legal_principles is not none }} )
  @@assert( {{ this.reasoning.consider_relevant_legal_principles.summary is not none }} )
  @@assert( {{ this.reasoning.consider_relevant_legal_principles.summary | length > 0 }} )

  @@assert( {{ this.reasoning.formulate_search_queries_strategy is not none }} )
  @@assert( {{ this.reasoning.formulate_search_queries_strategy.summary is not none }} )
  @@assert( {{ this.reasoning.formulate_search_queries_strategy.summary | length > 0 }} )

  @@assert( {{ this.reasoning.specify_expected_information_strategy is not none }} )
  @@assert( {{ this.reasoning.specify_expected_information_strategy.summary is not none }} )
  @@assert( {{ this.reasoning.specify_expected_information_strategy.summary | length > 0 }} )

  @@assert( {{ this.reasoning.ensure_comprehensive_coverage_strategy is not none }} )
  @@assert( {{ this.reasoning.ensure_comprehensive_coverage_strategy.summary is not none }} )
  @@assert( {{ this.reasoning.ensure_comprehensive_coverage_strategy.summary | length > 0 }} )
}

// Test with minimal document content to ensure robust handling
test ValidateAnalyzeSingleDocumentMinimalContent {
  functions [AnalyzeSingleDocument]
  args {
    original_legal_question "What is consideration in contract law?"
    document {
      id "minimal_doc"
      url "https://example.com/minimal"
      source_name "Minimal Source"
      title "Minimal Document"
      snippet "Brief snippet"
      full_text "Very brief content about contracts."
      retrieval_date "2024-07-16T10:00:00Z"
      metadata {}
    }
  }

  // Even with minimal content, all required structure must be present
  @@assert( {{ this.search_result_id == "minimal_doc" }} )
  @@assert( {{ this.reasoning is not none }} )
  @@assert( {{ this.reasoning.analyze_legal_question.summary | length > 0 }} )
  @@assert( {{ this.reasoning.consider_relevant_legal_principles.summary | length > 0 }} )
  @@assert( {{ this.reasoning.formulate_search_queries_strategy.summary | length > 0 }} )
  @@assert( {{ this.reasoning.specify_expected_information_strategy.summary | length > 0 }} )
  @@assert( {{ this.reasoning.ensure_comprehensive_coverage_strategy.summary | length > 0 }} )
}

// Test with complex document to ensure structure remains consistent
test ValidateAnalyzeSingleDocumentComplexContent {
  functions [AnalyzeSingleDocument]
  args {
    original_legal_question "What are the requirements for establishing a prima facie case of employment discrimination under Title VII?"
    document {
      id "complex_doc"
      url "https://example.com/complex-employment-case"
      source_name "Federal Courts Database"
      title "McDonnell Douglas Corp. v. Green Analysis and Modern Applications"
      snippet "Comprehensive analysis of the McDonnell Douglas framework for establishing prima facie cases of employment discrimination, including modern circuit court applications and variations."
      full_text #"
        The McDonnell Douglas Corp. v. Green framework, established by the Supreme Court in 1973, provides the foundational structure for analyzing employment discrimination claims under Title VII. This seminal case established a burden-shifting framework that remains the cornerstone of discrimination jurisprudence.

        Under McDonnell Douglas, a plaintiff must establish a prima facie case by showing: (1) membership in a protected class; (2) qualification for the position in question; (3) an adverse employment action; and (4) circumstances giving rise to an inference of discrimination.

        The circuits have developed various approaches to the fourth element, with some requiring but-for causation and others applying a motivating factor test. The Civil Rights Act of 1991 further complicated this analysis by establishing mixed-motive provisions.

        Recent circuit decisions have refined the analysis particularly regarding the scope of adverse employment actions and the level of specificity required for circumstantial evidence of discrimination.
      "#
      retrieval_date "2024-07-16T10:00:00Z"
      metadata {
        court "Supreme Court"
        citation "411 U.S. 792 (1973)"
        jurisdiction "Federal"
      }
    }
  }

  // Complex content should still maintain required structure
  @@assert( {{ this.search_result_id == "complex_doc" }} )
  @@assert( {{ this.relevance_score >= 6 }} ) // Should be highly relevant
  @@assert( {{ this.confidence_score >= 6 }} ) // Should be confident given quality source
  @@assert( {{ this.summary | length > 20 }} ) // Should generate substantial summary
  @@assert( {{ this.key_arguments_and_reasoning | length >= 2 }} ) // Multiple arguments expected
  @@assert( {{ this.extracted_entities | length >= 3 }} ) // Should extract multiple entities

  // Full reasoning structure validation
  @@assert( {{ this.reasoning.analyze_legal_question.summary | length > 15 }} )
  @@assert( {{ this.reasoning.consider_relevant_legal_principles.summary | length > 15 }} )
  @@assert( {{ this.reasoning.formulate_search_queries_strategy.summary | length > 10 }} )
  @@assert( {{ this.reasoning.specify_expected_information_strategy.summary | length > 10 }} )
  @@assert( {{ this.reasoning.ensure_comprehensive_coverage_strategy.summary | length > 10 }} )

  // Optional fields should be handled properly (can be null or have content)
  @@assert( {{ this.counter_arguments_or_nuances is not none or this.counter_arguments_or_nuances is none }} ) // Either populated or null is fine
}
