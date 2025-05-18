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

    {{ ctx.output_format }}
  "#
}