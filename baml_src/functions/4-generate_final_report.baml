// 4. Generate Final Legal Report
//    Purpose: Creates the final, comprehensive report based on all synthesized information.
function GenerateFinalLegalReport(
  original_legal_question: string,
  synthesis: OverallSynthesis,
  query_history: LegalQueryAnalysis[] // Could be a list if there were multiple refinement rounds
) -> FinalLegalReport {
  client GenerateFinalReport // A powerful model for high-quality writing
  prompt #"
    You are a senior legal analyst tasked with drafting a comprehensive legal research report.
    Utilize the provided synthesis of findings and the history of query generation to construct the report.

    Original Legal Question: {{ original_legal_question }}

    Overall Synthesis of Findings:
    Key Synthesized Topics:
    {% for topic in synthesis.key_synthesized_topics %}
    - {{ topic.topic_title }}: {{ topic.synthesis }} (Supporting IDs: {{ topic.supporting_document_ids | join(", ") }})
    {% endfor %}
    Unanswered Aspects: {{ synthesis.unanswered_aspects | default(["None."]) | join("; ") }}
    Emerging Questions: {{ synthesis.emerging_questions | default(["None."]) | join("; ") }}

    Query Generation History (Reasoning for how queries were formed):
    {% for query_analysis in query_history %}
      Round {{ loop.index }}:
      {{ query_analysis.reasoning }}
      Queries:
      {% for query in query_analysis.search_queries %}
      - "{{ query.query_string }}" expecting: {{ query.expected_information | join(", ") }}
      {% endfor %}
    {% endfor %}

    Instructions:
    1.  Create a fitting `report_title`.
    2.  Write a concise `executive_summary`.
    3.  Structure the main findings into logical `sections` with `section_title` and detailed `content`. Ensure proper citation (e.g., using document IDs or case names if available from synthesis).
    4.  Formulate a `conclusion` based on the research.
    5.  Include any `limitations_and_caveats`.
    6.  List key `appendix_document_ids` if applicable.
    7.  The report should be detailed, nuanced, well-reasoned, and written in a professional legal tone.

    {{ ctx.output_format }}
  "#
}