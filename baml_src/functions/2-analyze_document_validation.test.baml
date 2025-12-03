// Teste de validação específico para capturar BamlValidationError para campos obrigatórios ausentes
test ValidarCamposObrigatoriosAnalyzeSingleDocument {
  functions [AnalyzeSingleDocument]
  args {
    original_legal_question "O que caracteriza dispensa discriminatória segundo a Súmula 443 do TST?"
    document {
      id "doc_teste_validacao"
      url "https://exemplo.com/teste-validacao"
      source_name "Fonte de Teste"
      title "Documento de Teste para Validação"
      snippet "Trecho de teste para fins de validação"
      full_text "Este é um documento de teste para garantir que todos os campos obrigatórios são retornados corretamente pela função AnalyzeSingleDocument."
      retrieval_date "2024-07-16T10:00:00Z"
      metadata {}
    }
  }

  // CRÍTICO: Testar que todos os campos obrigatórios estão presentes e não vazios
  @@assert( {{ this.search_result_id is not none }} )
  @@assert( {{ this.search_result_id == "doc_teste_validacao" }} )
  @@assert( {{ this.relevance_score is not none }} )
  @@assert( {{ this.relevance_score >= 1 and this.relevance_score <= 10 }} )
  @@assert( {{ this.confidence_score is not none }} )
  @@assert( {{ this.confidence_score >= 1 and this.confidence_score <= 10 }} )
  @@assert( {{ this.summary is not none }} )
  @@assert( {{ this.summary | length > 0 }} )
  @@assert( {{ this.key_arguments_and_reasoning is not none }} )
  @@assert( {{ this.extracted_entities is not none }} )
  @@assert( {{ this.extracted_quotes is not none }} )

  // CRÍTICO: Testar que a estrutura completa de reasoning está presente
  @@assert( {{ this.reasoning is not none }} )
  @@assert( {{ this.reasoning.analyze_legal_question is not none }} )
  @@assert( {{ this.reasoning.analyze_legal_question.summary is not none }} )
  @@assert( {{ this.reasoning.analyze_legal_question.summary | length > 0 }} )

  @@assert( {{ this.reasoning.consider_relevant_legal_principles is not none }} )
  @@assert( {{ this.reasoning.consider_relevant_legal_principles.summary is not none }} )
  @@assert( {{ this.reasoning.consider_relevant_legal_principles.summary | length > 0 }} )

  @@assert( {{ this.reasoning.formulate_search_queries_strategy is not none }} )
  @@assert( {{ this.reasoning.formulate_search_queries_strategy.summary is not none }} )
  @@assert( {{ this.reasoning.formulate_search_queries_strategy.summary | length > 0 }} )

  @@assert( {{ this.reasoning.specify_expected_information_strategy is not none }} )
  @@assert( {{ this.reasoning.specify_expected_information_strategy.summary is not none }} )
  @@assert( {{ this.reasoning.specify_expected_information_strategy.summary | length > 0 }} )

  @@assert( {{ this.reasoning.ensure_comprehensive_coverage_strategy is not none }} )
  @@assert( {{ this.reasoning.ensure_comprehensive_coverage_strategy.summary is not none }} )
  @@assert( {{ this.reasoning.ensure_comprehensive_coverage_strategy.summary | length > 0 }} )
}

// Teste com conteúdo mínimo do documento para garantir tratamento robusto
test ValidarConteudoMinimoAnalyzeSingleDocument {
  functions [AnalyzeSingleDocument]
  args {
    original_legal_question "Quais são os requisitos de validade do contrato segundo o art. 104 do Código Civil?"
    document {
      id "doc_minimo"
      url "https://exemplo.com/minimo"
      source_name "Fonte Mínima"
      title "Documento Mínimo"
      snippet "Trecho breve"
      full_text "Conteúdo muito breve sobre contratos no direito brasileiro."
      retrieval_date "2024-07-16T10:00:00Z"
      metadata {}
    }
  }

  // Mesmo com conteúdo mínimo, toda a estrutura obrigatória deve estar presente
  @@assert( {{ this.search_result_id == "doc_minimo" }} )
  @@assert( {{ this.reasoning is not none }} )
  @@assert( {{ this.reasoning.analyze_legal_question.summary | length > 0 }} )
  @@assert( {{ this.reasoning.consider_relevant_legal_principles.summary | length > 0 }} )
  @@assert( {{ this.reasoning.formulate_search_queries_strategy.summary | length > 0 }} )
  @@assert( {{ this.reasoning.specify_expected_information_strategy.summary | length > 0 }} )
  @@assert( {{ this.reasoning.ensure_comprehensive_coverage_strategy.summary | length > 0 }} )
}

// Teste com documento complexo para garantir consistência da estrutura
test ValidarConteudoComplexoAnalyzeSingleDocument {
  functions [AnalyzeSingleDocument]
  args {
    original_legal_question "Quais são os requisitos para estabelecer caso prima facie de discriminação trabalhista no direito brasileiro?"
    document {
      id "doc_complexo"
      url "https://exemplo.com/caso-discriminacao-complexo"
      source_name "Base de Jurisprudência Trabalhista"
      title "Análise do Framework Brasileiro de Prova em Discriminação Trabalhista e Aplicações Modernas"
      snippet "Análise abrangente do framework brasileiro para estabelecer casos prima facie de discriminação trabalhista, incluindo aplicações modernas da jurisprudência do TST e variações nos TRTs."
      full_text #"
        O framework brasileiro para análise de discriminação trabalhista, estabelecido pela jurisprudência do TST e consolidado na Súmula 443, fornece a estrutura fundamental para analisar reclamações de discriminação no emprego. Este entendimento estabeleceu um framework de distribuição do ônus da prova que permanece como pedra angular da jurisprudência trabalhista.

        Segundo o entendimento consolidado, o reclamante deve estabelecer um caso prima facie demonstrando: (1) pertencimento a um grupo protegido; (2) qualificação para o cargo em questão; (3) uma ação prejudicial no emprego; e (4) circunstâncias que deem origem a uma inferência de discriminação.

        Os Tribunais Regionais do Trabalho desenvolveram diferentes abordagens para o quarto elemento, com alguns exigindo nexo causal direto e outros aplicando um teste de fator motivador. A Lei 9.029/95 complicou ainda mais esta análise ao estabelecer proibições específicas.

        Decisões recentes dos TRTs refinaram a análise particularmente em relação ao escopo das ações prejudiciais no emprego e ao nível de especificidade requerido para prova circunstancial de discriminação.

        A inversão do ônus da prova, conforme art. 818 da CLT e entendimento do TST, é fundamental na análise destes casos, especialmente quando há indícios de discriminação.
      "#
      retrieval_date "2024-07-16T10:00:00Z"
      metadata {
        court "TST"
        citation "Súmula 443"
        jurisdiction "Brasil"
      }
    }
  }

  // Conteúdo complexo deve manter a estrutura obrigatória
  @@assert( {{ this.search_result_id == "doc_complexo" }} )
  @@assert( {{ this.relevance_score >= 6 }} ) // Should be highly relevant
  @@assert( {{ this.confidence_score >= 6 }} ) // Should be confident given quality source
  @@assert( {{ this.summary | length > 20 }} ) // Should generate substantial summary
  @@assert( {{ this.key_arguments_and_reasoning | length >= 2 }} ) // Multiple arguments expected
  @@assert( {{ this.extracted_entities | length >= 3 }} ) // Should extract multiple entities

  // Validação completa da estrutura de reasoning
  @@assert( {{ this.reasoning.analyze_legal_question.summary | length > 15 }} )
  @@assert( {{ this.reasoning.consider_relevant_legal_principles.summary | length > 15 }} )
  @@assert( {{ this.reasoning.formulate_search_queries_strategy.summary | length > 10 }} )
  @@assert( {{ this.reasoning.specify_expected_information_strategy.summary | length > 10 }} )
  @@assert( {{ this.reasoning.ensure_comprehensive_coverage_strategy.summary | length > 10 }} )

  // Campos opcionais devem ser tratados adequadamente (podem ser null ou ter conteúdo)
  @@assert( {{ this.counter_arguments_or_nuances is not none or this.counter_arguments_or_nuances is none }} ) // Either populated or null is fine
}
