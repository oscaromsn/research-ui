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
  @@assert( {{ (this.summary | default("")) | length > 20 }} ) // Summary should be populated
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

// NEW TEST: Live data from National Law Review - highly relevant to Title VII adverse actions
test AnalyzeLiveEmploymentDiscriminationArticle {
  functions [AnalyzeSingleDocument]
  args {
    original_legal_question "What constitutes 'adverse employment action' under Title VII discrimination law?"
    document {
      id "https://natlawreview.com/article/what-counts-adverse-employment-action-discrimination-and-retaliation-cases"
      url "https://natlawreview.com/article/what-counts-adverse-employment-action-discrimination-and-retaliation-cases"
      source_name "Exa Search"
      title "What Counts as an \"Adverse Employment Action\" in Discrimination and Retaliation Cases?"
      snippet "Beyond clear examples of an adverse employment action, like being fired, suspended, or having your pay cut, it gets murky about what other actions rise to this level. Indeed, federal courts around the country have come to different answers based on similar facts."
      full_text #"
        What Counts as an "Adverse Employment Action" in Discrimination and Retaliation Cases?
        Monday, November 22, 2021
        When an employee experiences discrimination or retaliation at work it often takes the form of significant action, such as a termination, demotion, or suspension, all of which clearly represent an "adverse employment action" under relevant anti-discrimination and retaliation laws. But many times the retaliation and discrimination take subtler forms including a "death by a thousand cuts" approach. The question then becomes, was this conduct sufficiently concrete to meet the legal definition of employment discrimination or whistleblower retaliation?
        Legal standards for proving employment discrimination and whistleblower retaliation
        To establish a prima facie case of employment discrimination based on intentional discrimination an employee must show that they:
        are a member of a protected class,
        suffered an adverse employment action,
        met their employer's legitimate expectations at the time of the adverse employment action, and
        were treated differently from similarly situated employees outside their protected class.
        Title VII employment discrimination cases
        Title VII of the 1964 Civil Rights Act makes it unlawful for an employer to discriminate based on protected characteristics (for example, race, gender, religion, etc.) "with respect to [an individual's] compensation, terms, conditions, or privileges of employment." 42 U.S.C. 2000e-2(a)(1). The statutory language in Title VII does not mention "adverse employment action." Instead, this concept took hold in various federal cases interpreting Title VII.
        The Equal Employment Opportunity Commission, which enforces Title VII, has clarified that "adverse employment actions" include, but are not limited to:
        Hiring
        Firing
        Failure to promote
        Pay reduction
        Demotion
        Yet certain federal courts have interpreted Title VII to also require that the adverse employment action at issue must result in a "materially adverse consequence." See, e.g., Ortiz-Diaz v. United States Dep't of Hous. & Urban Dev., 867 F.3d 70, 74 (D.C. Cir. 2017). Under this approach, a lateral transfer that involves no economic loss would not rise to the level of an adverse employment action.
      "#
      published_date "2021-11-22T00:00:00Z"
      author "Eric Bachman"
      retrieval_date "2025-05-30T07:58:46.259Z"
      metadata {
        exa_internal_id "https://natlawreview.com/article/what-counts-adverse-employment-action-discrimination-and-retaliation-cases"
      }
    }
  }
  @@assert( {{ this.search_result_id == "https://natlawreview.com/article/what-counts-adverse-employment-action-discrimination-and-retaliation-cases" }} )
  @@assert( {{ this.relevance_score >= 8 }} ) // Very high relevance - directly addresses the question
  @@assert( {{ this.confidence_score >= 7 }} ) // High confidence due to comprehensive content
  @@assert( {{ (this.summary | default("")) | length > 50 }} ) // Should generate substantial summary
  @@assert( {{ "adverse employment action" in (this.summary | default("") | lower) }} ) // Key term should appear in summary
  @@assert( {{ this.key_arguments_and_reasoning | length >= 3 }} ) // Multiple key arguments expected
  @@assert( {{ this.extracted_entities | length >= 5 }} ) // Should extract multiple entities including Title VII
  @@assert( {{ (this.extracted_entities | selectattr("type", "equalto", "Statute") | list | length) > 0 }} ) // Should find Title VII
  @@assert( {{ this.extracted_quotes | length >= 2 }} ) // Should extract multiple relevant quotes
  @@assert( {{ this.reasoning.analyze_legal_question.summary | length > 20 }} ) // Reasoning should be detailed
}

// NEW TEST: Live data from Cornell Law - tangible employment action (related but distinct concept)
test AnalyzeLiveTangibleEmploymentAction {
  functions [AnalyzeSingleDocument]
  args {
    original_legal_question "What constitutes 'adverse employment action' under Title VII discrimination law?"
    document {
      id "https://www.law.cornell.edu/wex/tangible_employment_action"
      url "https://www.law.cornell.edu/wex/tangible_employment_action"
      source_name "Exa Search"
      title "tangible employment action"
      snippet "In the specific instance where an employee is alleging sexual harassment under Title VII, if no tangible employment action is found to be taken against the employee, then the employer-defendant may raise an affirmative defense to the action by showing that: (1) it exercised reasonable care to prevent and correct the harassment; and (2) the employee unreasonably failed to take advantage of any preventative or corrective opportunities or otherwise failed to avoid harm."
      full_text #"
        A tangible employment action constitutes a significant change in employment status, such as hiring, firing, failure to promote, reassignment with significantly different responsibility, or a decision causing a significant change in benefits. A tangible employment action is an element of a Title VII action, which may hold an employer liable, or vicariously liable for the actions of a supervisor.

        For example, the Supreme Court has held that a denial of a raise may constitute a tangible employment action. Other courts have also found the following situations to constitute a tangible (adverse) employment action:
        Loss of benefits specifically negotiated for in an employment contract, such as a private office;
        Threats of discharge by a supervisor to coerce employees to comply with the supervisor's demand; and
        Withholding a promotion or benefits for promotion for refusing to accept sexual advances from a supervisor.

        On the other hand, conditions such as reassignment to another office or downgraded job performance evaluations, by themselves, do not constitute a tangible employment action. See: Burlington Industries, Inc. v. Ellerth (1998)

        In the specific instance where an employee is alleging sexual harassment under Title VII, if no tangible employment action is found to be taken against the employee, then the employer-defendant may raise an affirmative defense to the action by showing that: (1) it exercised reasonable care to prevent and correct the harassment; and (2) the employee unreasonably failed to take advantage of any preventative or corrective opportunities or otherwise failed to avoid harm.

        Lastly, constructive discharge by a supervisor can also qualify as a tangible employment action for which an employer is strictly liable under Title VII. However, a plaintiff is required to prove: (1) the elements of constructive discharge, and (2) that an official act of the employer underlies the constructive discharge.
      "#
      published_date "2016-07-25T00:00:00.000Z"
      retrieval_date "2025-05-30T07:58:46.260Z"
      metadata {
        exa_internal_id "https://www.law.cornell.edu/wex/tangible_employment_action"
      }
    }
  }
  @@assert( {{ this.search_result_id == "https://www.law.cornell.edu/wex/tangible_employment_action" }} )
  @@assert( {{ this.relevance_score >= 6 and this.relevance_score <= 8 }} ) // Moderately high - related but specifically about "tangible" action
  @@assert( {{ this.confidence_score >= 6 }} )
  @@assert( {{ (this.summary | default("")) | length > 30 }} )
  @@assert( {{ ("tangible employment action" in (this.summary | default("") | lower)) or ("adverse employment action" in (this.summary | default("") | lower)) }} )
  @@assert( {{ this.key_arguments_and_reasoning | length >= 2 }} )
  @@assert( {{ this.extracted_entities | length >= 3 }} )
  @@assert( {{ (this.extracted_entities | selectattr("type", "equalto", "Case") | list | length) > 0 }} ) // Should find Burlington Industries case
  @@assert( {{ this.counter_arguments_or_nuances is not none }} ) // Should note the distinction between concepts
  @@assert( {{ this.reasoning.consider_relevant_legal_principles.summary | length > 15 }} )
}

// NEW TEST: Live data from Verna Law - comprehensive patent specification analysis
test AnalyzeLivePatentSpecificationArticle {
  functions [AnalyzeSingleDocument]
  args {
    original_legal_question "What are the requirements for a valid patent application under 35 U.S.C. § 112?"
    document {
      id "https://vernalaw.com/why-is-section-112-of-the-patent-act-important/"
      url "https://vernalaw.com/why-is-section-112-of-the-patent-act-important/"
      source_name "Exa Search"
      title "Why is Section 112 of the Patent Act Important? : Verna Law, P.C."
      snippet "A claim might state: \"A means for fastening two objects together,\" which would be interpreted to include the specific fastening methods described in the patent, such as a bolt, screw, or adhesive. Advantages: Functional claims can provide broad protection because they focus on the result achieved, potentially covering a wide range of implementations."
      full_text #"
        Section 112 of the Patent Act, codified as 35 U.S.C. § 112, outlines the requirements for the specification of a patent application. This section is critical as it defines what an inventor must include in their patent application to obtain a patent. Here are the key components of Section 112:

        Written Description: The application must contain a written description of the invention, in clear, concise, and exact terms, so as to enable any person of ordinary skill in the art to make and use the invention. This ensures that the public can benefit from the knowledge of the invention once the patent expires.

        Enablement Requirement: The specification must describe the manner and process of making and using the invention in such full, clear, concise, and exact terms as to enable any person of ordinary skill in the art to make and use it. This is known as the enablement requirement.

        Best Mode Requirement: The application must set forth the best mode contemplated by the inventor for carrying out the invention. This means the inventor must disclose the best way of practicing the invention at the time of filing the application, although this requirement is not as strictly enforced following the America Invents Act of 2011.

        Claims: The application must conclude with one or more claims particularly pointing out and distinctly claiming the subject matter which the inventor or joint inventor regards as the invention.

        Under 35 U.S.C. § 112, ¶ 2 (2006), a patent specification "shall conclude with one or more claims particularly pointing out and distinctly claiming the subject matter which the applicant regards as his invention." Patent claims that fail to meet the "particularly pointing out and distinctly claiming" requirement are invalid for indefiniteness.
      "#
      published_date "2024-05-19T15:39:19.000Z"
      author "Anthony M. Verna, III, Esq."
      retrieval_date "2025-05-30T07:58:49.008Z"
      metadata {
        exa_internal_id "https://vernalaw.com/why-is-section-112-of-the-patent-act-important/"
      }
    }
  }
  @@assert( {{ this.search_result_id == "https://vernalaw.com/why-is-section-112-of-the-patent-act-important/" }} )
  @@assert( {{ this.relevance_score >= 8 }} ) // Very high relevance - directly addresses 35 U.S.C. § 112 requirements
  @@assert( {{ this.confidence_score >= 7 }} ) // High confidence due to authoritative legal source
  @@assert( {{ (this.summary | default("")) | length > 40 }} ) // Should generate comprehensive summary
  @@assert( {{ ("specification" in (this.summary | default("") | lower)) and ("patent" in (this.summary | default("") | lower)) }} ) // Key terms expected
  @@assert( {{ this.key_arguments_and_reasoning | length >= 4 }} ) // Multiple requirements (written description, enablement, best mode, claims)
  @@assert( {{ this.extracted_entities | length >= 4 }} ) // Should extract statute, requirements, etc.
  @@assert( {{ (this.extracted_entities | selectattr("type", "equalto", "Statute") | list | length) > 0 }} ) // Should find 35 U.S.C. § 112
  @@assert( {{ this.extracted_quotes | length >= 1 }} ) // Should extract relevant quotes about requirements
  @@assert( {{ this.reasoning.analyze_legal_question.summary | length > 25 }} ) // Detailed reasoning expected
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
  @@assert( {{ this.relevance_score >= 7 and this.relevance_score <= 10 }} ) // Highly relevant as it directly covers patent application requirements
  @@assert( {{ (this.summary | default("")) | length > 10 }} )
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
  @@assert( {{ (this.summary | default("")) | length > 5 }} )
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
  @@assert( {{ this.relevance_score >= 3 and this.relevance_score <= 8 }} )
  @@assert( {{ (this.summary | default("")) | length > 5 }} ) // LLM should attempt a summary based on snippet/title
  // Key arguments might be sparse or non-existent
  @@assert( {{ this.key_arguments_and_reasoning | length >= 0 }} )
  // Check reasoning structure
  @@assert( {{ this.reasoning.analyze_legal_question.summary | length > 0 }} )
}