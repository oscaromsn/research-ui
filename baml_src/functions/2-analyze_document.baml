// 2. Analyze Individual Search Result
//    Purpose: Takes raw text from a retrieved document and extracts structured insights.
function AnalyzeSingleDocument(document: SearchResultItem, original_legal_question: string) -> AnalyzedDocument {
  client DocumentAnalysis
  prompt #"
    You are a legal analyst. Given the legal question and the content of the retrieved document (SearchResultItem), perform a detailed analysis.

    Original Legal Question: {{ original_legal_question }}

    Document to Analyze:
    Title: {{ document.title }}
    Source: {{ document.source_name }}
    Snippet: {{ document.snippet | default('N/A') }}
    // NB: If document.full_text is very long, consider truncating it in your application code
    // before passing it to this BAML function, or ensure your LLM can handle the full length.
    // For example, you might pass a pre-truncated version: document.processed_full_text
    Full Text: {{ document.full_text }}
    Metadata: {{ document.metadata | default({}) }}

    Tasks:
    1.  Assess relevance to the original legal question (1-10).
    2.  Summarize key findings/holdings pertinent to the question.
    3.  Extract key legal arguments, judicial reasoning, or statutory interpretations.
    4.  Identify and list key legal entities (cases, statutes, persons, organizations, concepts).
    5.  Extract direct quotes that are highly relevant.
    6.  Note any counter-arguments or important nuances.
    7.  Provide your detailed reasoning for this analysis, following the 5-step process if applicable to document analysis (e.g., how did you identify relevance, what principles did you apply to extract arguments).

    {{ ctx.output_format }}
  "#
}