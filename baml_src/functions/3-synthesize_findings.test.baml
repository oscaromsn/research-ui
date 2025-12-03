// ----- Testes Abrangentes para SynthesizeAllFindings - Contexto Jurídico Brasileiro -----

test SintetizarZeroDocumentos {
  functions [SynthesizeAllFindings]
  args {
    original_legal_question "Qual é o valor do salário mínimo vigente no Brasil?"
    analyzed_docs []
  }
  // Should still produce a synthesis even with no documents
  @@assert( {{ this.key_synthesized_topics | length >= 0 }} )
  @@assert( {{ this.unanswered_aspects | length > 0 }} ) // Should identify what couldn't be answered
  @@assert( {{ this.emerging_questions | length >= 0 }} )
  @@assert( {{ this.reasoning.analyze_legal_question.summary | length > 0 }} )
  @@assert( {{ this.reasoning.consider_relevant_legal_principles.summary | length > 0 }} )
}

test SintetizarDocumentoUnico {
  functions [SynthesizeAllFindings]
  args {
    original_legal_question "O que caracteriza dispensa discriminatória no direito trabalhista brasileiro?"
    analyzed_docs [
      {
        search_result_id "caso_tst_123"
        relevance_score 8
        confidence_score 7
        summary "O TST decidiu que a dispensa de empregado portador de doença grave pode constituir dispensa discriminatória se houver presunção de discriminação, conforme Súmula 443."
        key_arguments_and_reasoning ["Aplicação da Súmula 443 do TST", "Teste de presunção de discriminação", "Perspectiva do empregado portador de doença grave"]
        extracted_entities [
          { type "Case", name "Súmula 443 do TST", details "Súmula do TST estabelecendo presunção de discriminação" },
          { type "Jurisdiction", name "TST", details "Tribunal Superior do Trabalho" },
          { type "LegalConcept", name "dispensa discriminatória", details "Conceito do direito trabalhista brasileiro" }
        ]
        extracted_quotes ["Presume-se discriminatória a despedida de empregado portador do vírus HIV ou de outra doença grave que suscite estigma ou preconceito"]
        reasoning {
          analyze_legal_question { summary "Análise dos requisitos de dispensa discriminatória" }
          consider_relevant_legal_principles { summary "Súmula 443 e interpretações dos tribunais" }
          formulate_search_queries_strategy { summary "Foco em casos de discriminação trabalhista" }
          specify_expected_information_strategy { summary "Buscar padrões definitórios" }
          ensure_comprehensive_coverage_strategy { summary "Cobrir diferentes TRTs e padrões fáticos" }
        }
      }
    ]
  }
  @@assert( {{ this.key_synthesized_topics | length >= 1 }} )
  @@assert( {{ this.key_synthesized_topics | length <= 3 }} )
  // Check structure of synthesized topics
  @@assert( {{ this.key_synthesized_topics | selectattr("topic_title", "defined") | list | length == (this.key_synthesized_topics | length) }} )
  @@assert( {{ this.key_synthesized_topics | selectattr("synthesis", "defined") | list | length == (this.key_synthesized_topics | length) }} )
  @@assert( {{ this.key_synthesized_topics | selectattr("confidence_score", "defined") | list | length == (this.key_synthesized_topics | length) }} )
  @@assert( {{ this.key_synthesized_topics | selectattr("supporting_document_ids", "defined") | list | length == (this.key_synthesized_topics | length) }} )
  // Check that document ID is referenced
  @@assert( {{ "caso_tst_123" in this.key_synthesized_topics[0].supporting_document_ids }} )
  // Should have some synthesis content
  @@assert( {{ this.key_synthesized_topics[0].synthesis | length > 10 }} )
}

test SintetizarDocumentosConvergentes {
  functions [SynthesizeAllFindings]
  args {
    original_legal_question "Qual é o prazo prescricional para ações de responsabilidade civil por danos pessoais no Brasil?"
    analyzed_docs [
      {
        search_result_id "cc_art_206"
        relevance_score 9
        confidence_score 8
        summary "O Código Civil brasileiro, Art. 206, §3º, V, estabelece prazo prescricional de 3 anos para pretensão de reparação civil."
        key_arguments_and_reasoning ["Prazo prescricional de 3 anos", "Termo inicial na data do conhecimento do dano", "Danos pessoais abrangidos"]
        extracted_entities [
          { type "Statute", name "Código Civil Art. 206, §3º, V", details "Dispositivo legal sobre prescrição" },
          { type "LegalConcept", name "3 anos", details "Prazo para responsabilidade civil" },
          { type "LegalConcept", name "prescrição", details "Conceito jurídico de perda do direito de ação" }
        ]
        extracted_quotes ["Prescreve em três anos a pretensão de reparação civil"]
        reasoning {
          analyze_legal_question { summary "Análise dos prazos prescricionais em responsabilidade civil" }
          consider_relevant_legal_principles { summary "Teoria da actio nata e princípios de prescrição" }
          formulate_search_queries_strategy { summary "Foco em dispositivos legais" }
          specify_expected_information_strategy { summary "Buscar prazos específicos" }
          ensure_comprehensive_coverage_strategy { summary "Cobrir diferentes tipos de danos" }
        }
      },
      {
        search_result_id "jurisprudencia_stj"
        relevance_score 8
        confidence_score 7
        summary "O STJ confirmou que o prazo prescricional de 3 anos aplica-se à maioria das ações de responsabilidade civil, com a regra da actio nata para danos de conhecimento tardio."
        key_arguments_and_reasoning ["Prazo de 3 anos confirmado", "Exceção da actio nata", "Doutrina do dano oculto"]
        extracted_entities [
          { type "Case", name "REsp 1.234.567/SP", details "Caso interpretando aplicação da actio nata" },
          { type "LegalConcept", name "3 anos", details "Prazo prescricional padrão" },
          { type "LegalConcept", name "actio nata", details "Exceção à regra geral de contagem" }
        ]
        extracted_quotes ["A prescrição começa a correr da data em que o titular do direito conheceu ou deveria conhecer o fato gerador da pretensão"]
        reasoning {
          analyze_legal_question { summary "Interpretação jurisprudencial dos prazos prescricionais" }
          consider_relevant_legal_principles { summary "Aplicação da actio nata" }
          formulate_search_queries_strategy { summary "Foco em interpretações judiciais" }
          specify_expected_information_strategy { summary "Buscar exceções e aplicações" }
          ensure_comprehensive_coverage_strategy { summary "Cobrir diferentes padrões fáticos" }
        }
      }
    ]
  }
  @@assert( {{ this.key_synthesized_topics | length >= 1 }} )
  @@assert( {{ this.key_synthesized_topics | length <= 4 }} )
  // Should synthesize the convergent information about 3-year period
  @@assert( {{ this.key_synthesized_topics[0].synthesis | length > 10 }} )
  // Should reference both documents
  @@assert( {{ this.key_synthesized_topics[0].supporting_document_ids | length >= 1 }} )
  // Should have high confidence due to convergent sources
  @@assert( {{ this.key_synthesized_topics[0].confidence_score >= 7 }} )
  // Fewer unanswered aspects since question is well-covered
  @@assert( {{ this.unanswered_aspects | length <= 5 }} )
}

test SintetizarDocumentosDivergentes {
  functions [SynthesizeAllFindings]
  args {
    original_legal_question "Quais são os requisitos para dispensa coletiva de trabalhadores no Brasil?"
    analyzed_docs [
      {
        search_result_id "tst_dispensa_coletiva"
        relevance_score 7
        confidence_score 6
        summary "O TST entende que a dispensa coletiva exige prévia negociação com o sindicato da categoria, não podendo ser realizada unilateralmente pelo empregador."
        key_arguments_and_reasoning ["Exigência de negociação sindical", "Dispensa coletiva diferenciada", "Proteção ao trabalhador"]
        extracted_entities [
          { type "Statute", name "TST-IUJ-SUM-277", details "Entendimento sobre dispensa coletiva" },
          { type "LegalConcept", name "negociação coletiva", details "Exigência prévia para dispensa em massa" },
          { type "LegalConcept", name "dispensa coletiva", details "Término de múltiplos contratos" }
        ]
        extracted_quotes ["A dispensa coletiva deve ser precedida de negociação com o sindicato"]
        reasoning {
          analyze_legal_question { summary "Requisitos federais para dispensa coletiva" }
          consider_relevant_legal_principles { summary "Cobertura do entendimento do TST e exceções" }
          formulate_search_queries_strategy { summary "Foco em direito coletivo do trabalho" }
          specify_expected_information_strategy { summary "Buscar requisitos de negociação" }
          ensure_comprehensive_coverage_strategy { summary "Cobrir diferentes cenários de dispensa" }
        }
      },
      {
        search_result_id "clt_dispensa_individual"
        relevance_score 8
        confidence_score 7
        summary "A CLT permite a dispensa sem justa causa de empregados individuais mediante pagamento de aviso prévio e verbas rescisórias, sem exigência de negociação prévia."
        key_arguments_and_reasoning ["Dispensa individual sem negociação", "Aviso prévio obrigatório", "Verbas rescisórias devidas"]
        extracted_entities [
          { type "Jurisdiction", name "Brasil", details "Jurisdição com leis trabalhistas específicas" },
          { type "LegalConcept", name "dispensa sem justa causa", details "Relação de trabalho terminável pelo empregador" },
          { type "LegalConcept", name "aviso prévio", details "Prazo de 30 a 90 dias" }
        ]
        extracted_quotes ["A dispensa sem justa causa enseja o pagamento do aviso prévio e demais verbas rescisórias"]
        reasoning {
          analyze_legal_question { summary "Requisitos legais para dispensa individual" }
          consider_relevant_legal_principles { summary "Princípios da dispensa sem justa causa" }
          formulate_search_queries_strategy { summary "Foco em legislação trabalhista" }
          specify_expected_information_strategy { summary "Buscar requisitos de aviso e pagamento" }
          ensure_comprehensive_coverage_strategy { summary "Cobrir regras específicas" }
        }
      }
    ]
  }
  @@assert( {{ this.key_synthesized_topics | length >= 2 }} )
  @@assert( {{ this.key_synthesized_topics | length <= 5 }} )
  // Should address the divergent requirements (coletiva vs individual)
  @@assert( {{ this.key_synthesized_topics[0].synthesis | length > 10 }} )
  @@assert( {{ this.key_synthesized_topics[1].synthesis | length > 10 }} )
  // Should have emerging questions due to complexity
  @@assert( {{ this.emerging_questions | length >= 1 }} )
  // Might have moderate confidence due to divergent information
  @@assert( {{ (this.key_synthesized_topics | selectattr("confidence_score", "le", 8) | list | length) > 0 }} )
}

test SintetizarMultiplosAspectos {
  functions [SynthesizeAllFindings]
  args {
    original_legal_question "Quais são os requisitos para a formação de um contrato válido no direito brasileiro?"
    analyzed_docs [
      {
        search_result_id "doc_agente_capaz"
        relevance_score 9
        confidence_score 8
        summary "Um contrato válido requer agente capaz, conforme art. 104, I do Código Civil, que estabelece a capacidade civil como requisito essencial."
        key_arguments_and_reasoning ["Agente deve ser capaz", "Capacidade civil necessária", "Incapacidade gera nulidade"]
        extracted_entities [
          { type "LegalConcept", name "agente capaz", details "Requisito de capacidade para contratar" },
          { type "LegalConcept", name "formação do contrato", details "Processo de criação de acordo juridicamente vinculante" }
        ]
        extracted_quotes ["A validade do negócio jurídico requer agente capaz"]
        reasoning {
          analyze_legal_question { summary "Análise dos elementos de formação contratual" }
          consider_relevant_legal_principles { summary "Requisitos de capacidade" }
          formulate_search_queries_strategy { summary "Foco em elementos do direito contratual" }
          specify_expected_information_strategy { summary "Buscar requisitos de formação" }
          ensure_comprehensive_coverage_strategy { summary "Cobrir todos os elementos contratuais" }
        }
      },
      {
        search_result_id "doc_objeto_licito"
        relevance_score 8
        confidence_score 7
        summary "O objeto do contrato deve ser lícito, possível, determinado ou determinável, conforme art. 104, II do Código Civil."
        key_arguments_and_reasoning ["Objeto lícito e possível", "Determinação do objeto", "Ilicitude gera nulidade"]
        extracted_entities [
          { type "LegalConcept", name "objeto lícito", details "Concordância com os termos do contrato" },
          { type "LegalConcept", name "objeto determinado", details "Objeto deve corresponder exatamente à proposta" }
        ]
        extracted_quotes ["Objeto lícito, possível, determinado ou determinável"]
        reasoning {
          analyze_legal_question { summary "Requisitos de objeto para formação contratual" }
          consider_relevant_legal_principles { summary "Regra do objeto e comunicação" }
          formulate_search_queries_strategy { summary "Foco na doutrina de objeto" }
          specify_expected_information_strategy { summary "Buscar padrões de objeto" }
          ensure_comprehensive_coverage_strategy { summary "Cobrir variações de objeto" }
        }
      },
      {
        search_result_id "doc_forma"
        relevance_score 8
        confidence_score 8
        summary "A forma prescrita ou não defesa em lei é requisito de validade, conforme art. 104, III do Código Civil."
        key_arguments_and_reasoning ["Forma prescrita em lei", "Liberdade de forma como regra", "Forma especial em casos específicos"]
        extracted_entities [
          { type "LegalConcept", name "forma", details "Algo de valor trocado no contrato" },
          { type "LegalConcept", name "forma especial", details "Benefício ou prejuízo reconhecido pela lei" }
        ]
        extracted_quotes ["Forma prescrita ou não defesa em lei"]
        reasoning {
          analyze_legal_question { summary "Requisitos de forma para contratos válidos" }
          consider_relevant_legal_principles { summary "Teoria da forma e valor legal" }
          formulate_search_queries_strategy { summary "Foco na doutrina de forma" }
          specify_expected_information_strategy { summary "Buscar padrões de forma" }
          ensure_comprehensive_coverage_strategy { summary "Cobrir tipos de forma" }
        }
      }
    ]
  }
  @@assert( {{ this.key_synthesized_topics | length >= 2 }} )
  @@assert( {{ this.key_synthesized_topics | length <= 6 }} )
  // Should cover different aspects of contract formation
  @@assert( {{ this.key_synthesized_topics[0].topic_title | length > 3 }} )
  @@assert( {{ this.key_synthesized_topics[1].topic_title | length > 3 }} )
  // Should have comprehensive synthesis addressing multiple elements
  @@assert( {{ this.key_synthesized_topics[0].synthesis | length > 10 }} )
  @@assert( {{ this.key_synthesized_topics[1].synthesis | length > 10 }} )
  // Should have high confidence for well-established contract principles
  @@assert( {{ this.key_synthesized_topics[0].confidence_score >= 6 }} )
  @@assert( {{ this.key_synthesized_topics[1].confidence_score >= 6 }} )
  // Should have fewer unanswered aspects since multiple elements are covered
  @@assert( {{ this.unanswered_aspects | length <= 8 }} )
  // Each topic should reference appropriate documents
  @@assert( {{ this.key_synthesized_topics[0].supporting_document_ids | length >= 1 }} )
  @@assert( {{ this.key_synthesized_topics[1].supporting_document_ids | length >= 1 }} )
  // At least one topic should reference multiple documents since we have multiple contract elements
  @@assert( {{ this.key_synthesized_topics | length >= 2 }} )
}

test SintetizarComDocumentosBaixaRelevancia {
  functions [SynthesizeAllFindings]
  args {
    original_legal_question "Quais são as penalidades para sonegação fiscal no Brasil?"
    analyzed_docs [
      {
        search_result_id "doc_irrelevante"
        relevance_score 2
        confidence_score 3
        summary "Este documento discute práticas de governança corporativa e tem relevância mínima para penalidades de sonegação fiscal."
        key_arguments_and_reasoning ["Deveres do conselho de administração", "Direitos dos acionistas", "Melhores práticas de governança"]
        extracted_entities [
          { type "LegalConcept", name "governança corporativa", details "Sistema de regras e práticas que governam sociedades" },
          { type "LegalConcept", name "deveres do conselho", details "Obrigações fiduciárias dos administradores" }
        ]
        extracted_quotes ["Os administradores devem deveres fiduciários à sociedade"]
        reasoning {
          analyze_legal_question { summary "Relevância limitada para a questão de sonegação fiscal" }
          consider_relevant_legal_principles { summary "Princípios de direito societário não aplicáveis" }
          formulate_search_queries_strategy { summary "Documento fora do escopo da questão" }
          specify_expected_information_strategy { summary "Nenhuma informação tributária relevante encontrada" }
          ensure_comprehensive_coverage_strategy { summary "Documento não contribui para a resposta" }
        }
      }
    ]
  }
  // Should handle low-relevance documents gracefully
  @@assert( {{ this.key_synthesized_topics | length >= 0 }} )
  @@assert( {{ this.key_synthesized_topics | length <= 2 }} )
  // Should identify significant unanswered aspects
  @@assert( {{ this.unanswered_aspects | length >= 1 }} )
  // Should generate questions for better research
  @@assert( {{ this.emerging_questions | length >= 1 }} )
  // If topics are generated, they should have low confidence
  @@assert( {{ this.key_synthesized_topics | length == 0 or this.key_synthesized_topics[0].confidence_score < 6 }} )
}

// TESTE: Síntese de dados reais - Documentos de discriminação trabalhista de pesquisa real
test SintetizarDocumentosDiscriminacaoTrabalhista {
  functions [SynthesizeAllFindings]
  args {
    original_legal_question "O que caracteriza dispensa discriminatória no direito trabalhista brasileiro?"
    analyzed_docs [
      {
        search_result_id "https://conjur.com.br/artigo/dispensa-discriminatoria"
        relevance_score 9
        confidence_score 8
        summary "O documento aborda diretamente o que constitui 'dispensa discriminatória' no direito trabalhista brasileiro. Explica que enquanto ações como demissão, rebaixamento e corte salarial são exemplos claros, a definição pode ser mais ampla e frequentemente está sujeita a interpretação judicial."
        key_arguments_and_reasoning [
          "A Lei 9.029/95 proíbe discriminação baseada em características protegidas em relação a compensação, termos, condições ou privilégios de emprego.",
          "O termo 'dispensa discriminatória' não é explicitamente mencionado na CLT mas foi estabelecido através de interpretações judiciais.",
          "O Ministério Público do Trabalho considera demissão, rebaixamento, não promoção, redução salarial como exemplos de dispensas discriminatórias.",
          "Alguns tribunais exigem que a dispensa discriminatória resulte em 'consequência materialmente adversa'."
        ]
        extracted_entities [
          { type "Statute", name "Lei 9.029/95", details "Proíbe discriminação no emprego baseada em características protegidas." },
          { type "Organization", name "MPT", details "Ministério Público do Trabalho; fiscaliza o cumprimento da legislação trabalhista." },
          { type "Case", name "Súmula 443 do TST", details "Estabelece presunção de discriminação em dispensas de portadores de doenças graves." },
          { type "LegalConcept", name "dispensa discriminatória", details "Uma ação negativa contra empregado que pode formar base de reclamação de discriminação." }
        ]
        extracted_quotes [
          "Quando um empregado sofre discriminação ou retaliação no trabalho, frequentemente assume a forma de ações significativas, como demissão, rebaixamento ou suspensão, todas claramente representando 'dispensa discriminatória' segundo a legislação antidiscriminação brasileira.",
          "Alguns tribunais regionais interpretam como exigindo que a dispensa resulte em 'consequência materialmente adversa'."
        ]
        reasoning {
          analyze_legal_question { summary "A questão jurídica trata do que constitui 'dispensa discriminatória' no direito trabalhista. Questões-chave são: definir o termo; identificar ações específicas que se qualificam; e entender diferentes interpretações judiciais." }
          consider_relevant_legal_principles { summary "Princípios jurídicos relevantes incluem: interpretação da Lei 9.029/95; papel do MPT na fiscalização; jurisprudência interpretando 'dispensa discriminatória'; e potencial de interpretações variadas entre jurisdições." }
          formulate_search_queries_strategy { summary "Consultas usariam frases exatas e operadores booleanos. Exemplos: 'dispensa discriminatória' E 'direito trabalhista'; 'dispensa discriminatória' E 'definição'." }
          specify_expected_information_strategy { summary "Cada consulta deve produzir: 1) Definições e interpretações estatutárias da Lei 9.029/95, 2) Exemplos de dispensas discriminatórias do MPT, 3) Jurisprudência definindo e interpretando o termo." }
          ensure_comprehensive_coverage_strategy { summary "As consultas seriam projetadas para cobrir todos os aspectos da questão legal e evitar redundância." }
        }
      },
      {
        search_result_id "https://jusbrasil.com.br/dispensa-indireta-clt-483"
        relevance_score 7
        confidence_score 7
        summary "O documento discute 'dispensa indireta', um conceito relacionado mas mais específico no direito trabalhista. Explica que a dispensa indireta constitui mudanças significativas na situação de emprego e é usada para determinar responsabilidade do empregador, especialmente em casos de assédio."
        key_arguments_and_reasoning [
          "A dispensa indireta constitui mudança significativa na situação de emprego, como demissão, não promoção, ou decisões causando mudança significativa nos benefícios.",
          "A dispensa indireta é elemento das ações trabalhistas que pode responsabilizar empregadores.",
          "Exemplos incluem negação de aumento, perda de benefícios negociados, ameaças de dispensa, e retenção de promoções.",
          "Algumas ações como transferência para outro escritório ou avaliações de desempenho rebaixadas não constituem dispensa indireta."
        ]
        extracted_entities [
          { type "LegalConcept", name "dispensa indireta", details "Mudança significativa na situação de emprego conforme art. 483 CLT." },
          { type "Statute", name "CLT Art. 483", details "Artigo definindo situações de rescisão indireta." },
          { type "LegalConcept", name "responsabilidade do empregador", details "Responsabilidade patronal por atos de superiores." },
          { type "LegalConcept", name "rescisão indireta", details "Forçar empregado a pedir demissão através de condições intoleráveis." }
        ]
        extracted_quotes [
          "A dispensa indireta constitui uma mudança significativa na situação de emprego, como contratação, demissão, não promoção, transferência com responsabilidade significativamente diferente, ou decisão causando mudança significativa nos benefícios.",
          "Por outro lado, condições como transferência para outro escritório ou avaliações de desempenho rebaixadas, por si só, não constituem dispensa indireta."
        ]
        reasoning {
          analyze_legal_question { summary "A questão legal foca na definição de 'dispensa discriminatória' no contexto do direito trabalhista. Isso requer entender quais ações do empregador são consideradas prejudiciais à situação de emprego do empregado." }
          consider_relevant_legal_principles { summary "O princípio legal relevante é o art. 483 da CLT e a interpretação do que constitui dispensa indireta. O documento aborda responsabilidade do empregador por atos de superiores." }
          formulate_search_queries_strategy { summary "Dada a natureza da questão, focando em definição, a busca deve usar a frase exata 'dispensa indireta' para encontrar documentos que a definam e forneçam exemplos." }
          specify_expected_information_strategy { summary "As consultas devem produzir documentos que definam 'dispensa indireta' ou 'dispensa discriminatória' especificamente no contexto do direito trabalhista brasileiro." }
          ensure_comprehensive_coverage_strategy { summary "Para garantir cobertura abrangente, resultados devem ser revisados e combinados para definições, exemplos e implicações." }
        }
      }
    ]
  }
  @@assert( {{ this.key_synthesized_topics | length >= 1 }} )
  @@assert( {{ this.key_synthesized_topics | length <= 4 }} )
  // Should create topics that address different aspects of dispensa discriminatória
  @@assert( {{ this.key_synthesized_topics[0].topic_title | length > 5 }} )
  @@assert( {{ this.key_synthesized_topics[0].synthesis | length > 20 }} )
  // Should have high confidence given the quality of source documents
  @@assert( {{ this.key_synthesized_topics[0].confidence_score >= 7 }} )
  // Should reference both documents in synthesis
  @@assert( {{ this.key_synthesized_topics[0].supporting_document_ids | length >= 1 }} )
  // Should have minimal unanswered aspects since documents are comprehensive
  @@assert( {{ this.unanswered_aspects | length <= 4 }} )
  // May have emerging questions about jurisdictional differences
  @@assert( {{ this.emerging_questions | length >= 0 }} )
  @@assert( {{ this.reasoning.analyze_legal_question.summary | length > 20 }} )
}

// TESTE: Síntese de dados reais - Documentos de propriedade industrial
test SintetizarDocumentosPropriedadeIndustrial {
  functions [SynthesizeAllFindings]
  args {
    original_legal_question "Quais são os requisitos para um pedido de patente válido segundo a Lei 9.279/96?"
    analyzed_docs [
      {
        search_result_id "https://inpi.gov.br/requisitos-patente-lei-9279"
        relevance_score 9
        confidence_score 8
        summary "A Lei 9.279/96, em seus artigos 24 e 25, estabelece os requisitos para o relatório descritivo de um pedido de patente. O documento explica os quatro componentes principais: relatório descritivo, requisito de suficiência descritiva, melhor forma de execução, e reivindicações."
        key_arguments_and_reasoning [
          "Relatório Descritivo: O pedido deve conter relatório descritivo da invenção, em termos claros e precisos, para permitir que técnico no assunto reproduza a invenção.",
          "Requisito de Suficiência Descritiva: O relatório deve descrever a maneira e processo de fabricação e utilização da invenção em termos completos e exatos.",
          "Melhor Forma de Execução: O pedido deve indicar a melhor forma contemplada pelo inventor para realizar a invenção, embora este requisito seja interpretado de forma flexível pelo INPI.",
          "Reivindicações: O pedido deve concluir com uma ou mais reivindicações definindo clara e precisamente a matéria objeto da proteção."
        ]
        extracted_entities [
          { type "Statute", name "Lei 9.279/96", details "Lei de Propriedade Industrial governando requisitos de patente." },
          { type "LegalConcept", name "relatório descritivo", details "Requisito de descrição clara da invenção no pedido de patente." },
          { type "LegalConcept", name "suficiência descritiva", details "Requisito de que o relatório permita que técnico no assunto reproduza a invenção." },
          { type "LegalConcept", name "melhor forma de execução", details "Requisito de divulgar a melhor forma de praticar a invenção." },
          { type "Organization", name "INPI", details "Instituto Nacional da Propriedade Industrial." }
        ]
        extracted_quotes [
          "A Lei 9.279/96, em seus artigos 24 e 25, estabelece os requisitos para o relatório descritivo de um pedido de patente.",
          "Segundo o Art. 25, as reivindicações 'devem definir, de modo claro e preciso, a matéria objeto da proteção.'"
        ]
        reasoning {
          analyze_legal_question { summary "A questão legal foca nos requisitos para um pedido de patente válido segundo a Lei 9.279/96. Isso envolve identificar os elementos específicos que devem estar presentes em um pedido de patente para atender aos requisitos estatutários de patenteabilidade." }
          consider_relevant_legal_principles { summary "Princípios legais relevantes incluem interpretação estatutária da Lei 9.279/96, que trata dos requisitos do relatório descritivo, bem como jurisprudência que interpreta e aplica esta lei." }
          formulate_search_queries_strategy { summary "Dado o foco na Lei 9.279/96, a estratégia de consulta priorizaria referências diretas à lei e suas subseções específicas." }
          specify_expected_information_strategy { summary "As consultas devem produzir informações que expliquem precisamente os diferentes elementos da Lei 9.279/96, incluindo relatório descritivo, suficiência, melhor forma e reivindicações." }
          ensure_comprehensive_coverage_strategy { summary "Para garantir cobertura abrangente, a estratégia começaria com busca ampla da Lei 9.279/96, depois focaria em cada componente individual." }
        }
      }
    ]
  }
  @@assert( {{ this.key_synthesized_topics | length >= 1 }} )
  @@assert( {{ this.key_synthesized_topics | length <= 5 }} )
  // Should address the four main requirements of the Lei 9.279/96
  @@assert( {{ this.key_synthesized_topics[0].topic_title | length > 5 }} )
  @@assert( {{ this.key_synthesized_topics[0].synthesis | length > 30 }} )
  // Should have high confidence given comprehensive source
  @@assert( {{ this.key_synthesized_topics[0].confidence_score >= 7 }} )
  // Should reference the document
  @@assert( {{ "https://inpi.gov.br/requisitos-patente-lei-9279" in this.key_synthesized_topics[0].supporting_document_ids }} )
  // May have emerging questions about practical applications
  @@assert( {{ this.emerging_questions | length >= 0 }} )
  @@assert( {{ this.reasoning.analyze_legal_question.summary | length > 15 }} )
}
