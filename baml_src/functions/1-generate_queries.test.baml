// ----- Comprehensive Test Cases for GenerateLegalSearchQueries -----

test SimpleLegalQuestion {
  functions [GenerateLegalSearchQueries]
  args {
    legal_question "What is the statute of limitations for breach of contract in California?"
  }
  // Assert on structure of DetailedReasoning
  @@assert( {{ this.reasoning.analyze_legal_question.summary | length > 10 }} )
  @@assert( {{ this.reasoning.consider_relevant_legal_principles.summary | length > 10 }} )
  @@assert( {{ this.reasoning.formulate_search_queries_strategy.summary | length > 10 }} )
  @@assert( {{ this.reasoning.specify_expected_information_strategy.summary | length > 10 }} )
  @@assert( {{ this.reasoning.ensure_comprehensive_coverage_strategy.summary | length > 10 }} )
  // Assert on quantity and structure of search queries
  @@assert( {{ this.search_queries | length >= 3 }} )
  @@assert( {{ this.search_queries | length <= 10 }} )
  // Check that query strings are not empty
  @@assert( {{ this.search_queries[0].query_string | length > 0 }} )
  @@assert( {{ this.search_queries[0].expected_information | length > 0 }} )
}

test ComplexLegalQuestion {
  functions [GenerateLegalSearchQueries]
  args {
    legal_question "In a multi-state corporate merger involving Delaware and New York entities, what are the fiduciary duties of directors during negotiations, considering both state laws and federal securities regulations, particularly regarding disclosure obligations to minority shareholders?"
  }
  @@assert( {{ this.reasoning.analyze_legal_question.summary | length > 20 }} )
  @@assert( {{ this.reasoning.consider_relevant_legal_principles.summary | length > 20 }} )
  // Complex questions should generate more queries to cover different aspects
  @@assert( {{ this.search_queries | length >= 5 }} )
  @@assert( {{ this.search_queries | length <= 12 }} )
  // Should cover multiple jurisdictions and legal areas
  // Should cover multiple jurisdictions and legal areas - check first few queries
  @@assert( {{ this.search_queries[0].query_string | length > 5 }} )
  @@assert( {{ this.search_queries[1].query_string | length > 5 }} )
}

test AmbiguousLegalQuestion {
  functions [GenerateLegalSearchQueries]
  args {
    legal_question "What are my rights in this situation?"
  }
  @@assert( {{ this.reasoning.analyze_legal_question.summary | length > 10 }} )
  // Should still generate queries despite ambiguity
  @@assert( {{ this.search_queries | length >= 2 }} )
  @@assert( {{ this.search_queries | length <= 8 }} )
  // Queries should attempt to clarify or cover broad legal concepts
  @@assert( {{ this.search_queries[0].query_string | length > 0 }} )
}

test JurisdictionSpecificQuestion {
  functions [GenerateLegalSearchQueries]
  args {
    legal_question "What are the requirements for adverse possession in Texas?"
  }
  @@assert( {{ this.reasoning.analyze_legal_question.summary | length > 10 }} )
  @@assert( {{ this.search_queries | length >= 3 }} )
  // Should include Texas-specific searches
  @@assert( {{ this.search_queries[0].query_string | length > 5 }} )
  @@assert( {{ this.search_queries[0].expected_information | length > 0 }} )
}

test BrazilianLegalQuestion {
  functions [GenerateLegalSearchQueries]
  args {
    legal_question "Qual o valor de danos morais comumente arbitrado pelos tribunais em casos que o consumidor ficou aproximadamente 72 horas sem energia elétrica?"
  }
  @@assert( {{ this.reasoning.analyze_legal_question.summary | length > 10 }} )
  @@assert( {{ this.search_queries | length >= 3 }} )
  @@assert( {{ this.search_queries | length <= 10 }} )
  // Should handle Portuguese language and Brazilian legal concepts
  @@assert( {{ this.search_queries[0].query_string | length > 5 }} )
  // Check that reasoning addresses the question appropriately
  @@assert( {{ this.reasoning.analyze_legal_question.summary | length > 10 }} )
}

test CriminalLawQuestion {
  functions [GenerateLegalSearchQueries]
  args {
    legal_question "What are the elements of first-degree murder in federal jurisdiction?"
  }
  @@assert( {{ this.reasoning.analyze_legal_question.summary | length > 10 }} )
  @@assert( {{ this.search_queries | length >= 3 }} )
  // Should focus on criminal law concepts
  @@assert( {{ this.search_queries[0].query_string | length > 5 }} )
  @@assert( {{ this.search_queries[0].expected_information | length > 0 }} )
}
