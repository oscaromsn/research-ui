// 1. GenerateInitialSearchQueries
//    Input: legal_question: string
//    Output: LegalQueryAnalysis (contains initial SearchQueryItem[] and reasoning)

function GenerateLegalSearchQueries(legal_question: string) -> LegalQueryAnalysis {
  client QueryGeneration // Use the named client
  prompt #"
You are an expert legal research assistant tasked with generating effective search queries to find relevant legal precedents for a given legal question. Your goal is to help legal professionals locate the most pertinent cases, statutes, and other legal documents.

Here is the legal question you need to analyze:

<legal_question>
{{legal_question}}
</legal_question>

Follow this step-by-step process to analyze the question and formulate search queries:

1. Analyze the Legal Question:
   - Identify main legal issues, key concepts, terms of art, and relevant entities
   - Note any mentioned or implied jurisdictions
   - Identify specific facts crucial to the case
   - Consider potential legal theories or doctrines that may apply

2. Consider Relevant Legal Principles:
   - Applicable constitutional law principles
   - Relevant statutes, regulations, and potential interpretations
   - Pertinent legal theories, doctrines, and elements of claims or defenses
   - Jurisdiction-specific nuances
   - Potential counterarguments or alternative perspectives
   - Other related legal principles or standards of review

3. Formulate Search Queries Strategy:
   - Plan use of Boolean operators, exact phrases, wildcards, proximity operators
   - Consider date restrictions if relevant
   - Incorporate relevant legal terminology and jurisdiction-specific terms
   - Apply search operators to enhance precision

4. Specify Expected Information Strategy:
   - For each query, plan what types of information you aim to find (e.g., case law, statutes, legal principles, scholarly articles)

5. Ensure Comprehensive Coverage Strategy:
   - Plan how your set of 3-5 search queries will complement each other to cover essential aspects of the legal question

For each step, provide a comprehensive summary of your thought process and list key items considered.

Output your analysis and search queries in JSON format according to this schema:

    {{ ctx.output_format }}

Your final output should consist of only the JSON object containing your reasoning and search queries. Do not include any additional text or explanations outside of the JSON structure.
  "#
}