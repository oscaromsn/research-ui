// For synthesizing findings from multiple documents
class SynthesizedTopic {
  topic_title string @description("A title for this synthesized topic or legal principle.")
  synthesis string @description("A coherent synthesis of information related to this topic, drawing from multiple analyzed documents. Should explain convergences, divergences, and overall themes.") @stream.with_state
  supporting_document_ids string[] @description("IDs of the AnalyzedDocuments that support this synthesis.")
  confidence_score int @description("Confidence in the accuracy and completeness of this synthesis (1-10).")
}
