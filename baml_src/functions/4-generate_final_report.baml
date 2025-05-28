// 4. Generate Final Legal Report
//    Purpose: Creates the final, comprehensive report based on all synthesized information.
function GenerateFinalLegalReport(
  original_legal_question: string,
  synthesis: OverallSynthesis,
  query_history: LegalQueryAnalysis[] // Could be a list if there were multiple refinement rounds
) -> FinalLegalReport {
  client GenerateFinalReport // A powerful model for high-quality writing
  prompt #"
You are a senior legal analyst tasked with drafting a comprehensive legal research report. You will be provided with the original legal question, a synthesis of findings, and the history of query generation. Your task is to construct a detailed report based on this information.

First, review the following information:

1. Original Legal Question:
<original_question>
{{ original_legal_question }}
</original_question>

2. Overall Synthesis of Findings:
<synthesis>
    Key Synthesized Topics:
    {% for topic in synthesis.key_synthesized_topics %}
    - {{ topic.topic_title }}: {{ topic.synthesis }} (Supporting IDs: {{ topic.supporting_document_ids | join(", ") }})
    {% endfor %}
    Unanswered Aspects: {{ synthesis.unanswered_aspects | default(["None."]) | join("; ") }}
    Emerging Questions: {{ synthesis.emerging_questions | default(["None."]) | join("; ") }}
</synthesis>

3. Query Generation History:
<query_history>
    {% for query_analysis in query_history %}
      Round {{ loop.index }}:
      {{ query_analysis.reasoning }}
      Queries:
      {% for query in query_analysis.search_queries %}
      - "{{ query.query_string }}" expecting: {{ query.expected_information | join(", ") }}
      {% endfor %}
    {% endfor %}
</query_history>

Now, use this information to create a comprehensive legal research report. Follow these steps:

1. Create a fitting report title that encapsulates the main topic of the research.

2. Write a concise executive summary that provides an overview of the key findings.

3. Structure the main findings into logical sections. Each section should have a clear title and detailed content. Ensure proper citation using document IDs or case names if available from the synthesis.

4. Formulate a conclusion based on the research.

5. Include any limitations of the research or caveats to the findings.

6. List key appendix document IDs if applicable.

Your report should be detailed, nuanced, well-reasoned, and written in a professional legal tone. Use the information provided in the synthesis and query history to inform your report, but feel free to expand on these points where appropriate, drawing on your knowledge of legal principles and practices.

Present your report in JSON format using the following schema:

    {{ ctx.output_format }}

Your final output should consist of only the JSON-formatted report. Do not include any additional commentary or explanations outside of this JSON structure.
  "#
}