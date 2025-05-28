// 3. Synthesize Findings from Multiple Analyzed Documents
//    Purpose: Combines insights from several analyzed documents into coherent themes.
function SynthesizeAllFindings(analyzed_docs: AnalyzedDocument[], original_legal_question: string) -> OverallSynthesis {
  client FindingsSynthetizing
  prompt #"
    You are a senior legal researcher. You have received analyses of multiple documents related to a legal question.
    Your task is to synthesize these findings into a coherent understanding.

    Original Legal Question: {{ original_legal_question }}

    Analyzed Documents (Summaries and Key Points):
    {% for doc in analyzed_docs %}
    --- Document ID: {{ doc.search_result_id }} ---
    Relevance: {{ doc.relevance_score }}/10
    // If doc.summary is potentially long, and you need to ensure it's concise for this synthesis step,
    // it might be better to have the AnalyzeSingleDocument produce a very brief version,
    // or pre-process it in your application code before passing to this synthesis function.
    Summary: {{ doc.summary }}
    Key Arguments:
    {% for arg in doc.key_arguments_and_reasoning %}
    - {{ arg }}
    {% endfor %}
    Key Entities:
    {% for entity in doc.extracted_entities %}
    - {{ entity.name }} ({{ entity.type }})
    {% endfor %}
    {% endfor %}

    Tasks:
    1.  Identify overarching legal themes, principles, or topics that emerge from the analyzed documents.
    2.  For each theme/topic, provide a synthesis that explains convergences, divergences, and key takeaways, referencing the supporting document IDs.
    3.  Identify any aspects of the original legal question that remain unanswered or poorly addressed.
    4.  List any new questions or research avenues that have emerged.
    5.  Provide your detailed reasoning for this synthesis.

    IMPORTANT GUIDANCE:
    - Aim to identify 3-5 distinct synthesized topics when multiple relevant documents are provided
    - Each topic should address a different aspect or facet of the legal question
    - Look for both convergent themes (where documents agree) and divergent perspectives
    - Consider creating separate topics for different legal elements, jurisdictions, or principles
    - When assigning confidence scores for synthesized topics:
      * If most supporting documents have low relevance scores (below 5/10), the confidence should be low (1-4)
      * If supporting documents have mixed relevance, confidence should be moderate (4-7)
      * Only assign high confidence (8-10) when supporting documents are highly relevant (7+/10)
      * Consider the quality and completeness of information when determining confidence

    {{ ctx.output_format }}
  "#
}