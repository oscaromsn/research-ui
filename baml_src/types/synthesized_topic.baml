// For synthesizing findings from multiple documents
class SynthesizedTopic {
  topic_title string @description("Um título para este tópico ou princípio jurídico sintetizado.")
  synthesis string @description("Uma síntese coerente de informações relacionadas a este tópico, extraída de múltiplos documentos analisados. Deve explicar convergências, divergências e temas gerais.") @stream.with_state
  supporting_document_ids string[] @description("IDs dos AnalyzedDocuments que apoiam esta síntese.")
  confidence_score int @description("Confiança na precisão e completude desta síntese (1-10).")
}
