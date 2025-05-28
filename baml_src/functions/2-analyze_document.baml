// 2. Analyze Individual Search Result
//    Purpose: Takes raw text from a retrieved document and extracts structured insights.
function AnalyzeSingleDocument(document: SearchResultItem, original_legal_question: string) -> AnalyzedDocument {
  client DocumentAnalysis
  prompt #"
You are a legal analyst tasked with analyzing a document in relation to a specific legal question. Your goal is to provide a comprehensive analysis following a structured approach. Here are your instructions:

1. First, carefully read the following legal question:

<legal_question>
{{ original_legal_question }}
</legal_question>

2. Now, carefully read the document to be analyzed:

<document>
    Document ID: {{ document.id }}
    Title: {{ document.title }}
    Source: {{ document.source_name }}
    Snippet: {{ document.snippet | default('N/A') }}
    // NB: If document.full_text is very long, consider truncating it in your application code
    // before passing it to this BAML function, or ensure your LLM can handle the full length.
    // For example, you might pass a pre-truncated version: document.processed_full_text
    Full Text: {{ document.full_text | default('No full text available') }}
    Metadata: {{ document.metadata | default({}) }}
</document>

3. Perform a detailed analysis of the document in relation to the legal question. Follow these steps:

   a) Assess the relevance of the document to the legal question on a scale of 1 to 10.
   b) Provide a confidence score for your relevance assessment on a scale of 1 to 10.
   c) Summarize key findings or holdings pertinent to the question.
   d) Extract key legal arguments, judicial reasoning, or statutory interpretations.
   e) Identify and list key legal entities (cases, statutes, persons, organizations, concepts).
   f) Extract direct quotes that are highly relevant.
   g) Note any counter-arguments or important nuances.
   h) Provide your detailed reasoning for this analysis, following the 5-step process outlined in the schema.

4. Present your analysis in JSON format using the following schema:

    {{ ctx.output_format }}

5. It is crucial that you follow the 5-step reasoning process in detail, providing comprehensive summaries and specific items considered for each step.

IMPORTANT: You must set the search_result_id field to exactly: {{ document.id }}

Your final output should consist of only the JSON object containing your analysis. Do not include any additional text or explanations outside of the JSON structure.
  "#
}