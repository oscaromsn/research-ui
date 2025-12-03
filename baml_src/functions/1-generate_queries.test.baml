// ----- Testes Abrangentes para GenerateLegalSearchQueries - Contexto Jurídico Brasileiro -----

test PerguntaJuridicaSimples {
  functions [GenerateLegalSearchQueries]
  args {
    legal_question "Qual é o prazo prescricional para ação de inadimplemento contratual no direito brasileiro?"
  }
  // Assert on structure of DetailedReasoning
  @@assert( {{ this.reasoning.analyze_legal_question.summary | length > 10 }} )
  @@assert( {{ this.reasoning.consider_relevant_legal_principles.summary | length > 10 }} )
  @@assert( {{ this.reasoning.formulate_search_queries_strategy.summary | length > 10 }} )
  @@assert( {{ this.reasoning.specify_expected_information_strategy.summary | length > 10 }} )
  @@assert( {{ this.reasoning.ensure_comprehensive_coverage_strategy.summary | length > 10 }} )
  // Assert on quantity and structure of search queries
  @@assert( {{ this.search_queries | length >= 3 }} )
  @@assert( {{ this.search_queries | length <= 10 }} )
  // Check that query strings are not empty
  @@assert( {{ this.search_queries[0].query_string | length > 0 }} )
  @@assert( {{ this.search_queries[0].expected_information | length > 0 }} )
}

test PerguntaJuridicaComplexa {
  functions [GenerateLegalSearchQueries]
  args {
    legal_question "Em uma operação de fusão societária entre empresas sediadas em São Paulo e Rio de Janeiro, quais são os deveres fiduciários dos administradores durante as negociações, considerando a Lei das S.A. (Lei 6.404/76), a regulamentação da CVM e as obrigações de divulgação aos acionistas minoritários, incluindo o direito de recesso previsto no artigo 137?"
  }
  @@assert( {{ this.reasoning.analyze_legal_question.summary | length > 20 }} )
  @@assert( {{ this.reasoning.consider_relevant_legal_principles.summary | length > 20 }} )
  // Complex questions should generate more queries to cover different aspects
  @@assert( {{ this.search_queries | length >= 5 }} )
  @@assert( {{ this.search_queries | length <= 12 }} )
  // Should cover multiple jurisdictions and legal areas - check first few queries
  @@assert( {{ this.search_queries[0].query_string | length > 5 }} )
  @@assert( {{ this.search_queries[1].query_string | length > 5 }} )
}

test PerguntaJuridicaAmbigua {
  functions [GenerateLegalSearchQueries]
  args {
    legal_question "Quais são meus direitos nessa situação?"
  }
  @@assert( {{ this.reasoning.analyze_legal_question.summary | length > 10 }} )
  // Should still generate queries despite ambiguity
  @@assert( {{ this.search_queries | length >= 2 }} )
  @@assert( {{ this.search_queries | length <= 8 }} )
  // Queries should attempt to clarify or cover broad legal concepts
  @@assert( {{ this.search_queries[0].query_string | length > 0 }} )
}

test PerguntaEspecificaDeJurisdicao {
  functions [GenerateLegalSearchQueries]
  args {
    legal_question "Quais são os requisitos para usucapião extraordinária de imóvel urbano em São Paulo, conforme o Código Civil brasileiro?"
  }
  @@assert( {{ this.reasoning.analyze_legal_question.summary | length > 10 }} )
  @@assert( {{ this.search_queries | length >= 3 }} )
  // Should include São Paulo and usucapião specific searches
  @@assert( {{ this.search_queries[0].query_string | length > 5 }} )
  @@assert( {{ this.search_queries[0].expected_information | length > 0 }} )
}

test PerguntaDireitoConsumidor {
  functions [GenerateLegalSearchQueries]
  args {
    legal_question "Qual o valor de danos morais comumente arbitrado pelos tribunais em casos que o consumidor ficou aproximadamente 72 horas sem energia elétrica?"
  }
  @@assert( {{ this.reasoning.analyze_legal_question.summary | length > 10 }} )
  @@assert( {{ this.search_queries | length >= 3 }} )
  @@assert( {{ this.search_queries | length <= 10 }} )
  // Should handle Portuguese language and Brazilian legal concepts
  @@assert( {{ this.search_queries[0].query_string | length > 5 }} )
  // Check that reasoning addresses the question appropriately
  @@assert( {{ this.reasoning.analyze_legal_question.summary | length > 10 }} )
}

test PerguntaDireitoPenal {
  functions [GenerateLegalSearchQueries]
  args {
    legal_question "Quais são os elementos e qualificadoras do crime de homicídio qualificado segundo o artigo 121, §2º do Código Penal brasileiro?"
  }
  @@assert( {{ this.reasoning.analyze_legal_question.summary | length > 10 }} )
  @@assert( {{ this.search_queries | length >= 3 }} )
  // Should focus on criminal law concepts
  @@assert( {{ this.search_queries[0].query_string | length > 5 }} )
  @@assert( {{ this.search_queries[0].expected_information | length > 0 }} )
}
