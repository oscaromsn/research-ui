class OverallSynthesis {
  key_synthesized_topics SynthesizedTopic[] @description("A list of synthesized topics addressing different facets of the legal question.")
  unanswered_aspects string[]? @description("Aspects of the legal question not fully addressed by the current set of documents.")
  emerging_questions string[]? @description("New questions or research avenues that arose from the synthesis.")
  reasoning DetailedReasoning @description("LLM's thought process for the overall synthesis.")
}
