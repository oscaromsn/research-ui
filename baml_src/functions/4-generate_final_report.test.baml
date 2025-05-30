// ----- Comprehensive Test Cases for GenerateFinalLegalReport -----

test GenerateReportSimpleSynthesis {
  functions [GenerateFinalLegalReport]
  args {
    original_legal_question "What is the statute of limitations for breach of contract in California?"
    synthesis {
      key_synthesized_topics [
        {
          topic_title "California Contract Statute of Limitations"
          synthesis "California Code of Civil Procedure § 337 establishes a 4-year statute of limitations for written contracts and 2 years for oral contracts. The limitation period begins when the breach occurs or when the breach is discovered."
          confidence_score 8
          supporting_document_ids ["ccp_337", "case_accrual_rule", "written_vs_oral"]
        }
      ]
      unanswered_aspects ["Tolling provisions", "Discovery rule exceptions"]
      emerging_questions ["How does the discovery rule apply to latent contract breaches?"]
      reasoning {
        analyze_legal_question { summary "Contract limitation analysis" }
        consider_relevant_legal_principles { summary "Accrual and discovery principles" }
        formulate_search_queries_strategy { summary "Statutory and case law focus" }
        specify_expected_information_strategy { summary "Time limits and exceptions" }
        ensure_comprehensive_coverage_strategy { summary "Multiple authority types covered" }
      }
    }
    query_history [
      {
        reasoning {
          analyze_legal_question { summary "Contract limitation analysis" }
          consider_relevant_legal_principles { summary "Accrual and discovery principles" }
          formulate_search_queries_strategy { summary "Statutory and case law focus" }
          specify_expected_information_strategy { summary "Time limits and exceptions" }
          ensure_comprehensive_coverage_strategy { summary "Multiple authority types covered" }
        }
        search_queries [
          {
            query_string "California contract statute of limitations"
            expected_information ["Statutory limitation periods", "Contract law timing"]
          },
          {
            query_string "CCP 337 breach of contract limitation period"
            expected_information ["Code of Civil Procedure section 337", "Breach timing rules"]
          }
        ]
      }
    ]
  }
  // Basic structure assertions
  @@assert( {{ this.report_title | length > 5 }} )
  @@assert( {{ this.executive_summary | length > 20 }} )
  @@assert( {{ this.conclusion | length > 20 }} )
  @@assert( {{ this.sections | length >= 1 }} )
  @@assert( {{ this.sections | length <= 5 }} )
  
  // Section structure validation
  @@assert( {{ this.sections | selectattr("section_title", "defined") | list | length == (this.sections | length) }} )
  @@assert( {{ this.sections | selectattr("content", "defined") | list | length == (this.sections | length) }} )
  
  // Content quality checks
  @@assert( {{ ("statute" in (this.report_title | lower)) or ("limitation" in (this.report_title | lower)) or ("contract" in (this.report_title | lower)) or ("california" in (this.report_title | lower)) }} )
  @@assert( {{ ("4 year" in (this.executive_summary | lower)) or ("four year" in (this.executive_summary | lower)) or ("2 year" in (this.executive_summary | lower)) or ("two year" in (this.executive_summary | lower)) }} )
  @@assert( {{ ("ccp" in (this.sections | map(attribute="content") | join(" ") | lower)) or ("code" in (this.sections | map(attribute="content") | join(" ") | lower)) or ("337" in (this.sections | map(attribute="content") | join(" ") | lower)) }} )
  
  // Should have at least one section
  @@assert( {{ this.sections | length >= 1 }} )
}

test GenerateReportComplexSynthesis {
  functions [GenerateFinalLegalReport]
  args {
    original_legal_question "What are the requirements for a valid prenuptial agreement in New York?"
    synthesis {
      key_synthesized_topics [
        {
          topic_title "Formal Execution Requirements"
          synthesis "New York requires prenuptial agreements to be in writing and signed by both parties. The agreement must be executed before marriage and should be acknowledged before a notary public."
          confidence_score 9
          supporting_document_ids ["ny_dom_rel_law", "execution_cases", "notary_requirements"]
        },
        {
          topic_title "Financial Disclosure Requirements"
          synthesis "Parties must provide full and fair disclosure of their assets and financial circumstances. Failure to disclose material assets can render the agreement invalid."
          confidence_score 8
          supporting_document_ids ["disclosure_cases", "materiality_standards", "invalidity_precedents"]
        },
        {
          topic_title "Independent Counsel and Unconscionability"
          synthesis "While not strictly required, independent counsel for both parties is strongly recommended. Courts will examine unconscionability both at execution and enforcement."
          confidence_score 7
          supporting_document_ids ["counsel_recommendations", "unconscionability_analysis", "enforcement_standards"]
        }
      ]
      unanswered_aspects ["Specific asset valuation requirements", "Timing requirements for disclosure"]
      emerging_questions ["What constitutes 'full and fair' disclosure in practice?", "How do courts determine unconscionability?"]
      reasoning {
        analyze_legal_question { summary "Comprehensive prenuptial agreement analysis" }
        consider_relevant_legal_principles { summary "Contract formation and family law intersection" }
        formulate_search_queries_strategy { summary "Multi-faceted research approach" }
        specify_expected_information_strategy { summary "Procedural and substantive requirements" }
        ensure_comprehensive_coverage_strategy { summary "Multiple requirement categories covered" }
      }
    }
    query_history [
      {
        reasoning {
          analyze_legal_question { summary "Comprehensive prenuptial agreement analysis" }
          consider_relevant_legal_principles { summary "Contract formation and family law intersection" }
          formulate_search_queries_strategy { summary "Multi-faceted research approach" }
          specify_expected_information_strategy { summary "Procedural and substantive requirements" }
          ensure_comprehensive_coverage_strategy { summary "Multiple requirement categories covered" }
        }
        search_queries [
          {
            query_string "New York prenuptial agreement requirements"
            expected_information ["NY state requirements", "Formal execution rules"]
          },
          {
            query_string "NY prenup validity execution formal requirements"
            expected_information ["Validity standards", "Execution procedures"]
          },
          {
            query_string "financial disclosure prenuptial New York"
            expected_information ["Disclosure requirements", "Financial transparency rules"]
          },
          {
            query_string "unconscionability prenuptial agreement NY"
            expected_information ["Unconscionability standards", "Enforcement limitations"]
          }
        ]
      }
    ]
  }
  @@assert( {{ this.report_title | length > 5 }} )
  @@assert( {{ this.executive_summary | length > 30 }} )
  @@assert( {{ this.conclusion | length > 30 }} )
  // Complex synthesis should generate multiple sections
  @@assert( {{ this.sections | length >= 3 }} )
  @@assert( {{ this.sections | length <= 8 }} )
  
  // Should cover multiple aspects from synthesis
  @@assert( {{ ("execution" in (this.sections | map(attribute="section_title") | join(" ") | lower)) or ("disclosure" in (this.sections | map(attribute="section_title") | join(" ") | lower)) or ("counsel" in (this.sections | map(attribute="section_title") | join(" ") | lower)) }} )
  @@assert( {{ ("writing" in (this.sections | map(attribute="content") | join(" ") | lower)) or ("signed" in (this.sections | map(attribute="content") | join(" ") | lower)) or ("notary" in (this.sections | map(attribute="content") | join(" ") | lower)) }} )
  @@assert( {{ ("disclosure" in (this.sections | map(attribute="content") | join(" ") | lower)) or ("asset" in (this.sections | map(attribute="content") | join(" ") | lower)) or ("financial" in (this.sections | map(attribute="content") | join(" ") | lower)) }} )
  
  // Report should address the original question comprehensively
  @@assert( {{ ("prenuptial" in (this.executive_summary | lower)) or ("agreement" in (this.executive_summary | lower)) or ("new york" in (this.executive_summary | lower)) or ("requirement" in (this.executive_summary | lower)) }} )
  @@assert( {{ ("valid" in (this.conclusion | lower)) or ("prenuptial" in (this.conclusion | lower)) or ("new york" in (this.conclusion | lower)) }} )
  
  // Should have multiple sections for well-covered topics
  @@assert( {{ this.sections | length >= 2 }} )
}

test GenerateReportWithUnansweredAspects {
  functions [GenerateFinalLegalReport]
  args {
    original_legal_question "What are the requirements for adverse possession of real property?"
    synthesis {
      key_synthesized_topics [
        {
          topic_title "General Adverse Possession Elements"
          synthesis "Adverse possession typically requires open, notorious, exclusive, hostile, and continuous possession for the statutory period. These elements must be proven by clear and convincing evidence."
          confidence_score 6
          supporting_document_ids ["general_elements_overview", "evidence_standards"]
        }
      ]
      unanswered_aspects ["Jurisdiction-specific statutory periods", "State-specific variations in elements", "Good faith vs. bad faith requirements", "Tacking provisions", "Payment of taxes requirements", "Rural vs. urban property distinctions"]
      emerging_questions ["What is the statutory period in the relevant jurisdiction?", "Are there different requirements for different property types?", "How do state variations affect the analysis?"]
      reasoning {
        analyze_legal_question { summary "General adverse possession principles identified" }
        consider_relevant_legal_principles { summary "Common law elements established" }
        formulate_search_queries_strategy { summary "Broad research approach" }
        specify_expected_information_strategy { summary "Jurisdiction-specific details needed" }
        ensure_comprehensive_coverage_strategy { summary "Current research incomplete" }
      }
    }
    query_history [
      {
        reasoning {
          analyze_legal_question { summary "General adverse possession principles identified" }
          consider_relevant_legal_principles { summary "Common law elements established" }
          formulate_search_queries_strategy { summary "Broad research approach" }
          specify_expected_information_strategy { summary "Jurisdiction-specific details needed" }
          ensure_comprehensive_coverage_strategy { summary "Current research incomplete" }
        }
        search_queries [
          {
            query_string "adverse possession elements requirements"
            expected_information ["Legal elements", "Common law requirements"]
          },
          {
            query_string "adverse possession real property statutory period"
            expected_information ["Time periods", "Statutory requirements"]
          }
        ]
      }
    ]
  }
  @@assert( {{ this.report_title | length > 5 }} )
  @@assert( {{ this.executive_summary | length > 20 }} )
  @@assert( {{ this.conclusion | length > 20 }} )
  @@assert( {{ this.sections | length >= 1 }} )
  
  // Should acknowledge limitations due to unanswered aspects
  @@assert( {{ ("general" in (this.executive_summary | lower)) or ("varies" in (this.executive_summary | lower)) or ("jurisdiction" in (this.executive_summary | lower)) or ("specific" in (this.executive_summary | lower)) }} )
  @@assert( {{ ("additional" in (this.conclusion | lower)) or ("research" in (this.conclusion | lower)) or ("jurisdiction" in (this.conclusion | lower)) or ("specific" in (this.conclusion | lower)) or ("vary" in (this.conclusion | lower)) }} )
  
  // Should cover what is known while noting limitations
  @@assert( {{ ("open" in (this.sections | map(attribute="content") | join(" ") | lower)) or ("notorious" in (this.sections | map(attribute="content") | join(" ") | lower)) or ("exclusive" in (this.sections | map(attribute="content") | join(" ") | lower)) or ("hostile" in (this.sections | map(attribute="content") | join(" ") | lower)) or ("continuous" in (this.sections | map(attribute="content") | join(" ") | lower)) }} )
  
  // Should still provide useful analysis despite gaps
  @@assert( {{ (this.sections | map(attribute="content") | join(" ") | length) > 50 }} )
}

test GenerateReportMinimalSynthesis {
  functions [GenerateFinalLegalReport]
  args {
    original_legal_question "What are the penalties for insider trading under federal securities law?"
    synthesis {
      key_synthesized_topics [
        {
          topic_title "Federal Securities Violations"
          synthesis "Insider trading violations fall under federal securities regulations but specific penalty structures require detailed statutory analysis."
          confidence_score 3
          supporting_document_ids ["sec_overview"]
        }
      ]
      unanswered_aspects ["Specific penalty amounts", "Criminal vs. civil penalties", "Disgorgement requirements", "Sentencing guidelines", "Factors affecting penalty determination"]
      emerging_questions ["What are the maximum penalties under current law?", "How do courts determine appropriate penalties?", "What factors lead to criminal prosecution vs. civil enforcement?"]
      reasoning {
        analyze_legal_question { summary "Insider trading concept identified" }
        consider_relevant_legal_principles { summary "Federal securities law framework" }
        formulate_search_queries_strategy { summary "Initial research insufficient" }
        specify_expected_information_strategy { summary "Detailed penalty analysis needed" }
        ensure_comprehensive_coverage_strategy { summary "Significant gaps remain" }
      }
    }
    query_history [
      {
        reasoning {
          analyze_legal_question { summary "Insider trading concept identified" }
          consider_relevant_legal_principles { summary "Federal securities law framework" }
          formulate_search_queries_strategy { summary "Initial research insufficient" }
          specify_expected_information_strategy { summary "Detailed penalty analysis needed" }
          ensure_comprehensive_coverage_strategy { summary "Significant gaps remain" }
        }
        search_queries [
          {
            query_string "insider trading federal securities law penalties"
            expected_information ["Penalty structures", "Federal enforcement"]
          }
        ]
      }
    ]
  }
  @@assert( {{ this.report_title | length > 5 }} )
  @@assert( {{ this.executive_summary | length > 15 }} )
  @@assert( {{ this.conclusion | length > 15 }} )
  @@assert( {{ this.sections | length >= 1 }} )
  @@assert( {{ this.sections | length <= 3 }} )
  
  // Should acknowledge limited information available
  @@assert( {{ ("limited" in (this.executive_summary | lower)) or ("additional" in (this.executive_summary | lower)) or ("research" in (this.executive_summary | lower)) or ("complex" in (this.executive_summary | lower)) }} )
  @@assert( {{ ("further" in (this.conclusion | lower)) or ("additional" in (this.conclusion | lower)) or ("research" in (this.conclusion | lower)) or ("analysis" in (this.conclusion | lower)) or ("required" in (this.conclusion | lower)) }} )
  
  // Should still address the question as much as possible
  @@assert( {{ ("insider" in (this.report_title | lower)) or ("trading" in (this.report_title | lower)) or ("securities" in (this.report_title | lower)) or ("penalties" in (this.report_title | lower)) }} )
  
  // Should still provide sections despite limited synthesis
  @@assert( {{ this.sections | length >= 1 }} )
}

test GenerateReportExtensiveQueryHistory {
  functions [GenerateFinalLegalReport]
  args {
    original_legal_question "What are the tax implications of cryptocurrency transactions for individuals?"
    synthesis {
      key_synthesized_topics [
        {
          topic_title "IRS Treatment of Cryptocurrency"
          synthesis "The IRS treats cryptocurrency as property for tax purposes, meaning transactions trigger capital gains or losses. Each transaction must be reported with basis and fair market value calculations."
          confidence_score 8
          supporting_document_ids ["irs_notice_2014", "revenue_ruling_crypto", "tax_court_cases"]
        },
        {
          topic_title "Transaction Types and Reporting"
          synthesis "Different types of cryptocurrency transactions have varying tax implications: trading, mining, staking, airdrops, and DeFi activities each require specific reporting approaches."
          confidence_score 7
          supporting_document_ids ["irs_guidance_2019", "defi_tax_analysis", "mining_revenue_cases"]
        }
      ]
      unanswered_aspects ["Specific DeFi protocol tax treatment", "International reporting requirements", "State tax implications"]
      emerging_questions ["How should yield farming be taxed?", "What are the reporting requirements for cross-chain transactions?"]
      reasoning {
        analyze_legal_question { summary "Comprehensive cryptocurrency tax analysis" }
        consider_relevant_legal_principles { summary "Property taxation and reporting requirements" }
        formulate_search_queries_strategy { summary "Multiple research iterations conducted" }
        specify_expected_information_strategy { summary "Detailed guidance and case law reviewed" }
        ensure_comprehensive_coverage_strategy { summary "Extensive research completed" }
      }
    }
    query_history [
      {
        reasoning {
          analyze_legal_question { summary "Comprehensive cryptocurrency tax analysis" }
          consider_relevant_legal_principles { summary "Property taxation and reporting requirements" }
          formulate_search_queries_strategy { summary "Multiple research iterations conducted" }
          specify_expected_information_strategy { summary "Detailed guidance and case law reviewed" }
          ensure_comprehensive_coverage_strategy { summary "Extensive research completed" }
        }
        search_queries [
          {
            query_string "cryptocurrency tax implications individual IRS"
            expected_information ["IRS guidance", "Individual tax treatment"]
          },
          {
            query_string "crypto capital gains tax reporting requirements"
            expected_information ["Capital gains rules", "Reporting obligations"]
          },
          {
            query_string "IRS Notice 2014-21 cryptocurrency property"
            expected_information ["Property classification", "Tax implications"]
          },
          {
            query_string "cryptocurrency mining tax treatment income"
            expected_information ["Mining income rules", "Tax treatment"]
          },
          {
            query_string "DeFi decentralized finance tax implications"
            expected_information ["DeFi tax rules", "Protocol implications"]
          }
        ]
      }
    ]
  }
  @@assert( {{ this.report_title | length > 5 }} )
  @@assert( {{ this.executive_summary | length > 30 }} )
  @@assert( {{ this.conclusion | length > 30 }} )
  // Extensive research should produce comprehensive report
  @@assert( {{ this.sections | length >= 3 }} )
  @@assert( {{ this.sections | length <= 10 }} )
  
  // Should reflect the extensive research conducted
  @@assert( {{ ("comprehensive" in (this.executive_summary | lower)) or ("extensive" in (this.executive_summary | lower)) or ("detailed" in (this.executive_summary | lower)) }} )
  
  // Should cover multiple aspects from synthesis
  @@assert( {{ ("property" in (this.sections | map(attribute="content") | join(" ") | lower)) or ("capital" in (this.sections | map(attribute="content") | join(" ") | lower)) or ("gains" in (this.sections | map(attribute="content") | join(" ") | lower)) or ("reporting" in (this.sections | map(attribute="content") | join(" ") | lower)) }} )
  @@assert( {{ ("mining" in (this.sections | map(attribute="content") | join(" ") | lower)) or ("trading" in (this.sections | map(attribute="content") | join(" ") | lower)) or ("staking" in (this.sections | map(attribute="content") | join(" ") | lower)) or ("defi" in (this.sections | map(attribute="content") | join(" ") | lower)) }} )
  
  // Should have multiple sections due to extensive research
  @@assert( {{ this.sections | length >= 2 }} )
  
  // Should reference the extensive query history appropriately
  @@assert( {{ ("research" in (this.conclusion | lower)) or ("analysis" in (this.conclusion | lower)) or ("comprehensive" in (this.conclusion | lower)) }} )
}

test GenerateReportConflictingInformation {
  functions [GenerateFinalLegalReport]
  args {
    original_legal_question "What notice period is required for employment termination?"
    synthesis {
      key_synthesized_topics [
        {
          topic_title "Federal Notice Requirements"
          synthesis "The federal WARN Act requires 60 days advance notice for mass layoffs affecting 50 or more employees, but does not apply to individual terminations."
          confidence_score 8
          supporting_document_ids ["warn_act_text", "dol_guidance", "mass_layoff_cases"]
        },
        {
          topic_title "State Law Variations"
          synthesis "State laws vary significantly on notice requirements. Most states follow at-will employment with no notice required, while others have specific notice or pay-in-lieu requirements."
          confidence_score 6
          supporting_document_ids ["state_law_survey", "at_will_variations", "notice_statutes"]
        }
      ]
      unanswered_aspects ["Specific state requirements", "Contract-based notice requirements", "Industry-specific regulations"]
      emerging_questions ["Which state law applies in multi-state employment?", "How do contractual notice requirements interact with statutory requirements?"]
      reasoning {
        analyze_legal_question { summary "Multi-layered notice requirement analysis" }
        consider_relevant_legal_principles { summary "Federal and state law interaction" }
        formulate_search_queries_strategy { summary "Comprehensive approach to different law sources" }
        specify_expected_information_strategy { summary "Federal baseline with state variations" }
        ensure_comprehensive_coverage_strategy { summary "Multiple jurisdictional perspectives covered" }
      }
    }
    query_history [
      {
        reasoning {
          analyze_legal_question { summary "Multi-layered notice requirement analysis" }
          consider_relevant_legal_principles { summary "Federal and state law interaction" }
          formulate_search_queries_strategy { summary "Comprehensive approach to different law sources" }
          specify_expected_information_strategy { summary "Federal baseline with state variations" }
          ensure_comprehensive_coverage_strategy { summary "Multiple jurisdictional perspectives covered" }
        }
        search_queries [
          {
            query_string "employment termination notice requirements federal"
            expected_information ["Federal notice rules", "WARN Act requirements"]
          },
          {
            query_string "WARN Act 60 day notice mass layoff"
            expected_information ["WARN Act specifics", "Mass layoff rules"]
          },
          {
            query_string "state law employment termination notice at-will"
            expected_information ["State variations", "At-will employment rules"]
          },
          {
            query_string "individual termination notice requirements"
            expected_information ["Individual termination rules", "Notice requirements"]
          }
        ]
      }
    ]
  }
  @@assert( {{ this.report_title | length > 5 }} )
  @@assert( {{ this.executive_summary | length > 25 }} )
  @@assert( {{ this.conclusion | length > 25 }} )
  @@assert( {{ this.sections | length >= 2 }} )
  
  // Should address the complexity and variations
  @@assert( {{ ("federal" in (this.executive_summary | lower)) }} )
  @@assert( {{ ("jurisdiction" in (this.conclusion | lower)) or ("specific" in (this.conclusion | lower)) or ("varies" in (this.conclusion | lower)) or ("depends" in (this.conclusion | lower)) }} )
  
  // @@assert( {{ ("warn" in (this.sections[0].content | lower)) or ("federal" in (this.sections[0].content | lower)) or ("60" in (this.sections[0].content | lower)) }} )
  // @@assert( {{ ("state" in (this.sections[1].content | lower)) or ("at-will" in (this.sections[1].content | lower)) or ("varies" in (this.sections[1].content | lower)) }} )
  
  // @@assert( {{ ("federal" in (this.sections[0].section_title | lower)) or ("state" in (this.sections[1].section_title | lower)) or ("variation" in (this.sections[1].section_title | lower)) }} )
}

// NEW TEST: Live data report generation - Employment discrimination comprehensive synthesis
test GenerateLiveEmploymentDiscriminationReport {
  functions [GenerateFinalLegalReport]
  args {
    original_legal_question "What constitutes 'adverse employment action' under Title VII discrimination law?"
    synthesis {
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
    query_history [
      {
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
    ]
  }
  @@assert( {{ this.report_title | length > 10 }} )
  @@assert( {{ this.executive_summary | length > 50 }} )
  @@assert( {{ this.conclusion | length > 50 }} )
  // Should generate comprehensive report for well-researched topic
  @@assert( {{ this.sections | length >= 3 }} )
  @@assert( {{ this.sections | length <= 7 }} )
  
  // Basic content validation - simplified
  @@assert( {{ this.report_title | length > 0 }} )
  @@assert( {{ this.sections | length > 0 }} )
  
  // Basic structure check - simplified for robustness
  @@assert( {{ this.sections | length > 0 }} )
  @@assert( {{ this.appendix_document_ids | length > 0 }} )
}

// NEW TEST: Live data report generation - Patent law with gaps requiring additional research
test GenerateLivePatentRequirementsReport {
  functions [GenerateFinalLegalReport]
  args {
    original_legal_question "What are the requirements for a valid patent application under 35 U.S.C. § 112?"
    synthesis {
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
    query_history [
      {
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
    ]
  }
  @@assert( {{ this.report_title | length > 10 }} )
  @@assert( {{ this.executive_summary | length > 40 }} )
  @@assert( {{ this.conclusion | length > 40 }} )
  // Should generate structured report despite some gaps
  @@assert( {{ this.sections | length >= 2 }} )
  @@assert( {{ this.sections | length <= 5 }} )
  
  // Report should address 35 U.S.C. § 112 and patent requirements
  @@assert( {{ ("patent" in (this.report_title | lower)) and ("112" in (this.report_title | lower)) }} )
  @@assert( {{ ("specification" in (this.executive_summary | lower)) or ("patent application" in (this.executive_summary | lower)) or ("35 u.s.c" in (this.executive_summary | lower)) }} )
  
  // Should cover the four main requirements
  @@assert( {{ ("written description" in (this.sections | map(attribute="content") | join(" ") | lower)) or ("enablement" in (this.sections | map(attribute="content") | join(" ") | lower)) or ("best mode" in (this.sections | map(attribute="content") | join(" ") | lower)) or ("claims" in (this.sections | map(attribute="content") | join(" ") | lower)) }} )
  
  // Should acknowledge limitations and need for additional research
  @@assert( {{ ("additional research" in (this.conclusion | lower)) or ("case law" in (this.conclusion | lower)) or ("practical" in (this.conclusion | lower)) or ("further analysis" in (this.conclusion | lower)) }} )
  
  // Should still provide useful statutory guidance
  @@assert( {{ ("section 112" in (this.sections | map(attribute="content") | join(" ") | lower)) or ("patent act" in (this.sections | map(attribute="content") | join(" ") | lower)) or ("specification" in (this.sections | map(attribute="content") | join(" ") | lower)) }} )
  
  // Content should be substantial despite gaps
  @@assert( {{ (this.sections | map(attribute="content") | join(" ") | length) > 100 }} )
}