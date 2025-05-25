// ----- Comprehensive Test Cases for SynthesizeAllFindings -----

test SynthesizeZeroDocuments {
  functions [SynthesizeAllFindings]
  args {
    original_legal_question "What is the minimum wage in California?"
    analyzed_documents []
  }
  // Should still produce a synthesis even with no documents
  @@assert( {{ this.key_synthesized_topics | length >= 0 }} )
  @@assert( {{ this.unanswered_aspects | length > 0 }} ) // Should identify what couldn't be answered
  @@assert( {{ this.emerging_questions | length >= 0 }} )
  @@assert( {{ this.reasoning.analyze_legal_question.summary | length > 0 }} )
  @@assert( {{ this.reasoning.consider_relevant_legal_principles.summary | length > 0 }} )
}

test SynthesizeSingleDocument {
  functions [SynthesizeAllFindings]
  args {
    original_legal_question "What constitutes adverse employment action under Title VII?"
    analyzed_documents [
      {
        search_result_id "case_123"
        relevance_score 8
        confidence_score 7
        summary "The 9th Circuit held that lateral transfers can constitute adverse employment action if materially adverse to a reasonable employee."
        key_arguments_and_reasoning ["Burlington standard applies", "Material adversity test", "Reasonable employee perspective"]
        extracted_entities [
          { type "Case", name "Burlington N. & Santa Fe Ry. Co. v. White" },
          { type "Jurisdiction", name "9th Circuit" },
          { type "Legal Concept", name "adverse employment action" }
        ]
        extracted_quotes ["might have dissuaded a reasonable worker from making or supporting a charge of discrimination"]
        reasoning {
          analyze_legal_question { summary "Analysis of Title VII adverse action requirements" }
          consider_relevant_legal_principles { summary "Burlington standard and circuit interpretations" }
          formulate_search_queries_strategy { summary "Focus on employment discrimination cases" }
          specify_expected_information_strategy { summary "Look for definitional standards" }
          ensure_comprehensive_coverage_strategy { summary "Cover different circuits and fact patterns" }
        }
      }
    ]
  }
  @@assert( {{ this.key_synthesized_topics | length >= 1 }} )
  @@assert( {{ this.key_synthesized_topics | length <= 3 }} )
  // Check structure of synthesized topics
  @@assert( {{ this.key_synthesized_topics | selectattr("topic_title", "defined") | list | length == (this.key_synthesized_topics | length) }} )
  @@assert( {{ this.key_synthesized_topics | selectattr("synthesis", "defined") | list | length == (this.key_synthesized_topics | length) }} )
  @@assert( {{ this.key_synthesized_topics | selectattr("confidence_level", "defined") | list | length == (this.key_synthesized_topics | length) }} )
  @@assert( {{ this.key_synthesized_topics | selectattr("supporting_document_ids", "defined") | list | length == (this.key_synthesized_topics | length) }} )
  // Check that document ID is referenced
  @@assert( {{ (this.key_synthesized_topics | map(attribute="supporting_document_ids") | flatten | selectattr("equalto", "case_123") | list | length) > 0 }} )
  // Should have some synthesis content
  @@assert( {{ this.key_synthesized_topics[0].synthesis | length > 10 }} )
}

test SynthesizeConvergingDocuments {
  functions [SynthesizeAllFindings]
  args {
    original_legal_question "What is the statute of limitations for personal injury claims in California?"
    analyzed_documents [
      {
        search_result_id "statute_1"
        relevance_score 9
        confidence_score 8
        summary "California Code of Civil Procedure § 335.1 sets a 2-year statute of limitations for personal injury actions."
        key_arguments_and_reasoning ["Two-year limitation period", "Accrual upon discovery", "Personal injury defined broadly"]
        extracted_entities [
          { type "Statute", name "California Code of Civil Procedure § 335.1" },
          { type "Time Period", name "2 years" },
          { type "Legal Concept", name "statute of limitations" }
        ]
        extracted_quotes ["An action for assault, battery, or injury to, or for the death of, an individual caused by the wrongful act or neglect of another"]
        reasoning {
          analyze_legal_question { summary "Analysis of limitation periods for personal injury" }
          consider_relevant_legal_principles { summary "Discovery rule and accrual principles" }
          formulate_search_queries_strategy { summary "Focus on statutory provisions" }
          specify_expected_information_strategy { summary "Look for specific time limits" }
          ensure_comprehensive_coverage_strategy { summary "Cover various injury types" }
        }
      },
      {
        search_result_id "case_456"
        relevance_score 8
        confidence_score 7
        summary "Court confirmed that the 2-year statute applies to most personal injury claims, with discovery rule for latent injuries."
        key_arguments_and_reasoning ["Two-year rule confirmed", "Discovery rule exception", "Latent injury doctrine"]
        extracted_entities [
          { type "Case", name "Doe v. City of Los Angeles" },
          { type "Time Period", name "2 years" },
          { type "Legal Concept", name "discovery rule" }
        ]
        extracted_quotes ["The statute begins to run when the plaintiff discovers, or through reasonable diligence should have discovered, the injury"]
        reasoning {
          analyze_legal_question { summary "Case law interpretation of limitation periods" }
          consider_relevant_legal_principles { summary "Discovery rule application" }
          formulate_search_queries_strategy { summary "Focus on judicial interpretations" }
          specify_expected_information_strategy { summary "Look for exceptions and applications" }
          ensure_comprehensive_coverage_strategy { summary "Cover different fact patterns" }
        }
      }
    ]
  }
  @@assert( {{ this.key_synthesized_topics | length >= 1 }} )
  @@assert( {{ this.key_synthesized_topics | length <= 4 }} )
  // Should synthesize the convergent information about 2-year period
  @@assert( {{ (this.key_synthesized_topics | map(attribute="synthesis") | join(" ") | lower | regex_search("2.year|two.year")) != null }} )
  // Should reference both documents
  @@assert( {{ (this.key_synthesized_topics | map(attribute="supporting_document_ids") | flatten | selectattr("equalto", "statute_1") | list | length) > 0 }} )
  @@assert( {{ (this.key_synthesized_topics | map(attribute="supporting_document_ids") | flatten | selectattr("equalto", "case_456") | list | length) > 0 }} )
  // Should have high confidence due to convergent sources
  @@assert( {{ (this.key_synthesized_topics | selectattr("confidence_level", "ge", 7) | list | length) > 0 }} )
  // Fewer unanswered aspects since question is well-covered
  @@assert( {{ this.unanswered_aspects | length <= 2 }} )
}

test SynthesizeDivergingDocuments {
  functions [SynthesizeAllFindings]
  args {
    original_legal_question "What is the required notice period for employment termination?"
    analyzed_documents [
      {
        search_result_id "federal_law"
        relevance_score 7
        confidence_score 6
        summary "Federal WARN Act requires 60 days notice for mass layoffs but doesn't apply to individual terminations."
        key_arguments_and_reasoning ["WARN Act 60-day rule", "Mass layoff requirement", "Individual termination exemption"]
        extracted_entities [
          { type "Statute", name "WARN Act" },
          { type "Time Period", name "60 days" },
          { type "Legal Concept", name "mass layoff" }
        ]
        extracted_quotes ["60 calendar days advance written notice"]
        reasoning {
          analyze_legal_question { summary "Federal employment termination notice requirements" }
          consider_relevant_legal_principles { summary "WARN Act coverage and exceptions" }
          formulate_search_queries_strategy { summary "Focus on federal employment law" }
          specify_expected_information_strategy { summary "Look for notice requirements" }
          ensure_comprehensive_coverage_strategy { summary "Cover different termination scenarios" }
        }
      },
      {
        search_result_id "state_law"
        relevance_score 8
        confidence_score 7
        summary "California requires no advance notice for at-will employment termination, but final pay must be immediate."
        key_arguments_and_reasoning ["At-will employment doctrine", "No notice requirement", "Immediate final pay rule"]
        extracted_entities [
          { type "Jurisdiction", name "California" },
          { type "Legal Concept", name "at-will employment" },
          { type "Legal Concept", name "final pay" }
        ]
        extracted_quotes ["no advance notice is required for termination of at-will employees"]
        reasoning {
          analyze_legal_question { summary "State-specific termination notice requirements" }
          consider_relevant_legal_principles { summary "At-will employment principles" }
          formulate_search_queries_strategy { summary "Focus on state employment law" }
          specify_expected_information_strategy { summary "Look for notice and pay requirements" }
          ensure_comprehensive_coverage_strategy { summary "Cover state-specific rules" }
        }
      }
    ]
  }
  @@assert( {{ this.key_synthesized_topics | length >= 2 }} )
  @@assert( {{ this.key_synthesized_topics | length <= 5 }} )
  // Should address the divergent requirements (federal vs state, mass vs individual)
  @@assert( {{ (this.key_synthesized_topics | map(attribute="synthesis") | join(" ") | lower | regex_search("federal|state|california")) != null }} )
  @@assert( {{ (this.key_synthesized_topics | map(attribute="synthesis") | join(" ") | lower | regex_search("60.day|warn|at.will")) != null }} )
  // Should have emerging questions due to complexity
  @@assert( {{ this.emerging_questions | length >= 1 }} )
  // Might have moderate confidence due to divergent information
  @@assert( {{ (this.key_synthesized_topics | selectattr("confidence_level", "le", 8) | list | length) > 0 }} )
}

test SynthesizeMultipleAspects {
  functions [SynthesizeAllFindings]
  args {
    original_legal_question "What are the requirements for forming a valid contract?"
    analyzed_documents [
      {
        search_result_id "offer_doc"
        relevance_score 9
        confidence_score 8
        summary "A valid contract requires a clear offer that is definite and communicated to the offeree."
        key_arguments_and_reasoning ["Offer must be definite", "Communication required", "Intent to be bound"]
        extracted_entities [
          { type "Legal Concept", name "offer" },
          { type "Legal Concept", name "contract formation" }
        ]
        extracted_quotes ["An offer is a manifestation of willingness to enter into a bargain"]
        reasoning {
          analyze_legal_question { summary "Contract formation element analysis" }
          consider_relevant_legal_principles { summary "Offer requirements" }
          formulate_search_queries_strategy { summary "Focus on contract law elements" }
          specify_expected_information_strategy { summary "Look for formation requirements" }
          ensure_comprehensive_coverage_strategy { summary "Cover all contract elements" }
        }
      },
      {
        search_result_id "acceptance_doc"
        relevance_score 8
        confidence_score 7
        summary "Acceptance must be unqualified and communicated to the offeror to form a binding contract."
        key_arguments_and_reasoning ["Mirror image rule", "Communication of acceptance", "Qualified acceptance as counteroffer"]
        extracted_entities [
          { type "Legal Concept", name "acceptance" },
          { type "Legal Rule", name "mirror image rule" }
        ]
        extracted_quotes ["Acceptance must be a mirror image of the offer"]
        reasoning {
          analyze_legal_question { summary "Acceptance requirements for contract formation" }
          consider_relevant_legal_principles { summary "Mirror image rule and communication" }
          formulate_search_queries_strategy { summary "Focus on acceptance doctrine" }
          specify_expected_information_strategy { summary "Look for acceptance standards" }
          ensure_comprehensive_coverage_strategy { summary "Cover acceptance variations" }
        }
      },
      {
        search_result_id "consideration_doc"
        relevance_score 8
        confidence_score 8
        summary "Consideration requires a bargained-for exchange of legal value between the parties."
        key_arguments_and_reasoning ["Bargained-for exchange", "Legal value requirement", "Mutuality of obligation"]
        extracted_entities [
          { type "Legal Concept", name "consideration" },
          { type "Legal Concept", name "legal value" }
        ]
        extracted_quotes ["Consideration is a bargained-for exchange of legal value"]
        reasoning {
          analyze_legal_question { summary "Consideration requirements for valid contracts" }
          consider_relevant_legal_principles { summary "Bargain theory and legal value" }
          formulate_search_queries_strategy { summary "Focus on consideration doctrine" }
          specify_expected_information_strategy { summary "Look for consideration standards" }
          ensure_comprehensive_coverage_strategy { summary "Cover consideration types" }
        }
      }
    ]
  }
  @@assert( {{ this.key_synthesized_topics | length >= 3 }} )
  @@assert( {{ this.key_synthesized_topics | length <= 6 }} )
  // Should cover different aspects of contract formation
  @@assert( {{ (this.key_synthesized_topics | map(attribute="topic_title") | join(" ") | lower | regex_search("offer|acceptance|consideration")) != null }} )
  // Should have comprehensive synthesis addressing multiple elements
  @@assert( {{ (this.key_synthesized_topics | map(attribute="synthesis") | join(" ") | lower | regex_search("offer|acceptance|consideration")) != null }} )
  // Should have high confidence for well-established contract principles
  @@assert( {{ (this.key_synthesized_topics | selectattr("confidence_level", "ge", 6) | list | length) >= 2 }} )
  // Should have fewer unanswered aspects since multiple elements are covered
  @@assert( {{ this.unanswered_aspects | length <= 3 }} )
  // Each topic should reference appropriate documents
  @@assert( {{ (this.key_synthesized_topics | map(attribute="supporting_document_ids") | flatten | selectattr("equalto", "offer_doc") | list | length) > 0 }} )
  @@assert( {{ (this.key_synthesized_topics | map(attribute="supporting_document_ids") | flatten | selectattr("equalto", "acceptance_doc") | list | length) > 0 }} )
  @@assert( {{ (this.key_synthesized_topics | map(attribute="supporting_document_ids") | flatten | selectattr("equalto", "consideration_doc") | list | length) > 0 }} )
}

test SynthesizeWithLowRelevanceDocuments {
  functions [SynthesizeAllFindings]
  args {
    original_legal_question "What are the penalties for tax evasion?"
    analyzed_documents [
      {
        search_result_id "irrelevant_doc"
        relevance_score 2
        confidence_score 3
        summary "This document discusses corporate governance practices and has minimal relevance to tax evasion penalties."
        key_arguments_and_reasoning ["Corporate board duties", "Shareholder rights", "Governance best practices"]
        extracted_entities [
          { type "Legal Concept", name "corporate governance" },
          { type "Legal Concept", name "board duties" }
        ]
        extracted_quotes ["Directors owe fiduciary duties to the corporation"]
        reasoning {
          analyze_legal_question { summary "Limited relevance to tax evasion question" }
          consider_relevant_legal_principles { summary "Corporate law principles not applicable" }
          formulate_search_queries_strategy { summary "Document outside scope of question" }
          specify_expected_information_strategy { summary "No relevant tax information found" }
          ensure_comprehensive_coverage_strategy { summary "Document does not contribute to answer" }
        }
      }
    ]
  }
  // Should handle low-relevance documents gracefully
  @@assert( {{ this.key_synthesized_topics | length >= 0 }} )
  @@assert( {{ this.key_synthesized_topics | length <= 2 }} )
  // Should identify significant unanswered aspects
  @@assert( {{ this.unanswered_aspects | length >= 1 }} )
  // Should generate questions for better research
  @@assert( {{ this.emerging_questions | length >= 1 }} )
  // If topics are generated, they should have low confidence
  @@assert( {{ (this.key_synthesized_topics | selectattr("confidence_level", "ge", 6) | list | length) == 0 }} )
}