// 1. GenerateInitialSearchQueries
//    Input: legal_question: string
//    Output: LegalQueryAnalysis (contains initial SearchQueryItem[] and reasoning)

function GenerateLegalSearchQueries(legal_question: string) -> LegalQueryAnalysis {
  client QueryGeneration // Use the named client
  prompt #"
    You are an expert legal research assistant tasked with generating effective search queries to find relevant legal precedents for a given legal question. Your goal is to help legal professionals locate the most pertinent cases, statutes, and other legal documents.

    **Analysis and Query Formulation Process (Follow these 5 steps for your reasoning):**

    1.  **Carefully Analyze the Legal Question** (Populate `reasoning.analyze_legal_question`):
        a)  Identify the main legal issue(s) involved.
        b)  Pinpoint key legal concepts, terms of art, and relevant entities.
        c)  Note any mentioned or implied jurisdictions (e.g., federal, specific state, circuit court).
        d)  Identify any specific facts crucial to the case as presented in the question.
        e)  Consider potential legal theories or doctrines that may apply at a high level.
        (Provide a comprehensive `summary` and list `items_considered` for this step.)

    2.  **Consider Relevant Legal Principles** (Populate `reasoning.consider_relevant_legal_principles`):
        Based on your initial analysis, delve deeper into:
        a)  Applicable constitutional law principles.
        b)  Relevant statutes, regulations, and their potential interpretations.
        c)  Pertinent legal theories, doctrines, and elements of claims or defenses.
        d)  Jurisdiction-specific nuances in how laws or precedents are applied.
        e)  Potential counterarguments or alternative perspectives that research should cover.
        f)  Any other related legal principles or standards of review.
        (Provide a comprehensive `summary` and list `items_considered` for this step.)

    3.  **Formulate 3-5 Search Queries - Strategy** (Populate `reasoning.formulate_search_queries_strategy`):
        Describe your strategy for constructing the search queries. These queries will be listed in the `search_queries` field. Detail how you will:
        a)  Use Boolean operators (AND, OR, NOT) effectively.
        b)  Enclose exact legal phrases or terms of art in quotation marks ("").
        c)  Utilize wildcard characters (*) for variations in terms (e.g., discriminat* for discriminate, discrimination).
        d)  Employ proximity operators (e.g., NEAR/x, w/x, /p, /s) if beneficial for the search engine context.
        e)  Use parentheses for grouping and managing complex combinations of terms and operators.
        f)  Consider date restrictions or ranges if relevant to the legal question.
        g)  Incorporate relevant legal terminology, jargon, and jurisdiction-specific terms identified earlier.
        h)  Apply search operators or syntax to enhance precision and avoid ambiguities or unrelated results.
        (Provide a comprehensive `summary` of your query formulation strategy and list key `items_considered` like specific operators or term choices.)

    4.  **Specify Expected Information for Each Query - Strategy** (Populate `reasoning.specify_expected_information_strategy`):
        For each query you will formulate, explain your strategy for detailing what specific types of information you aim to find. This relates to the `expected_information` field for each `SearchQueryItem`. Consider aiming for:
        a)  Relevant case law and their key holdings, reasoning, and factual similarities.
        b)  Applicable statutes, regulations, or specific sections thereof.
        c)  Definitions or applications of legal principles or doctrines.
        d)  Authoritative scholarly articles, treatises, or secondary sources that analyze the issue.
        e)  Jurisdiction-specific interpretations or applications of the law.
        (Provide a `summary` of your strategy for defining `expected_information` and list `items_considered` like types of sources.)

    5.  **Ensure Comprehensive Coverage - Strategy** (Populate `reasoning.ensure_comprehensive_coverage_strategy`):
        Explain how your set of 3-5 search queries will complement each other to cover the essential aspects of the legal question broadly, while minimizing redundancy and ensuring a focused search.
        (Provide a `summary` of your coverage strategy and list `items_considered` like how queries differ or build upon each other.)

    **Output Instructions:**
    Fill the `reasoning` field with a structured breakdown of your thought process according to the `DetailedReasoning` schema, ensuring each step (e.g., `analyze_legal_question`, `consider_relevant_legal_principles`) contains a thorough `summary` and relevant `items_considered`.
    Then, provide the list of search queries and their associated expected information in the `search_queries` field, adhering to the `SearchQueryItem` schema.

    {{ ctx.output_format }}

    {{ _.role("user") }}
    **Legal Question to Analyze:**
    {{ legal_question }}
  "#
}