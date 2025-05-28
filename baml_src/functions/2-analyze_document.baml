// 2. Analyze Individual Search Result
//    Purpose: Takes raw text from a retrieved document and extracts structured insights.
function AnalyzeSingleDocument(document: SearchResultItem, original_legal_question: string) -> AnalyzedDocument {
  client DocumentAnalysis
  prompt #"
    You are a legal analyst. Given the legal question and the content of the retrieved document (SearchResultItem), perform a detailed analysis.

    Original Legal Question: {{ original_legal_question }}

    Document to Analyze:
    Document ID: {{ document.id }}
    Title: {{ document.title }}
    Source: {{ document.source_name }}
    Snippet: {{ document.snippet | default('N/A') }}
    // NB: If document.full_text is very long, consider truncating it in your application code
    // before passing it to this BAML function, or ensure your LLM can handle the full length.
    // For example, you might pass a pre-truncated version: document.processed_full_text
    Full Text: {{ document.full_text | default('No full text available') }}
    Metadata: {{ document.metadata | default({}) }}

    IMPORTANT: You must set the search_result_id field to exactly: {{ document.id }}

    Tasks:
    1.  Set search_result_id to the document ID provided above.
    2.  Assess relevance to the original legal question (1-10).
    3.  Provide a confidence score for your relevance assessment (1-10).
    4.  Summarize key findings/holdings pertinent to the question.
    5.  Extract key legal arguments, judicial reasoning, or statutory interpretations.
    6.  Identify and list key legal entities (cases, statutes, persons, organizations, concepts).
    7.  Extract direct quotes that are highly relevant.
    8.  Note any counter-arguments or important nuances.
    9.  Provide your detailed reasoning for this analysis, following the 5-step process: analyze legal question, consider relevant legal principles, formulate search queries strategy, specify expected information strategy, ensure comprehensive coverage strategy.

    {{ ctx.output_format }}
  "#
}