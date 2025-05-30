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
  @@assert( {{ this.suggested_queries_for_refinement != null and (this.suggested_queries_for_refinement | length > 0) }} )
  // document_ids_for_deeper_analysis should be null for NEW_QUERIES action
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
      unanswered_aspects []
      emerging_questions []
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
  @@assert( {{ not this.suggested_queries_for_refinement }} )
  // document_ids_for_deeper_analysis should be null for GENERATE_REPORT action
  // Assessment should reference the synthesis quality
  @@assert( {{ ("sufficient" in (this.assessment_summary | lower)) or ("comprehensive" in (this.assessment_summary | lower)) or ("adequate" in (this.assessment_summary | lower)) }} )
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
  @@assert( {{ this.suggested_queries_for_refinement != null and (this.suggested_queries_for_refinement | length > 0) }} )
  @@assert( {{ ("texas" in (this.suggested_queries_for_refinement | join(" ") | lower)) }} )
  // document_ids_for_deeper_analysis should be null for REFINE_QUERIES action
  // Assessment should identify the gaps
  @@assert( {{ ("texas" in (this.assessment_summary | lower)) or ("specific" in (this.assessment_summary | lower)) or ("jurisdiction" in (this.assessment_summary | lower)) }} )
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
  @@assert( {{ this.suggested_queries_for_refinement != null and (this.suggested_queries_for_refinement | length > 0) }} )
  @@assert( {{ ("new york" in (this.suggested_queries_for_refinement | join(" ") | lower)) }} )
  // document_ids_for_deeper_analysis should be null for NEW_QUERIES action
  // Assessment should identify ineffective current approach
  @@assert( {{ ("new" in (this.assessment_summary | lower)) or ("different" in (this.assessment_summary | lower)) or ("specific" in (this.assessment_summary | lower)) }} )
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
  @@assert( {{ this.document_ids_for_deeper_analysis != null and (this.document_ids_for_deeper_analysis | length > 0) }} )
  @@assert( {{ ("case_summary_123" in this.document_ids_for_deeper_analysis) }} )
  @@assert( {{ not this.suggested_queries_for_refinement }} ) // Focus on analysis, not new queries
  // Assessment should identify need for more detailed examination
  @@assert( {{ ("deeper" in (this.assessment_summary | lower)) or ("detail" in (this.assessment_summary | lower)) or ("analysis" in (this.assessment_summary | lower)) or ("examine" in (this.assessment_summary | lower)) }} )
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
  @@assert( {{ not this.suggested_queries_for_refinement }} )
  // document_ids_for_deeper_analysis should be null for REQUEST_HUMAN_REVIEW action
  // Assessment should identify complexity requiring human expertise
  @@assert( {{ ("complex" in (this.assessment_summary | lower)) or ("expert" in (this.assessment_summary | lower)) or ("human" in (this.assessment_summary | lower)) or ("specialized" in (this.assessment_summary | lower)) or ("review" in (this.assessment_summary | lower)) }} )
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
  @@assert( {{ ("extensive" in (this.assessment_summary | lower)) or ("multiple" in (this.assessment_summary | lower)) or ("previous" in (this.assessment_summary | lower)) or ("prior" in (this.assessment_summary | lower)) }} )
  // If not sufficient, should explain why despite extensive research
  @@assert( {{ this.is_sufficient == true or (("despite" in (this.assessment_summary | lower)) or ("although" in (this.assessment_summary | lower)) or ("extensive" in (this.assessment_summary | lower))) }} )
}

// NEW TEST: Live data scenario - Employment discrimination with comprehensive synthesis
test AssessLiveEmploymentDiscriminationResearch {
  functions [AssessResearchAndPlanNextSteps]
  args {
    original_legal_question "What constitutes 'adverse employment action' under Title VII discrimination law?"
    initial_queries_analysis {
      reasoning {
        analyze_legal_question { summary "The legal question is about what constitutes an 'adverse employment action' under Title VII. Key issues are: defining the term; identifying specific actions that qualify; and understanding any differing interpretations by courts." }
        consider_relevant_legal_principles { summary "Relevant legal principles include: statutory interpretation of Title VII; the role of the EEOC in enforcement; case law interpreting 'adverse employment action'; and the potential for varying interpretations across jurisdictions." }
        formulate_search_queries_strategy { summary "Search queries would use exact phrases and boolean operators. Examples: 'adverse employment action' AND 'Title VII'; 'adverse employment action' AND 'definition'." }
        specify_expected_information_strategy { summary "Each query is expected to yield: 1) Statutory definitions and interpretations from Title VII, 2) Examples of adverse employment actions from EEOC guidance, 3) Case law defining and interpreting the term 'adverse employment action'." }
        ensure_comprehensive_coverage_strategy { summary "The queries would be designed to cover all aspects of the legal question and avoid redundancy by: starting with broad searches and then refining them; using a combination of keywords and phrases." }
      }
      search_queries [
        {
          query_string "employment discrimination Title VII adverse action"
          expected_information ["adverse employment action definition", "Title VII cases", "discrimination law"]
        },
        {
          query_string "tangible employment action Title VII harassment"
          expected_information ["tangible employment action", "employer liability", "harassment defense"]
        }
      ]
    }
    current_synthesis {
      key_synthesized_topics [
        {
          topic_title "Definition and Scope of Adverse Employment Action"
          synthesis "The primary focus of the documents revolves around defining 'adverse employment action' under Title VII. The term is not explicitly defined in Title VII but is established through judicial interpretations. It highlights that discrimination is prohibited concerning the 'terms, conditions, or privileges of employment.' Examples of adverse actions include firing, demotion, pay cuts, failure to promote, and hiring. Some courts require a 'materially adverse consequence.'"
          confidence_score 9
          supporting_document_ids ["https://natlawreview.com/article/what-counts-adverse-employment-action-discrimination-and-retaliation-cases", "https://www.law.cornell.edu/wex/tangible_employment_action"]
        },
        {
          topic_title "Distinction between Adverse Employment Action and Tangible Employment Action"
          synthesis "A crucial divergence emerges between the concepts of 'adverse employment action' and 'tangible employment action'. Tangible employment action represents a subset, specifically a significant change, of adverse employment actions. Tangible employment actions, like hiring, firing, or significant benefit changes, are pivotal in determining employer liability, especially in cases of supervisor misconduct."
          confidence_score 8
          supporting_document_ids ["https://natlawreview.com/article/what-counts-adverse-employment-action-discrimination-and-retaliation-cases", "https://www.law.cornell.edu/wex/tangible_employment_action"]
        },
        {
          topic_title "Examples and Application of Adverse Employment Action"
          synthesis "Both documents provide examples of what constitutes adverse employment action. The EEOC lists firing, demotion, pay cuts, failure to promote, and hiring decisions as examples. Other examples include denial of a raise, loss of negotiated benefits, threats of discharge, and withholding promotions. The documents also provide examples of actions that do not constitute such actions, creating more contrast and guidance."
          confidence_score 9
          supporting_document_ids ["https://natlawreview.com/article/what-counts-adverse-employment-action-discrimination-and-retaliation-cases", "https://www.law.cornell.edu/wex/tangible_employment_action"]
        }
      ]
      unanswered_aspects ["Specific judicial standards or tests used by courts to determine 'materially adverse consequence' of an action", "Jurisdictional variations in how adverse employment action is interpreted"]
      emerging_questions ["What is the prevailing standard courts use to determine whether an action has a 'materially adverse consequence?'", "How do courts differentiate between actions considered merely annoying or inconvenient versus those with materially adverse consequences?"]
      reasoning {
        analyze_legal_question { summary "The legal question is about the definition of 'adverse employment action' under Title VII discrimination law. The key issues involve understanding the scope and range of actions covered by this term, and how it is determined in court." }
        consider_relevant_legal_principles { summary "Relevant legal principles include Title VII's prohibition against discrimination and court interpretations of 'adverse employment action.' The analysis should also consider the distinction between adverse employment action and tangible employment action." }
        formulate_search_queries_strategy { summary "Initial search queries will focus on the definition and examples of 'adverse employment action' under Title VII. Boolean operators (AND, OR) and exact phrase searching will be used." }
        specify_expected_information_strategy { summary "Each query will target specific types of information: statutes, case law, legal principles, and expert analysis. The search will expect to find definitions, examples, court precedents, and commentary on the legal standards." }
        ensure_comprehensive_coverage_strategy { summary "To ensure comprehensive coverage, the search will begin with broad queries and then narrow down to specific areas, such as the standards used to determine 'materially adverse consequence' and potential jurisdictional variations." }
      }
    }
  }
  @@assert( {{ this.is_sufficient == true }} )
  @@assert( {{ this.next_action == "GENERATE_REPORT" }} )
  @@assert( {{ this.assessment_summary | length > 20 }} )
  // Should recognize comprehensive coverage of the topic
  @@assert( {{ ("comprehensive" in (this.assessment_summary | lower)) or ("sufficient" in (this.assessment_summary | lower)) or ("adequate" in (this.assessment_summary | lower)) }} )
  // Should not suggest additional queries when sufficient
  @@assert( {{ not this.suggested_queries_for_refinement }} )
  @@assert( {{ not this.document_ids_for_deeper_analysis }} )
  // Should recognize high confidence in synthesis topics
  @@assert( {{ ("high confidence" in (this.assessment_summary | lower)) or ("strong" in (this.assessment_summary | lower)) or ("reliable" in (this.assessment_summary | lower)) }} )
}

// NEW TEST: Live data scenario - Patent law with some gaps requiring refinement
test AssessLivePatentResearchNeedsRefinement {
  functions [AssessResearchAndPlanNextSteps]
  args {
    original_legal_question "What are the requirements for a valid patent application under 35 U.S.C. § 112?"
    initial_queries_analysis {
      reasoning {
        analyze_legal_question { summary "The legal question focuses on the requirements for a valid patent application under 35 U.S.C. § 112. This involves identifying the specific elements that must be present in a patent application to meet the statutory requirements for patentability." }
        consider_relevant_legal_principles { summary "Relevant legal principles include statutory interpretation of 35 U.S.C. § 112, which addresses the specification requirements, as well as any relevant case law that interprets and applies this statute." }
        formulate_search_queries_strategy { summary "Given the focus on 35 U.S.C. § 112, the search query strategy would prioritize direct references to the statute and its specific subsections." }
        specify_expected_information_strategy { summary "The search queries are expected to yield information that precisely explains the different elements of 35 U.S.C. § 112, including the written description, enablement, best mode, and claims requirements." }
        ensure_comprehensive_coverage_strategy { summary "To ensure comprehensive coverage, the search strategy would begin with a broad search of 35 U.S.C. § 112, then narrow the focus by searching for each individual component." }
      }
      search_queries [
        {
          query_string "patent application requirements 35 USC 112 specification"
          expected_information ["patent specification requirements", "USPTO guidelines", "written description"]
        }
      ]
    }
    current_synthesis {
      key_synthesized_topics [
        {
          topic_title "Section 112 Requirements Overview"
          synthesis "Section 112 of the Patent Act, codified as 35 U.S.C. § 112, outlines the requirements for the specification of a patent application. The document explains the four key components: written description, enablement requirement, best mode requirement, and claims. However, the synthesis lacks detailed case law analysis and practical application examples."
          confidence_score 7
          supporting_document_ids ["https://vernalaw.com/why-is-section-112-of-the-patent-act-important/"]
        }
      ]
      unanswered_aspects ["Case law interpretations of each requirement", "Practical examples of compliant specifications", "Common rejection reasons under 35 U.S.C. § 112", "Recent changes in USPTO examination guidelines"]
      emerging_questions ["How do courts interpret the 'written description' requirement in practice?", "What are common pitfalls in drafting claims under Section 112?", "How has the America Invents Act affected best mode requirements?"]
      reasoning {
        analyze_legal_question { summary "The legal question focuses on the requirements for a valid patent application under 35 U.S.C. § 112. This involves identifying the specific elements that must be present in a patent application to meet the statutory requirements for patentability." }
        consider_relevant_legal_principles { summary "Relevant legal principles include statutory interpretation of 35 U.S.C. § 112, which addresses the specification requirements, as well as any relevant case law that interprets and applies this statute." }
        formulate_search_queries_strategy { summary "Given the focus on 35 U.S.C. § 112, the search query strategy would prioritize direct references to the statute and its specific subsections." }
        specify_expected_information_strategy { summary "The search queries are expected to yield information that precisely explains the different elements of 35 U.S.C. § 112, including the written description, enablement, best mode, and claims requirements." }
        ensure_comprehensive_coverage_strategy { summary "To ensure comprehensive coverage, the search strategy would begin with a broad search of 35 U.S.C. § 112, then narrow the focus by searching for each individual component." }
      }
    }
  }
  @@assert( {{ this.is_sufficient == false }} )
  @@assert( {{ this.next_action == "REFINE_QUERIES" }} )
  @@assert( {{ this.assessment_summary | length > 20 }} )
  // Should identify need for case law and practical examples
  @@assert( {{ ("case law" in (this.assessment_summary | lower)) or ("practical" in (this.assessment_summary | lower)) or ("examples" in (this.assessment_summary | lower)) }} )
  // Should provide refined queries targeting case law and applications
  @@assert( {{ this.suggested_queries_for_refinement != null and (this.suggested_queries_for_refinement | length > 0) }} )
  @@assert( {{ ("case" in (this.suggested_queries_for_refinement | join(" ") | lower)) or ("precedent" in (this.suggested_queries_for_refinement | join(" ") | lower)) }} )
  @@assert( {{ not this.document_ids_for_deeper_analysis }} )
  // Should recognize statutory coverage but need for judicial interpretation
  @@assert( {{ ("statutory" in (this.assessment_summary | lower)) or ("judicial" in (this.assessment_summary | lower)) or ("interpretation" in (this.assessment_summary | lower)) }} )
}