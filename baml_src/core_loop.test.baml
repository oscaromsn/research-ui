// ----- Comprehensive Test Cases for AssessResearchAndPlanNextSteps -----

test AssessmentWithNoSynthesis {
  functions [AssessResearchAndPlanNextSteps]
  args {
    original_legal_question "What is the statute of limitations for personal injury in California?"
    initial_queries_analysis {
      reasoning {
        analyze_legal_question { summary "Initial analysis of personal injury limitation question" }
        consider_relevant_legal_principles { summary "Identified statute of limitations principles" }
        formulate_search_queries_strategy { summary "Strategy for statutory and case law research" }
        specify_expected_information_strategy { summary "Expected California-specific limitation periods" }
        ensure_comprehensive_coverage_strategy { summary "Comprehensive coverage of limitation rules" }
      }
      search_queries [
        {
          query_string "California personal injury statute of limitations CCP 335.1"
          expected_information ["Statutory limitation period", "Accrual rules", "Discovery rule exceptions"]
        }
      ]
    }
    current_synthesis null
  }
  // First pass assessment should identify need for research
  @@assert( {{ this.is_sufficient == false }} )
  @@assert( {{ this.assessment_summary | length > 10 }} )
  @@assert( {{ this.next_action in ["NEW_QUERIES", "REFINE_QUERIES"] }} )
  // Should provide suggested queries for first research
  @@assert( {{ this.suggested_queries_for_refinement | length > 0 }} )
  @@assert( {{ this.document_ids_for_deeper_analysis | length == 0 }} ) // No docs to analyze yet
  @@assert( {{ this.reasoning.analyze_legal_question.summary | length > 0 }} )
  @@assert( {{ this.reasoning.consider_relevant_legal_principles.summary | length > 0 }} )
  @@assert( {{ this.reasoning.formulate_search_queries_strategy.summary | length > 0 }} )
}

test AssessmentSufficientForReport {
  functions [AssessResearchAndPlanNextSteps]
  args {
    original_legal_question "What is the statute of limitations for personal injury in California?"
    initial_queries_analysis {
      reasoning {
        analyze_legal_question { summary "Comprehensive analysis of personal injury limitation periods" }
        consider_relevant_legal_principles { summary "Accrual rules and discovery doctrine" }
        formulate_search_queries_strategy { summary "Statutory and case law research" }
        specify_expected_information_strategy { summary "Time limits and exceptions" }
        ensure_comprehensive_coverage_strategy { summary "Multiple sources and perspectives" }
      }
      search_queries [
        {
          query_string "California personal injury statute of limitations CCP 335.1"
          expected_information ["Statutory limitation period", "Accrual rules"]
        },
        {
          query_string "discovery rule personal injury California accrual"
          expected_information ["Discovery rule application", "Latent injury cases"]
        }
      ]
    }
    current_synthesis {
      key_synthesized_topics [
        {
          topic_title "California Personal Injury Statute of Limitations"
          synthesis "California Code of Civil Procedure § 335.1 establishes a 2-year statute of limitations for personal injury actions. The limitation period begins when the cause of action accrues, which is generally when the injury occurs. However, the discovery rule applies in cases where the injury is not immediately apparent, starting the clock when the plaintiff discovers or reasonably should have discovered the injury and its cause."
          confidence_score 9
          supporting_document_ids ["statute_335", "case_discovery_rule", "appellate_interpretation"]
        },
        {
          topic_title "Discovery Rule Application"
          synthesis "Courts apply the discovery rule to delay accrual of the statute of limitations until the plaintiff knows or should know of the injury and its wrongful cause. This rule is particularly important in medical malpractice, toxic exposure, and latent injury cases."
          confidence_score 8
          supporting_document_ids ["case_discovery_rule", "medical_malpractice_cases", "toxic_exposure_precedent"]
        }
      ]
      unanswered_aspects ["Tolling provisions for minors", "Specific exceptions for government claims"]
      emerging_questions ["How does the discovery rule apply to continuing treatment by the same physician?"]
      reasoning {
        analyze_legal_question { summary "Comprehensive analysis of limitation periods" }
        consider_relevant_legal_principles { summary "Accrual rules and discovery doctrine" }
        formulate_search_queries_strategy { summary "Statutory and case law research" }
        specify_expected_information_strategy { summary "Time limits and exceptions" }
        ensure_comprehensive_coverage_strategy { summary "Multiple sources and perspectives" }
      }
    }
  }
  @@assert( {{ this.is_sufficient == true }} )
  @@assert( {{ this.next_action == "GENERATE_REPORT" }} )
  @@assert( {{ this.assessment_summary | length > 10 }} )
  // Should not provide refinement suggestions when sufficient
  @@assert( {{ this.suggested_queries_for_refinement | length == 0 }} )
  @@assert( {{ this.document_ids_for_deeper_analysis | length == 0 }} )
  // Assessment should reference the synthesis quality
  @@assert( {{ this.assessment_summary | lower | regex_search("sufficient|comprehensive|adequate") != null }} )
}

test AssessmentNeedsRefinement {
  functions [AssessResearchAndPlanNextSteps]
  args {
    original_legal_question "What are the requirements for adverse possession in Texas?"
    initial_queries_analysis {
      reasoning {
        analyze_legal_question { summary "General adverse possession principles identified" }
        consider_relevant_legal_principles { summary "Common law elements found" }
        formulate_search_queries_strategy { summary "Broad search conducted" }
        specify_expected_information_strategy { summary "Texas-specific information lacking" }
        ensure_comprehensive_coverage_strategy { summary "Need jurisdiction-specific research" }
      }
      search_queries [
        {
          query_string "adverse possession elements requirements"
          expected_information ["General elements", "Common law principles"]
        },
        {
          query_string "adverse possession statute of limitations"
          expected_information ["Time periods", "Statutory requirements"]
        }
      ]
    }
    current_synthesis {
      key_synthesized_topics [
        {
          topic_title "Basic Adverse Possession Elements"
          synthesis "Adverse possession generally requires open, notorious, exclusive, and continuous possession for a statutory period. However, specific requirements may vary by jurisdiction."
          confidence_score 4
          supporting_document_ids ["general_law_overview"]
        }
      ]
      unanswered_aspects ["Texas-specific statutory requirements", "Required time period in Texas", "Good faith vs. bad faith requirements", "Tacking provisions", "Payment of taxes requirement"]
      emerging_questions ["What is the exact statutory period in Texas?", "Are there different rules for rural vs. urban property?", "What constitutes 'open and notorious' use in Texas?"]
      reasoning {
        analyze_legal_question { summary "General adverse possession principles identified" }
        consider_relevant_legal_principles { summary "Common law elements found" }
        formulate_search_queries_strategy { summary "Broad search conducted" }
        specify_expected_information_strategy { summary "Texas-specific information lacking" }
        ensure_comprehensive_coverage_strategy { summary "Need jurisdiction-specific research" }
      }
    }
  }
  @@assert( {{ this.is_sufficient == false }} )
  @@assert( {{ this.next_action == "REFINE_QUERIES" }} )
  @@assert( {{ this.assessment_summary | length > 10 }} )
  // Should provide Texas-specific refinement suggestions
  @@assert( {{ this.suggested_queries_for_refinement | length > 0 }} )
  @@assert( {{ (this.suggested_queries_for_refinement | join(" ") | lower | regex_search("texas")) != null }} )
  @@assert( {{ this.document_ids_for_deeper_analysis | length == 0 }} )
  // Assessment should identify the gaps
  @@assert( {{ this.assessment_summary | lower | regex_search("texas|specific|jurisdiction") != null }} )
}

test AssessmentNeedsNewQueries {
  functions [AssessResearchAndPlanNextSteps]
  args {
    original_legal_question "What are the elements of a valid prenuptial agreement in New York?"
    initial_queries_analysis {
      reasoning {
        analyze_legal_question { summary "Basic contract law principles identified" }
        consider_relevant_legal_principles { summary "General formation requirements found" }
        formulate_search_queries_strategy { summary "Initial search too broad" }
        specify_expected_information_strategy { summary "State-specific requirements needed" }
        ensure_comprehensive_coverage_strategy { summary "Current queries ineffective for jurisdiction" }
      }
      search_queries [
        {
          query_string "prenuptial agreement requirements contract law"
          expected_information ["General contract principles", "Formation requirements"]
        },
        {
          query_string "prenup validity contract formation"
          expected_information ["Validity standards", "Formation elements"]
        }
      ]
    }
    current_synthesis {
      key_synthesized_topics [
        {
          topic_title "General Contract Principles"
          synthesis "Prenuptial agreements are contracts and must meet basic contract formation requirements including offer, acceptance, and consideration."
          confidence_score 6
          supporting_document_ids ["general_contract_law"]
        }
      ]
      unanswered_aspects ["New York specific statutory requirements", "Financial disclosure requirements", "Independent counsel requirements", "Unconscionability standards", "Property division restrictions"]
      emerging_questions ["What are the formal execution requirements in New York?", "Are there mandatory waiting periods?", "What disclosures must be made?"]
      reasoning {
        analyze_legal_question { summary "Basic contract law principles identified" }
        consider_relevant_legal_principles { summary "General formation requirements found" }
        formulate_search_queries_strategy { summary "Initial search too broad" }
        specify_expected_information_strategy { summary "State-specific requirements needed" }
        ensure_comprehensive_coverage_strategy { summary "Current queries ineffective for jurisdiction" }
      }
    }
  }
  @@assert( {{ this.is_sufficient == false }} )
  @@assert( {{ this.next_action == "NEW_QUERIES" }} )
  @@assert( {{ this.assessment_summary | length > 10 }} )
  // Should suggest completely new query approach
  @@assert( {{ this.suggested_queries_for_refinement | length > 0 }} )
  @@assert( {{ (this.suggested_queries_for_refinement | join(" ") | lower | regex_search("new york")) != null }} )
  @@assert( {{ this.document_ids_for_deeper_analysis | length == 0 }} )
  // Assessment should identify ineffective current approach
  @@assert( {{ this.assessment_summary | lower | regex_search("new|different|specific") != null }} )
}

test AssessmentNeedsDeeperAnalysis {
  functions [AssessResearchAndPlanNextSteps]
  args {
    original_legal_question "What is the standard for attorney-client privilege waiver in federal court?"
    initial_queries_analysis {
      reasoning {
        analyze_legal_question { summary "Privilege waiver concept identified" }
        consider_relevant_legal_principles { summary "General waiver principles found" }
        formulate_search_queries_strategy { summary "Located relevant documents" }
        specify_expected_information_strategy { summary "Need detailed analysis of standards" }
        ensure_comprehensive_coverage_strategy { summary "Current documents lack sufficient detail" }
      }
      search_queries [
        {
          query_string "attorney client privilege waiver federal court"
          expected_information ["Federal waiver standards", "Court interpretations"]
        },
        {
          query_string "privilege waiver inadvertent disclosure"
          expected_information ["Inadvertent disclosure rules", "Protective measures"]
        }
      ]
    }
    current_synthesis {
      key_synthesized_topics [
        {
          topic_title "Privilege Waiver Standards"
          synthesis "Federal courts apply various tests for privilege waiver, but documents provide only surface-level summaries without detailed analysis of the controlling standards."
          confidence_score 3
          supporting_document_ids ["case_summary_123", "brief_overview_456", "practice_guide_789"]
        }
      ]
      unanswered_aspects ["Specific test elements", "Subject matter waiver scope", "Inadvertent disclosure standards", "Claw-back provisions effectiveness"]
      emerging_questions ["What are the exact elements of the controlling federal test?", "How do courts determine scope of subject matter waiver?"]
      reasoning {
        analyze_legal_question { summary "Privilege waiver concept identified" }
        consider_relevant_legal_principles { summary "General waiver principles found" }
        formulate_search_queries_strategy { summary "Located relevant documents" }
        specify_expected_information_strategy { summary "Need detailed analysis of standards" }
        ensure_comprehensive_coverage_strategy { summary "Current documents lack sufficient detail" }
      }
    }
  }
  @@assert( {{ this.is_sufficient == false }} )
  @@assert( {{ this.next_action == "DEEPER_ANALYSIS_OF_EXISTING_DOCS" }} )
  @@assert( {{ this.assessment_summary | length > 10 }} )
  // Should identify specific documents for deeper analysis
  @@assert( {{ this.document_ids_for_deeper_analysis | length > 0 }} )
  @@assert( {{ (this.document_ids_for_deeper_analysis | selectattr("equalto", "case_summary_123") | list | length) > 0 }} )
  @@assert( {{ this.suggested_queries_for_refinement | length == 0 }} ) // Focus on analysis, not new queries
  // Assessment should identify need for more detailed examination
  @@assert( {{ this.assessment_summary | lower | regex_search("deeper|detail|analysis|examine") != null }} )
}

test AssessmentRequiresHumanReview {
  functions [AssessResearchAndPlanNextSteps]
  args {
    original_legal_question "How should we structure this complex international joint venture to minimize tax exposure while ensuring regulatory compliance across multiple jurisdictions?"
    initial_queries_analysis {
      reasoning {
        analyze_legal_question { summary "Highly complex multi-jurisdictional question" }
        consider_relevant_legal_principles { summary "Multiple conflicting legal frameworks" }
        formulate_search_queries_strategy { summary "Research reveals complexity beyond automated analysis" }
        specify_expected_information_strategy { summary "Requires specialized expertise" }
        ensure_comprehensive_coverage_strategy { summary "Automated research insufficient for strategic decisions" }
      }
      search_queries [
        {
          query_string "international joint venture tax structure"
          expected_information ["Tax structuring options", "Cross-border implications"]
        },
        {
          query_string "cross border regulatory compliance"
          expected_information ["Regulatory frameworks", "Compliance requirements"]
        }
      ]
    }
    current_synthesis {
      key_synthesized_topics [
        {
          topic_title "International Tax Considerations"
          synthesis "Tax implications vary significantly across jurisdictions with conflicting requirements and uncertain regulatory interpretations."
          confidence_score 2
          supporting_document_ids ["tax_guide_intl", "conflicting_regs"]
        },
        {
          topic_title "Regulatory Compliance Issues"
          synthesis "Multiple regulatory frameworks apply with potentially conflicting requirements that may require specialized analysis."
          confidence_score 2
          supporting_document_ids ["reg_framework_a", "reg_framework_b"]
        }
      ]
      unanswered_aspects ["Specific jurisdictional requirements", "Tax treaty implications", "Regulatory approval processes", "Compliance coordination mechanisms"]
      emerging_questions ["Which jurisdiction should be primary?", "How do conflicting regulations get resolved?", "What are the optimal structuring alternatives?"]
      reasoning {
        analyze_legal_question { summary "Highly complex multi-jurisdictional question" }
        consider_relevant_legal_principles { summary "Multiple conflicting legal frameworks" }
        formulate_search_queries_strategy { summary "Research reveals complexity beyond automated analysis" }
        specify_expected_information_strategy { summary "Requires specialized expertise" }
        ensure_comprehensive_coverage_strategy { summary "Automated research insufficient for strategic decisions" }
      }
    }
  }
  @@assert( {{ this.is_sufficient == false }} )
  @@assert( {{ this.next_action == "REQUEST_HUMAN_REVIEW" }} )
  @@assert( {{ this.assessment_summary | length > 10 }} )
  // Should not provide additional queries or analysis suggestions
  @@assert( {{ this.suggested_queries_for_refinement | length == 0 }} )
  @@assert( {{ this.document_ids_for_deeper_analysis | length == 0 }} )
  // Assessment should identify complexity requiring human expertise
  @@assert( {{ this.assessment_summary | lower | regex_search("complex|expert|human|specialized|review") != null }} )
}

test AssessmentWithExtensiveQueryHistory {
  functions [AssessResearchAndPlanNextSteps]
  args {
    original_legal_question "What are the bankruptcy exemptions available to individuals in Florida?"
    initial_queries_analysis {
      reasoning {
        analyze_legal_question { summary "Partial coverage of exemption types" }
        consider_relevant_legal_principles { summary "Federal and state exemption interplay" }
        formulate_search_queries_strategy { summary "Homestead focus but missing other categories" }
        specify_expected_information_strategy { summary "Need comprehensive exemption catalog" }
        ensure_comprehensive_coverage_strategy { summary "Current research incomplete" }
      }
      search_queries [
        {
          query_string "Florida bankruptcy exemptions individual debtor"
          expected_information ["Available exemptions", "Individual debtor rights"]
        },
        {
          query_string "Florida homestead exemption bankruptcy"
          expected_information ["Homestead protections", "Property exemptions"]
        }
      ]
    }
    current_synthesis {
      key_synthesized_topics [
        {
          topic_title "Florida Homestead Exemption"
          synthesis "Florida provides unlimited homestead exemption for primary residence, subject to certain acreage limitations."
          confidence_score 7
          supporting_document_ids ["fl_const_homestead", "bankruptcy_code_522"]
        }
      ]
      unanswered_aspects ["Personal property exemptions", "Wage exemptions", "Retirement account protections", "Vehicle exemptions"]
      emerging_questions ["What personal property can be exempted?", "Are there income limitations on exemptions?"]
      reasoning {
        analyze_legal_question { summary "Partial coverage of exemption types" }
        consider_relevant_legal_principles { summary "Federal and state exemption interplay" }
        formulate_search_queries_strategy { summary "Homestead focus but missing other categories" }
        specify_expected_information_strategy { summary "Need comprehensive exemption catalog" }
        ensure_comprehensive_coverage_strategy { summary "Current research incomplete" }
      }
    }
  }
  // With extensive query history, should either be sufficient or need human review
  @@assert( {{ this.next_action in ["GENERATE_REPORT", "REQUEST_HUMAN_REVIEW", "DEEPER_ANALYSIS_OF_EXISTING_DOCS"] }} )
  @@assert( {{ this.assessment_summary | length > 10 }} )
  // Should recognize extensive prior research effort
  @@assert( {{ this.assessment_summary | lower | regex_search("extensive|multiple|previous|prior") != null }} )
  // If not sufficient, should explain why despite extensive research
  @@assert( {{ this.is_sufficient == true or (this.assessment_summary | lower | regex_search("despite|although|extensive") != null) }} )
}