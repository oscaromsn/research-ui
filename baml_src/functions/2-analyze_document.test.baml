
test AnalyzeHighlyRelevantCase {
  functions [AnalyzeSingleDocument]
  args {
    original_legal_question "What constitutes 'adverse employment action' under Title VII in the 9th Circuit?"
    document {
      id "case_123"
      url "https://courtlistener.com/opinion/123456/smith-v-acme-corp/"
      source_name "CourtListener"
      title "Smith v. Acme Corp., 123 F.3d 456 (9th Cir. 2022)"
      snippet "The Ninth Circuit clarifies the definition of adverse employment action under Title VII, holding that a lateral transfer with no change in pay or benefits can still constitute an adverse action if it is materially adverse to a reasonable employee."
      full_text #"
        Case: Smith v. Acme Corp.
        Citation: 123 F.3d 456 (9th Cir. 2022)
        Opinion:
        Plaintiff John Smith sued Acme Corp. under Title VII of the Civil Rights Act of 1964, alleging discrimination. A key issue was whether a lateral transfer, which did not involve a decrease in salary or benefits, could be considered an 'adverse employment action.'
        The district court granted summary judgment for Acme Corp. We reverse.
        Under Burlington N. & Santa Fe Ry. Co. v. White, 548 U.S. 53 (2006), an adverse employment action is one that 'might have dissuaded a reasonable worker from making or supporting a charge of discrimination.'
        We hold that a lateral transfer can be an adverse employment action if it results in a significant change in job responsibilities or significantly diminished career prospects, even without a direct economic loss. In this case, Smith's transfer led to a loss of supervisory duties and was therefore materially adverse.
        The legal concept of 'adverse employment action' is critical.
        Jurisdiction: 9th Circuit.
      "#
      retrieval_date "2024-07-16T10:00:00Z"
      metadata {
        court "9th Circuit Court of Appeals"
        date_decided "2022-10-15"
      }
    }
  }
  // Assertions on the output (this)
  @@assert( {{ this.search_result_id == "case_123" }} )
  @@assert( {{ this.relevance_score >= 7 }} ) // Expecting high relevance
  @@assert( {{ this.confidence_score >= 6 }} )
  @@assert( {{ this.summary | length > 20 }} ) // Summary should be populated
  @@assert( {{ this.key_arguments_and_reasoning | length > 0 }} ) // Should find arguments
  @@assert( {{ this.extracted_entities | length > 0 }} ) // Should find entities like "Title VII", "9th Circuit"
  // Example: Check if a specific entity type was found
  @@assert( {{ (this.extracted_entities | selectattr("type", "equalto", "Case") | list | length) > 0 }} )
  @@assert( {{ (this.extracted_entities | selectattr("type", "equalto", "Jurisdiction") | list | length) > 0 }} )
  @@assert( {{ this.extracted_quotes | length > 0 }} ) // Should extract quotes
  // Check that reasoning structure was attempted
  @@assert( {{ this.reasoning.analyze_legal_question is not none }} )
  @@assert( {{ this.reasoning.consider_relevant_legal_principles is not none }} )
  // And for the other reasoning steps as well, if you want to be explicit:
  @@assert( {{ this.reasoning.formulate_search_queries_strategy is not none }} )
  @@assert( {{ this.reasoning.specify_expected_information_strategy is not none }} )
  @@assert( {{ this.reasoning.ensure_comprehensive_coverage_strategy is not none }} )
}

test AnalyzePartiallyRelevantStatute {
  functions [AnalyzeSingleDocument]
  args {
    original_legal_question "What are the requirements for a valid patent application?"
    document {
      id "statute_xyz"
      url "https://www.law.cornell.edu/uscode/text/35/112"
      source_name "Statutes.gov"
      title "35 U.S.C. § 112 - Specification"
      snippet "The specification shall contain a written description of the invention, and of the manner and process of making and using it, in such full, clear, concise, and exact terms as to enable any person skilled in the art to which it pertains, or with which it is most nearly connected, to make and use the same, and shall set forth the best mode contemplated by the inventor or joint inventor of carrying out the invention."
      full_text #"
        (a) In General.—The specification shall contain a written description of the invention, and of the manner and process of making and using it, in such full, clear, concise, and exact terms as to enable any person skilled in the art to which it pertains, or with which it is most nearly connected, to make and use the same, and shall set forth the best mode contemplated by the inventor or joint inventor of carrying out the invention.
        (b) Claims.—The specification shall conclude with one or more claims particularly pointing out and distinctly claiming the subject matter which the inventor or joint inventor regards as the invention.
        (c) Drawings ... (content omitted)
        This section, 35 U.S.C. § 112, outlines some requirements for patent specifications.
      "#
      retrieval_date "2024-07-16T10:05:00Z"
      metadata {
        code "35 U.S.C."
        section "112"
      }
    }
  }
  @@assert( {{ this.search_result_id == "statute_xyz" }} )
  @@assert( {{ this.relevance_score >= 5 and this.relevance_score <= 8 }} ) // Partially relevant as it covers 'specification'
  @@assert( {{ this.summary | length > 10 }} )
  @@assert( {{ this.key_arguments_and_reasoning | length > 0 }} ) // Should extract requirements
  @@assert( {{ (this.extracted_entities | selectattr("type", "equalto", "Statute") | list | length) > 0 }} )
  @@assert( {{ (this.extracted_entities | selectattr("name", "equalto", "35 U.S.C. § 112") | list | length) > 0 }} )
  // Check reasoning structure
  @@assert( {{ this.reasoning.analyze_legal_question.summary | length > 0 }} )
}

test AnalyzeIrrelevantDocument {
  functions [AnalyzeSingleDocument]
  args {
    original_legal_question "What are the elements of a contract?"
    document {
      id "random_doc_789"
      url "https://genericsewssite.com/local/bakery-wins-pie-contest"
      source_name "GenericNewsSite"
      title "Local Bakery Wins Pie Contest"
      snippet "The annual pie contest saw a new champion today as 'Pie in the Sky' bakery took home the grand prize for their apple crumble."
      full_text #"
        Springfield - The town's beloved 'Pie in the Sky' bakery, run by Chef Anna, was awarded the blue ribbon at the annual county fair pie contest.
        Her signature apple crumble, a secret family recipe, impressed the judges with its perfect balance of sweet and tart flavors, and a uniquely flaky crust.
        Chef Anna mentioned that the key legal concept behind her win was 'deliciousness.'
      "#
      retrieval_date "2024-07-16T10:10:00Z"
      metadata {
        category "Local News"
      }
    }
  }
  @@assert( {{ this.search_result_id == "random_doc_789" }} )
  @@assert( {{ this.relevance_score <= 3 }} ) // Expecting low relevance
  // Summary might still be generated but should reflect irrelevance
  @@assert( {{ this.summary | length > 5 }} )
  // Depending on LLM, it might find "legal concept" as an entity due to the text, or find none.
  // This assertion is loose:
  @@assert( {{ this.extracted_entities | length >= 0 }} )
  // Check if the summary indicates irrelevance (hard to assert specific wording)
  // A more advanced check might involve another LLM call or keyword spotting on this.summary
  // For BAML tests, we often check structure more than semantic content of free text.
  @@assert( {{ this.reasoning.analyze_legal_question.summary | length > 0 }} )
}

test AnalyzeDocumentWithMissingFullText {
  functions [AnalyzeSingleDocument]
  args {
    original_legal_question "What is the statute of limitations for tort claims in California?"
    document {
      id "incomplete_doc_001"
      url "https://legalbriefs.com/california/tort-claims-overview"
      source_name "LegalBriefs.com"
      title "California Tort Claims Act Overview"
      snippet "A brief overview of tort claims in California, including typical statutes of limitations for personal injury and property damage."
      // full_text is null or empty
      full_text null // or ""
      retrieval_date "2024-07-16T10:15:00Z"
      metadata {
        jurisdiction "California"
      }
    }
  }
  @@assert( {{ this.search_result_id == "incomplete_doc_001" }} )
  // Relevance might be moderate based on title/snippet, but confidence might be lower due to missing text
  @@assert( {{ this.relevance_score >= 3 and this.relevance_score <= 7 }} )
  @@assert( {{ this.summary | length > 5 }} ) // LLM should attempt a summary based on snippet/title
  // Key arguments might be sparse or non-existent
  @@assert( {{ this.key_arguments_and_reasoning | length >= 0 }} )
  // Check reasoning structure
  @@assert( {{ this.reasoning.analyze_legal_question.summary | length > 0 }} )
}