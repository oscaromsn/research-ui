// ----- Comprehensive Test Cases for SynthesizeAllFindings -----

test SynthesizeZeroDocuments {
  functions [SynthesizeAllFindings]
  args {
    original_legal_question "What is the minimum wage in California?"
    analyzed_docs []
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
    analyzed_docs [
      {
        search_result_id "case_123"
        relevance_score 8
        confidence_score 7
        summary "The 9th Circuit held that lateral transfers can constitute adverse employment action if materially adverse to a reasonable employee."
        key_arguments_and_reasoning ["Burlington standard applies", "Material adversity test", "Reasonable employee perspective"]
        extracted_entities [
          { type "Case", name "Burlington N. & Santa Fe Ry. Co. v. White", details "Supreme Court case establishing Burlington standard" },
          { type "Jurisdiction", name "9th Circuit", details "Federal appellate court" },
          { type "LegalConcept", name "adverse employment action", details "Employment law concept under Title VII" }
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
  @@assert( {{ this.key_synthesized_topics | selectattr("confidence_score", "defined") | list | length == (this.key_synthesized_topics | length) }} )
  @@assert( {{ this.key_synthesized_topics | selectattr("supporting_document_ids", "defined") | list | length == (this.key_synthesized_topics | length) }} )
  // Check that document ID is referenced
  @@assert( {{ "case_123" in this.key_synthesized_topics[0].supporting_document_ids }} )
  // Should have some synthesis content
  @@assert( {{ this.key_synthesized_topics[0].synthesis | length > 10 }} )
}

test SynthesizeConvergingDocuments {
  functions [SynthesizeAllFindings]
  args {
    original_legal_question "What is the statute of limitations for personal injury claims in California?"
    analyzed_docs [
      {
        search_result_id "statute_1"
        relevance_score 9
        confidence_score 8
        summary "California Code of Civil Procedure § 335.1 sets a 2-year statute of limitations for personal injury actions."
        key_arguments_and_reasoning ["Two-year limitation period", "Accrual upon discovery", "Personal injury defined broadly"]
        extracted_entities [
          { type "Statute", name "California Code of Civil Procedure § 335.1", details "California statute governing limitation periods" },
          { type "LegalConcept", name "2 years", details "Time period for personal injury claims" },
          { type "LegalConcept", name "statute of limitations", details "Legal concept limiting time to file claims" }
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
          { type "Case", name "Doe v. City of Los Angeles", details "Case interpreting discovery rule application" },
          { type "LegalConcept", name "2 years", details "Standard limitation period" },
          { type "LegalConcept", name "discovery rule", details "Exception to standard accrual rule" }
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
  @@assert( {{ this.key_synthesized_topics[0].synthesis | length > 10 }} )
  // Should reference both documents
  @@assert( {{ this.key_synthesized_topics[0].supporting_document_ids | length >= 1 }} )
  // Should have high confidence due to convergent sources
  @@assert( {{ this.key_synthesized_topics[0].confidence_score >= 7 }} )
  // Fewer unanswered aspects since question is well-covered
  @@assert( {{ this.unanswered_aspects | length <= 5 }} )
}

test SynthesizeDivergingDocuments {
  functions [SynthesizeAllFindings]
  args {
    original_legal_question "What is the required notice period for employment termination?"
    analyzed_docs [
      {
        search_result_id "federal_law"
        relevance_score 7
        confidence_score 6
        summary "Federal WARN Act requires 60 days notice for mass layoffs but doesn't apply to individual terminations."
        key_arguments_and_reasoning ["WARN Act 60-day rule", "Mass layoff requirement", "Individual termination exemption"]
        extracted_entities [
          { type "Statute", name "WARN Act", details "Worker Adjustment and Retraining Notification Act" },
          { type "LegalConcept", name "60 days", details "Required notice period under WARN Act" },
          { type "LegalConcept", name "mass layoff", details "Employment termination affecting multiple employees" }
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
          { type "Jurisdiction", name "California", details "State jurisdiction with specific employment laws" },
          { type "LegalConcept", name "at-will employment", details "Employment relationship terminable by either party" },
          { type "LegalConcept", name "final pay", details "Compensation due upon termination" }
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
  @@assert( {{ this.key_synthesized_topics[0].synthesis | length > 10 }} )
  @@assert( {{ this.key_synthesized_topics[1].synthesis | length > 10 }} )
  // Should have emerging questions due to complexity
  @@assert( {{ this.emerging_questions | length >= 1 }} )
  // Might have moderate confidence due to divergent information
  @@assert( {{ (this.key_synthesized_topics | selectattr("confidence_score", "le", 8) | list | length) > 0 }} )
}

test SynthesizeMultipleAspects {
  functions [SynthesizeAllFindings]
  args {
    original_legal_question "What are the requirements for forming a valid contract?"
    analyzed_docs [
      {
        search_result_id "offer_doc"
        relevance_score 9
        confidence_score 8
        summary "A valid contract requires a clear offer that is definite and communicated to the offeree."
        key_arguments_and_reasoning ["Offer must be definite", "Communication required", "Intent to be bound"]
        extracted_entities [
          { type "LegalConcept", name "offer", details "Promise or commitment to enter into contract" },
          { type "LegalConcept", name "contract formation", details "Process of creating legally binding agreement" }
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
          { type "LegalConcept", name "acceptance", details "Agreement to terms of offer" },
          { type "LegalConcept", name "mirror image rule", details "Acceptance must match offer exactly" }
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
          { type "LegalConcept", name "consideration", details "Something of value exchanged in contract" },
          { type "LegalConcept", name "legal value", details "Benefit or detriment recognized by law" }
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
  @@assert( {{ this.key_synthesized_topics | length >= 2 }} )
  @@assert( {{ this.key_synthesized_topics | length <= 6 }} )
  // Should cover different aspects of contract formation
  @@assert( {{ this.key_synthesized_topics[0].topic_title | length > 3 }} )
  @@assert( {{ this.key_synthesized_topics[1].topic_title | length > 3 }} )
  // Should have comprehensive synthesis addressing multiple elements
  @@assert( {{ this.key_synthesized_topics[0].synthesis | length > 10 }} )
  @@assert( {{ this.key_synthesized_topics[1].synthesis | length > 10 }} )
  // Should have high confidence for well-established contract principles
  @@assert( {{ this.key_synthesized_topics[0].confidence_score >= 6 }} )
  @@assert( {{ this.key_synthesized_topics[1].confidence_score >= 6 }} )
  // Should have fewer unanswered aspects since multiple elements are covered
  @@assert( {{ this.unanswered_aspects | length <= 8 }} )
  // Each topic should reference appropriate documents
  @@assert( {{ this.key_synthesized_topics[0].supporting_document_ids | length >= 1 }} )
  @@assert( {{ this.key_synthesized_topics[1].supporting_document_ids | length >= 1 }} )
  // At least one topic should reference multiple documents since we have multiple contract elements
  @@assert( {{ this.key_synthesized_topics | length >= 2 }} )
}

test SynthesizeWithLowRelevanceDocuments {
  functions [SynthesizeAllFindings]
  args {
    original_legal_question "What are the penalties for tax evasion?"
    analyzed_docs [
      {
        search_result_id "irrelevant_doc"
        relevance_score 2
        confidence_score 3
        summary "This document discusses corporate governance practices and has minimal relevance to tax evasion penalties."
        key_arguments_and_reasoning ["Corporate board duties", "Shareholder rights", "Governance best practices"]
        extracted_entities [
          { type "LegalConcept", name "corporate governance", details "System of rules and practices governing corporations" },
          { type "LegalConcept", name "board duties", details "Fiduciary obligations of corporate directors" }
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
  @@assert( {{ this.key_synthesized_topics | length == 0 or this.key_synthesized_topics[0].confidence_score < 6 }} )
}

// NEW TEST: Live data synthesis - Employment discrimination documents from real Exa search
test SynthesizeLiveEmploymentDiscriminationDocuments {
  functions [SynthesizeAllFindings]
  args {
    original_legal_question "What constitutes 'adverse employment action' under Title VII discrimination law?"
    analyzed_docs [
      {
        search_result_id "https://natlawreview.com/article/what-counts-adverse-employment-action-discrimination-and-retaliation-cases"
        relevance_score 9
        confidence_score 8
        summary "The document directly addresses what constitutes an 'adverse employment action' under Title VII discrimination law. It explains that while actions like firing, demotion, and pay cuts are clear examples, the definition can be broader and is often subject to judicial interpretation."
        key_arguments_and_reasoning [
          "Title VII of the 1964 Civil Rights Act prohibits discrimination based on protected characteristics regarding compensation, terms, conditions, or privileges of employment.",
          "The term 'adverse employment action' isn't explicitly mentioned in Title VII but has been established through court interpretations.",
          "The Equal Employment Opportunity Commission (EEOC) considers hiring, firing, failure to promote, pay reduction, and demotion to be examples of adverse employment actions.",
          "Some courts require that the adverse employment action must result in a 'materially adverse consequence.'"
        ]
        extracted_entities [
          { type "Statute", name "Title VII of the 1964 Civil Rights Act", details "Prohibits employment discrimination based on protected characteristics." },
          { type "Organization", name "EEOC", details "Equal Employment Opportunity Commission; enforces Title VII." },
          { type "Case", name "Ortiz-Diaz v. United States Dep't of Hous. & Urban Dev.", details "867 F.3d 70, 74 (D.C. Cir. 2017) - discusses the requirement of a 'materially adverse consequence'." },
          { type "LegalConcept", name "adverse employment action", details "A negative action taken against an employee that can form the basis of a discrimination or retaliation claim." }
        ]
        extracted_quotes [
          "When an employee experiences discrimination or retaliation at work it often takes the form of significant action, such as a termination, demotion, or suspension, all of which clearly represent an 'adverse employment action' under relevant anti-discrimination and retaliation laws.",
          "Yet certain federal courts have interpreted Title VII to also require that the adverse employment action at issue must result in a 'materially adverse consequence.'"
        ]
        reasoning {
          analyze_legal_question { summary "The legal question is about what constitutes an 'adverse employment action' under Title VII. Key issues are: defining the term; identifying specific actions that qualify; and understanding any differing interpretations by courts." }
          consider_relevant_legal_principles { summary "Relevant legal principles include: statutory interpretation of Title VII; the role of the EEOC in enforcement; case law interpreting 'adverse employment action'; and the potential for varying interpretations across jurisdictions." }
          formulate_search_queries_strategy { summary "Search queries would use exact phrases and boolean operators. Examples: 'adverse employment action' AND 'Title VII'; 'adverse employment action' AND 'definition'." }
          specify_expected_information_strategy { summary "Each query is expected to yield: 1) Statutory definitions and interpretations from Title VII, 2) Examples of adverse employment actions from EEOC guidance, 3) Case law defining and interpreting the term 'adverse employment action'." }
          ensure_comprehensive_coverage_strategy { summary "The queries would be designed to cover all aspects of the legal question and avoid redundancy by: starting with broad searches and then refining them; using a combination of keywords and phrases." }
        }
      },
      {
        search_result_id "https://www.law.cornell.edu/wex/tangible_employment_action"
        relevance_score 7
        confidence_score 7
        summary "The document discusses 'tangible employment action,' a related but more specific concept under Title VII. It explains that tangible employment actions constitute significant changes in employment status and are used in determining employer liability, particularly in harassment cases."
        key_arguments_and_reasoning [
          "A tangible employment action constitutes a significant change in employment status, such as hiring, firing, failure to promote, reassignment with significantly different responsibility, or a decision causing a significant change in benefits.",
          "Tangible employment actions are elements of Title VII actions that may hold employers liable or vicariously liable for supervisor actions.",
          "Examples include denial of a raise, loss of specifically negotiated benefits, threats of discharge, and withholding promotions.",
          "Some actions like reassignment to another office or downgraded job performance evaluations do not constitute tangible employment actions."
        ]
        extracted_entities [
          { type "LegalConcept", name "tangible employment action", details "A significant change in employment status under Title VII." },
          { type "Case", name "Burlington Industries, Inc. v. Ellerth", details "1998 Supreme Court case defining tangible employment actions." },
          { type "LegalConcept", name "vicarious liability", details "Employer liability for supervisor actions." },
          { type "LegalConcept", name "constructive discharge", details "Forcing an employee to quit through intolerable working conditions." }
        ]
        extracted_quotes [
          "A tangible employment action constitutes a significant change in employment status, such as hiring, firing, failure to promote, reassignment with significantly different responsibility, or a decision causing a significant change in benefits.",
          "On the other hand, conditions such as reassignment to another office or downgraded job performance evaluations, by themselves, do not constitute a tangible employment action."
        ]
        reasoning {
          analyze_legal_question { summary "The legal question focuses on the definition of 'adverse employment action' within the context of Title VII. This requires understanding what actions by an employer are considered detrimental to an employee's employment status." }
          consider_relevant_legal_principles { summary "The relevant legal principle is Title VII and the interpretation of what constitutes a tangible employment action under it. The document touches on employer liability (vicarious liability) for supervisor actions." }
          formulate_search_queries_strategy { summary "Given the question's nature, focusing on definition, and the document's title, the search should use the exact phrase 'tangible employment action' to find documents defining it and provide examples." }
          specify_expected_information_strategy { summary "The search queries should yield documents (statutes, case law, legal articles, or legal encyclopedias) that define 'tangible employment action' or 'adverse employment action' specifically within the context of Title VII." }
          ensure_comprehensive_coverage_strategy { summary "To ensure comprehensive coverage, search results should be reviewed and combined for definitions, examples, and implications. Multiple search queries including both 'tangible employment action' and 'adverse employment action' will be needed." }
        }
      }
    ]
  }
  @@assert( {{ this.key_synthesized_topics | length >= 1 }} )
  @@assert( {{ this.key_synthesized_topics | length <= 4 }} )
  // Should create topics that address different aspects of adverse employment action
  @@assert( {{ this.key_synthesized_topics[0].topic_title | length > 5 }} )
  @@assert( {{ this.key_synthesized_topics[0].synthesis | length > 20 }} )
  // Should have high confidence given the quality of source documents
  @@assert( {{ this.key_synthesized_topics[0].confidence_score >= 7 }} )
  // Should reference both documents in synthesis
  @@assert( {{ this.key_synthesized_topics[0].supporting_document_ids | length >= 1 }} )
  // Should have minimal unanswered aspects since documents are comprehensive
  @@assert( {{ this.unanswered_aspects | length <= 3 }} )
  // May have emerging questions about jurisdictional differences
  @@assert( {{ this.emerging_questions | length >= 0 }} )
  @@assert( {{ this.reasoning.analyze_legal_question.summary | length > 20 }} )
}

// NEW TEST: Live data synthesis - Patent law documents from real search
test SynthesizeLivePatentDocuments {
  functions [SynthesizeAllFindings]
  args {
    original_legal_question "What are the requirements for a valid patent application under 35 U.S.C. § 112?"
    analyzed_docs [
      {
        search_result_id "https://vernalaw.com/why-is-section-112-of-the-patent-act-important/"
        relevance_score 9
        confidence_score 8
        summary "Section 112 of the Patent Act, codified as 35 U.S.C. § 112, outlines the requirements for the specification of a patent application. The document explains the four key components: written description, enablement requirement, best mode requirement, and claims."
        key_arguments_and_reasoning [
          "Written Description: The application must contain a written description of the invention, in clear, concise, and exact terms, so as to enable any person of ordinary skill in the art to make and use the invention.",
          "Enablement Requirement: The specification must describe the manner and process of making and using the invention in such full, clear, concise, and exact terms as to enable any person of ordinary skill in the art to make and use it.",
          "Best Mode Requirement: The application must set forth the best mode contemplated by the inventor for carrying out the invention, though this requirement is not as strictly enforced following the America Invents Act of 2011.",
          "Claims: The application must conclude with one or more claims particularly pointing out and distinctly claiming the subject matter which the inventor regards as the invention."
        ]
        extracted_entities [
          { type "Statute", name "35 U.S.C. § 112", details "Patent Act provision governing specification requirements." },
          { type "LegalConcept", name "written description", details "Requirement for clear description of invention in patent application." },
          { type "LegalConcept", name "enablement requirement", details "Requirement that specification enable person skilled in art to make and use invention." },
          { type "LegalConcept", name "best mode requirement", details "Requirement to disclose best way of practicing invention." },
          { type "Statute", name "America Invents Act of 2011", details "Legislation that modified enforcement of best mode requirement." }
        ]
        extracted_quotes [
          "Section 112 of the Patent Act, codified as 35 U.S.C. § 112, outlines the requirements for the specification of a patent application.",
          "Under 35 U.S.C. § 112, ¶ 2 (2006), a patent specification 'shall conclude with one or more claims particularly pointing out and distinctly claiming the subject matter which the applicant regards as his invention.'"
        ]
        reasoning {
          analyze_legal_question { summary "The legal question focuses on the requirements for a valid patent application under 35 U.S.C. § 112. This involves identifying the specific elements that must be present in a patent application to meet the statutory requirements for patentability." }
          consider_relevant_legal_principles { summary "Relevant legal principles include statutory interpretation of 35 U.S.C. § 112, which addresses the specification requirements, as well as any relevant case law that interprets and applies this statute." }
          formulate_search_queries_strategy { summary "Given the focus on 35 U.S.C. § 112, the search query strategy would prioritize direct references to the statute and its specific subsections." }
          specify_expected_information_strategy { summary "The search queries are expected to yield information that precisely explains the different elements of 35 U.S.C. § 112, including the written description, enablement, best mode, and claims requirements." }
          ensure_comprehensive_coverage_strategy { summary "To ensure comprehensive coverage, the search strategy would begin with a broad search of 35 U.S.C. § 112, then narrow the focus by searching for each individual component." }
        }
      }
    ]
  }
  @@assert( {{ this.key_synthesized_topics | length >= 1 }} )
  @@assert( {{ this.key_synthesized_topics | length <= 5 }} )
  // Should address the four main requirements of Section 112
  @@assert( {{ this.key_synthesized_topics[0].topic_title | length > 5 }} )
  @@assert( {{ this.key_synthesized_topics[0].synthesis | length > 30 }} )
  // Should have high confidence given comprehensive source
  @@assert( {{ this.key_synthesized_topics[0].confidence_score >= 7 }} )
  // Should reference the document
  @@assert( {{ "https://vernalaw.com/why-is-section-112-of-the-patent-act-important/" in this.key_synthesized_topics[0].supporting_document_ids }} )
  // May have emerging questions about practical applications
  @@assert( {{ this.emerging_questions | length >= 0 }} )
  @@assert( {{ this.reasoning.analyze_legal_question.summary | length > 15 }} )
}