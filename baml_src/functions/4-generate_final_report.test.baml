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
  @@assert( {{ ("execution" in (this.sections | map(attribute="title") | join(" ") | lower)) or ("disclosure" in (this.sections | map(attribute="title") | join(" ") | lower)) or ("counsel" in (this.sections | map(attribute="title") | join(" ") | lower)) }} )
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