// 4. Generate Final Legal Report
//    Purpose: Creates the final, comprehensive report based on all synthesized information.
function GenerateFinalLegalReport(
  original_legal_question: string,
  synthesis: OverallSynthesis,
  query_history: LegalQueryAnalysis[] // Could be a list if there were multiple refinement rounds
) -> FinalLegalReport {
  client GenerateFinalReport // A powerful model for high-quality writing
  prompt #"
You are a senior legal analyst tasked with drafting a legal research report. You will be provided with the original legal question, a synthesis of findings, and the history of query generation. Your task is to construct a report based on this information that is proportionate to the available research.

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

Now, use this information to create a legal research report that is proportionate to the available information. Follow these guidelines:

**Report Scope Guidelines:**
- If synthesis contains 1-2 topics with limited supporting documents: Create a concise report with 1-3 sections focusing on what can be definitively established
- If synthesis contains 3+ topics with extensive supporting documents: Create a comprehensive report with 3-6 sections providing detailed analysis
- Always acknowledge limitations when research is minimal or incomplete

**Report Structure:**
1. Create a fitting report title that encapsulates the main topic of the research.

2. Write an executive summary that reflects the scope of available findings (use words like "limited", "additional research needed", or "complex" when synthesis is minimal).

3. Structure the main findings into logical sections proportionate to available information. Ensure proper citation using document IDs or case names if available from the synthesis.

4. Formulate a conclusion that acknowledges the completeness of the research (use words like "further", "additional", "research", "analysis", or "required" when gaps exist).

5. Include limitations of the research or caveats to the findings, especially when source material is limited.

6. List key appendix document IDs if applicable.

Your report should be well-reasoned and written in a professional legal tone, but scaled appropriately to match the depth and breadth of available research information.

Present your report in JSON format using the following schema:

    {{ ctx.output_format }}

Your final output should consist of only the JSON-formatted report. Do not include any additional commentary or explanations outside of this JSON structure.
  "#
}
