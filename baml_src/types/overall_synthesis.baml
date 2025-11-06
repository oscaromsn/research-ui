class OverallSynthesis {
  key_synthesized_topics SynthesizedTopic[] @description("Uma lista de tópicos sintetizados que abordam diferentes facetas da questão jurídica.")
  unanswered_aspects string[]? @description("Aspectos da questão jurídica não totalmente abordados pelo conjunto atual de documentos.")
  emerging_questions string[]? @description("Novas questões ou caminhos de pesquisa que surgiram da síntese.")
  reasoning DetailedReasoning @description("Processo de pensamento do LLM para a síntese geral.")
}
