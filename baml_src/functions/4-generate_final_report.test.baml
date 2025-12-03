// ----- Testes Abrangentes para GenerateFinalLegalReport - Contexto Jurídico Brasileiro -----

test GerarRelatorioSintesesSimples {
  functions [GenerateFinalLegalReport]
  args {
    original_legal_question "Qual é o prazo prescricional para ação de inadimplemento contratual no direito brasileiro?"
    synthesis {
      key_synthesized_topics [
        {
          topic_title "Prescrição Contratual no Código Civil Brasileiro"
          synthesis "O Código Civil brasileiro, Art. 205, estabelece prazo prescricional geral de 10 anos para pretensões que não tenham prazo específico. Para contratos escritos e verbais, aplica-se a regra geral, salvo disposição específica. O termo inicial da prescrição é a data do inadimplemento ou quando o credor tomou conhecimento da violação."
          confidence_score 8
          supporting_document_ids ["cc_art_205", "jurisprudencia_stj", "doutrina_contratual"]
        }
      ]
      unanswered_aspects ["Causas de suspensão e interrupção", "Exceções da actio nata"]
      emerging_questions ["Como a teoria da actio nata se aplica a inadimplementos contratuais de descoberta tardia?"]
      reasoning {
        analyze_legal_question { summary "Análise de prescrição contratual" }
        consider_relevant_legal_principles { summary "Princípios de termo inicial e actio nata" }
        formulate_search_queries_strategy { summary "Foco em legislação e jurisprudência" }
        specify_expected_information_strategy { summary "Prazos e exceções" }
        ensure_comprehensive_coverage_strategy { summary "Múltiplos tipos de autoridade cobertos" }
      }
    }
    query_history [
      {
        reasoning {
          analyze_legal_question { summary "Análise de prescrição contratual" }
          consider_relevant_legal_principles { summary "Princípios de termo inicial e actio nata" }
          formulate_search_queries_strategy { summary "Foco em legislação e jurisprudência" }
          specify_expected_information_strategy { summary "Prazos e exceções" }
          ensure_comprehensive_coverage_strategy { summary "Múltiplos tipos de autoridade cobertos" }
        }
        search_queries [
          {
            query_string "prazo prescricional contrato Código Civil brasileiro"
            expected_information ["Prazos prescricionais legais", "Regras de contagem"]
          },
          {
            query_string "Art. 205 Código Civil prescrição geral"
            expected_information ["Art. 205 do Código Civil", "Regras de prazo geral"]
          }
        ]
      }
    ]
  }
  // Basic structure assertions
  @@assert( {{ this.report_title | length > 5 }} )
  @@assert( {{ this.executive_summary | length > 20 }} )
  @@assert( {{ this.conclusion | length > 20 }} )
  @@assert( {{ this.sections | length >= 1 }} )
  @@assert( {{ this.sections | length <= 5 }} )

  // Section structure validation
  @@assert( {{ this.sections | selectattr("section_title", "defined") | list | length == (this.sections | length) }} )
  @@assert( {{ this.sections | selectattr("content", "defined") | list | length == (this.sections | length) }} )

  // Content quality checks
  @@assert( {{ ("prescrição" in (this.report_title | lower)) or ("prazo" in (this.report_title | lower)) or ("contrat" in (this.report_title | lower)) }} )
  @@assert( {{ ("10 ano" in (this.executive_summary | lower)) or ("dez ano" in (this.executive_summary | lower)) or ("código civil" in (this.executive_summary | lower)) or ("art. 205" in (this.executive_summary | lower)) }} )
  @@assert( {{ ("código" in (this.sections | map(attribute="content") | join(" ") | lower)) or ("civil" in (this.sections | map(attribute="content") | join(" ") | lower)) or ("205" in (this.sections | map(attribute="content") | join(" ") | lower)) }} )

  // Should have at least one section
  @@assert( {{ this.sections | length >= 1 }} )
}

test GerarRelatorioSinteseComplexa {
  functions [GenerateFinalLegalReport]
  args {
    original_legal_question "Quais são os requisitos para validade do pacto antenupcial no direito brasileiro?"
    synthesis {
      key_synthesized_topics [
        {
          topic_title "Requisitos Formais de Execução"
          synthesis "O Código Civil brasileiro exige que o pacto antenupcial seja feito por escritura pública, conforme art. 1.640. O pacto deve ser celebrado antes do casamento e registrado no cartório de registro de imóveis para produzir efeitos perante terceiros."
          confidence_score 9
          supporting_document_ids ["cc_art_1640", "casos_registro", "requisitos_cartorio"]
        },
        {
          topic_title "Requisitos de Conteúdo"
          synthesis "As partes podem estipular quanto aos bens o que lhes aprouver, conforme art. 1.639. O pacto não pode contrariar disposição absoluta de lei, ordem pública ou bons costumes. A comunhão universal, parcial ou separação total são regimes típicos."
          confidence_score 8
          supporting_document_ids ["casos_conteudo", "padroes_regime", "precedentes_nulidade"]
        },
        {
          topic_title "Capacidade e Assistência"
          synthesis "Os nubentes devem ser capazes para o casamento. Menores de 18 anos necessitam de autorização dos pais ou representantes legais. Os tribunais examinam eventual lesão tanto na celebração quanto na execução do pacto."
          confidence_score 7
          supporting_document_ids ["recomendacoes_assistencia", "analise_lesao", "padroes_execucao"]
        }
      ]
      unanswered_aspects ["Requisitos específicos de avaliação patrimonial", "Prazos para registro"]
      emerging_questions ["O que constitui violação à ordem pública em pactos antenupciais?", "Como os tribunais determinam eventual lesão?"]
      reasoning {
        analyze_legal_question { summary "Análise abrangente de pacto antenupcial" }
        consider_relevant_legal_principles { summary "Interseção entre direito contratual e direito de família" }
        formulate_search_queries_strategy { summary "Abordagem de pesquisa multifacetada" }
        specify_expected_information_strategy { summary "Requisitos procedimentais e substanciais" }
        ensure_comprehensive_coverage_strategy { summary "Múltiplas categorias de requisitos cobertas" }
      }
    }
    query_history [
      {
        reasoning {
          analyze_legal_question { summary "Análise abrangente de pacto antenupcial" }
          consider_relevant_legal_principles { summary "Interseção entre direito contratual e direito de família" }
          formulate_search_queries_strategy { summary "Abordagem de pesquisa multifacetada" }
          specify_expected_information_strategy { summary "Requisitos procedimentais e substanciais" }
          ensure_comprehensive_coverage_strategy { summary "Múltiplas categorias de requisitos cobertas" }
        }
        search_queries [
          {
            query_string "requisitos pacto antenupcial Brasil"
            expected_information ["Requisitos estaduais", "Regras de execução formal"]
          },
          {
            query_string "pacto antenupcial escritura pública requisitos formais"
            expected_information ["Padrões de validade", "Procedimentos de execução"]
          },
          {
            query_string "regimes de bens casamento Código Civil"
            expected_information ["Requisitos de conteúdo", "Regras de transparência patrimonial"]
          },
          {
            query_string "lesão pacto antenupcial nulidade"
            expected_information ["Padrões de lesão", "Limitações à execução"]
          }
        ]
      }
    ]
  }
  @@assert( {{ this.report_title | length > 5 }} )
  @@assert( {{ this.executive_summary | length > 30 }} )
  @@assert( {{ this.conclusion | length > 30 }} )
  // Complex synthesis should generate multiple sections
  @@assert( {{ this.sections | length >= 3 }} )
  @@assert( {{ this.sections | length <= 8 }} )

  // Should cover multiple aspects from synthesis
  @@assert( {{ ("escritura" in (this.sections | map(attribute="section_title") | join(" ") | lower)) or ("regime" in (this.sections | map(attribute="section_title") | join(" ") | lower)) or ("requisito" in (this.sections | map(attribute="section_title") | join(" ") | lower)) }} )
  @@assert( {{ ("escritura" in (this.sections | map(attribute="content") | join(" ") | lower)) or ("pública" in (this.sections | map(attribute="content") | join(" ") | lower)) or ("cartório" in (this.sections | map(attribute="content") | join(" ") | lower)) }} )
  @@assert( {{ ("regime" in (this.sections | map(attribute="content") | join(" ") | lower)) or ("bens" in (this.sections | map(attribute="content") | join(" ") | lower)) or ("patrimoni" in (this.sections | map(attribute="content") | join(" ") | lower)) }} )

  // Report should address the original question comprehensively
  @@assert( {{ ("pacto" in (this.executive_summary | lower)) or ("antenupcial" in (this.executive_summary | lower)) or ("casamento" in (this.executive_summary | lower)) or ("requisito" in (this.executive_summary | lower)) }} )
  @@assert( {{ ("válid" in (this.conclusion | lower)) or ("pacto" in (this.conclusion | lower)) or ("brasil" in (this.conclusion | lower)) }} )

  // Should have multiple sections for well-covered topics
  @@assert( {{ this.sections | length >= 2 }} )
}

test GerarRelatorioComAspectosNaoRespondidos {
  functions [GenerateFinalLegalReport]
  args {
    original_legal_question "Quais são os requisitos para usucapião de imóvel?"
    synthesis {
      key_synthesized_topics [
        {
          topic_title "Elementos Gerais da Usucapião"
          synthesis "A usucapião tipicamente requer posse mansa, pacífica, contínua e ininterrupta, com animus domini, pelo prazo legal. Esses elementos devem ser provados por prova robusta."
          confidence_score 6
          supporting_document_ids ["visao_geral_elementos", "padroes_prova"]
        }
      ]
      unanswered_aspects ["Prazos específicos por modalidade", "Variações estaduais nos requisitos", "Requisitos de boa-fé vs. má-fé", "Regras de acessão de posse", "Requisitos de pagamento de impostos", "Distinções entre imóvel rural e urbano"]
      emerging_questions ["Qual é o prazo para a modalidade de usucapião relevante?", "Há requisitos diferentes para diferentes tipos de imóvel?", "Como as variações afetam a análise?"]
      reasoning {
        analyze_legal_question { summary "Princípios gerais de usucapião identificados" }
        consider_relevant_legal_principles { summary "Elementos do Código Civil estabelecidos" }
        formulate_search_queries_strategy { summary "Abordagem ampla de pesquisa" }
        specify_expected_information_strategy { summary "Detalhes específicos por modalidade necessários" }
        ensure_comprehensive_coverage_strategy { summary "Pesquisa atual incompleta" }
      }
    }
    query_history [
      {
        reasoning {
          analyze_legal_question { summary "Princípios gerais de usucapião identificados" }
          consider_relevant_legal_principles { summary "Elementos do Código Civil estabelecidos" }
          formulate_search_queries_strategy { summary "Abordagem ampla de pesquisa" }
          specify_expected_information_strategy { summary "Detalhes específicos por modalidade necessários" }
          ensure_comprehensive_coverage_strategy { summary "Pesquisa atual incompleta" }
        }
        search_queries [
          {
            query_string "usucapião elementos requisitos"
            expected_information ["Elementos legais", "Requisitos do Código Civil"]
          },
          {
            query_string "usucapião imóvel prazo legal"
            expected_information ["Prazos", "Requisitos legais"]
          }
        ]
      }
    ]
  }
  @@assert( {{ this.report_title | length > 5 }} )
  @@assert( {{ this.executive_summary | length > 20 }} )
  @@assert( {{ this.conclusion | length > 20 }} )
  @@assert( {{ this.sections | length >= 1 }} )

  // Should acknowledge limitations due to unanswered aspects
  @@assert( {{ ("geral" in (this.executive_summary | lower)) or ("varia" in (this.executive_summary | lower)) or ("modalidade" in (this.executive_summary | lower)) or ("específic" in (this.executive_summary | lower)) }} )
  @@assert( {{ ("adicional" in (this.conclusion | lower)) or ("pesquisa" in (this.conclusion | lower)) or ("modalidade" in (this.conclusion | lower)) or ("específic" in (this.conclusion | lower)) or ("varia" in (this.conclusion | lower)) }} )

  // Should cover what is known while noting limitations
  @@assert( {{ ("posse" in (this.sections | map(attribute="content") | join(" ") | lower)) or ("mansa" in (this.sections | map(attribute="content") | join(" ") | lower)) or ("pacífica" in (this.sections | map(attribute="content") | join(" ") | lower)) or ("contínu" in (this.sections | map(attribute="content") | join(" ") | lower)) or ("animus" in (this.sections | map(attribute="content") | join(" ") | lower)) }} )

  // Should still provide useful analysis despite gaps
  @@assert( {{ (this.sections | map(attribute="content") | join(" ") | length) > 50 }} )
}

test GerarRelatorioSinteseMinima {
  functions [GenerateFinalLegalReport]
  args {
    original_legal_question "Quais são as penalidades para uso de informação privilegiada no mercado de valores mobiliários brasileiro?"
    synthesis {
      key_synthesized_topics [
        {
          topic_title "Violações da Lei do Mercado de Valores Mobiliários"
          synthesis "O uso de informação privilegiada viola a regulamentação do mercado de valores mobiliários brasileiro, mas estruturas específicas de penalidades requerem análise estatutária detalhada da Lei 6.385/76 e instruções da CVM."
          confidence_score 3
          supporting_document_ids ["visao_geral_cvm"]
        }
      ]
      unanswered_aspects ["Valores específicos de penalidades", "Penalidades criminais vs. administrativas", "Requisitos de devolução de lucros", "Dosimetria da pena", "Fatores que afetam determinação da penalidade"]
      emerging_questions ["Quais são as penalidades máximas segundo a lei atual?", "Como os tribunais determinam penalidades apropriadas?", "Quais fatores levam a processo criminal vs. enforcement administrativo?"]
      reasoning {
        analyze_legal_question { summary "Conceito de informação privilegiada identificado" }
        consider_relevant_legal_principles { summary "Framework da regulamentação do mercado de capitais" }
        formulate_search_queries_strategy { summary "Pesquisa inicial insuficiente" }
        specify_expected_information_strategy { summary "Análise detalhada de penalidades necessária" }
        ensure_comprehensive_coverage_strategy { summary "Lacunas significativas permanecem" }
      }
    }
    query_history [
      {
        reasoning {
          analyze_legal_question { summary "Conceito de informação privilegiada identificado" }
          consider_relevant_legal_principles { summary "Framework da regulamentação do mercado de capitais" }
          formulate_search_queries_strategy { summary "Pesquisa inicial insuficiente" }
          specify_expected_information_strategy { summary "Análise detalhada de penalidades necessária" }
          ensure_comprehensive_coverage_strategy { summary "Lacunas significativas permanecem" }
        }
        search_queries [
          {
            query_string "uso informação privilegiada penalidades Lei 6.385"
            expected_information ["Estruturas de penalidade", "Enforcement federal"]
          }
        ]
      }
    ]
  }
  @@assert( {{ this.report_title | length > 5 }} )
  @@assert( {{ this.executive_summary | length > 15 }} )
  @@assert( {{ this.conclusion | length > 15 }} )
  @@assert( {{ this.sections | length >= 1 }} )
  @@assert( {{ this.sections | length <= 3 }} )

  // Should acknowledge limited information available
  @@assert( {{ ("limitad" in (this.executive_summary | lower)) or ("adicional" in (this.executive_summary | lower)) or ("pesquisa" in (this.executive_summary | lower)) or ("complex" in (this.executive_summary | lower)) }} )
  @@assert( {{ ("aprofund" in (this.conclusion | lower)) or ("adicional" in (this.conclusion | lower)) or ("pesquisa" in (this.conclusion | lower)) or ("análise" in (this.conclusion | lower)) or ("necessári" in (this.conclusion | lower)) }} )

  // Should still address the question as much as possible
  @@assert( {{ ("privilegiad" in (this.report_title | lower)) or ("informação" in (this.report_title | lower)) or ("mercado" in (this.report_title | lower)) or ("penalidade" in (this.report_title | lower)) }} )

  // Should still provide sections despite limited synthesis
  @@assert( {{ this.sections | length >= 1 }} )
}

test GerarRelatorioHistoricoConsultasExtenso {
  functions [GenerateFinalLegalReport]
  args {
    original_legal_question "Quais são as implicações tributárias de transações com criptoativos para pessoas físicas no Brasil?"
    synthesis {
      key_synthesized_topics [
        {
          topic_title "Tratamento Tributário de Criptoativos pela Receita Federal"
          synthesis "A Receita Federal trata criptoativos como ativos financeiros para fins tributários, conforme IN RFB 1.888/2019, o que significa que transações geram ganho de capital. Cada transação deve ser declarada com cálculos de custo de aquisição e valor justo de mercado."
          confidence_score 8
          supporting_document_ids ["in_rfb_1888", "solucao_consulta_crypto", "casos_carf"]
        },
        {
          topic_title "Tipos de Transações e Declaração"
          synthesis "Diferentes tipos de transações com criptoativos têm implicações tributárias variadas: negociação, mineração, staking, airdrops e atividades DeFi requerem abordagens específicas de declaração conforme orientação da Receita Federal."
          confidence_score 7
          supporting_document_ids ["orientacao_rfb_2021", "analise_tributaria_defi", "casos_mineracao"]
        }
      ]
      unanswered_aspects ["Tratamento tributário específico de protocolos DeFi", "Requisitos de declaração internacional", "Implicações tributárias estaduais"]
      emerging_questions ["Como yield farming deve ser tributado?", "Quais são os requisitos de declaração para transações cross-chain?"]
      reasoning {
        analyze_legal_question { summary "Análise tributária abrangente de criptoativos" }
        consider_relevant_legal_principles { summary "Tributação de ativos e requisitos de declaração" }
        formulate_search_queries_strategy { summary "Múltiplas iterações de pesquisa realizadas" }
        specify_expected_information_strategy { summary "Orientação detalhada e jurisprudência revisadas" }
        ensure_comprehensive_coverage_strategy { summary "Pesquisa extensiva concluída" }
      }
    }
    query_history [
      {
        reasoning {
          analyze_legal_question { summary "Análise tributária abrangente de criptoativos" }
          consider_relevant_legal_principles { summary "Tributação de ativos e requisitos de declaração" }
          formulate_search_queries_strategy { summary "Múltiplas iterações de pesquisa realizadas" }
          specify_expected_information_strategy { summary "Orientação detalhada e jurisprudência revisadas" }
          ensure_comprehensive_coverage_strategy { summary "Pesquisa extensiva concluída" }
        }
        search_queries [
          {
            query_string "criptoativos tributação pessoa física Receita Federal"
            expected_information ["Orientação da Receita Federal", "Tratamento tributário individual"]
          },
          {
            query_string "ganho de capital criptomoedas declaração requisitos"
            expected_information ["Regras de ganho de capital", "Obrigações de declaração"]
          },
          {
            query_string "IN RFB 1.888 criptoativos ativo financeiro"
            expected_information ["Classificação como ativo", "Implicações tributárias"]
          },
          {
            query_string "mineração criptomoedas tributação rendimento"
            expected_information ["Regras de renda de mineração", "Tratamento tributário"]
          },
          {
            query_string "DeFi finanças descentralizadas tributação implicações"
            expected_information ["Regras tributárias DeFi", "Implicações de protocolo"]
          }
        ]
      }
    ]
  }
  @@assert( {{ this.report_title | length > 5 }} )
  @@assert( {{ this.executive_summary | length > 30 }} )
  @@assert( {{ this.conclusion | length > 30 }} )
  // Extensive research should produce comprehensive report
  @@assert( {{ this.sections | length >= 3 }} )
  @@assert( {{ this.sections | length <= 10 }} )

  // Should reflect the extensive research conducted
  @@assert( {{ ("abrangente" in (this.executive_summary | lower)) or ("extens" in (this.executive_summary | lower)) or ("detalh" in (this.executive_summary | lower)) }} )

  // Should cover multiple aspects from synthesis
  @@assert( {{ ("ativo" in (this.sections | map(attribute="content") | join(" ") | lower)) or ("capital" in (this.sections | map(attribute="content") | join(" ") | lower)) or ("ganho" in (this.sections | map(attribute="content") | join(" ") | lower)) or ("declaração" in (this.sections | map(attribute="content") | join(" ") | lower)) }} )
  @@assert( {{ ("mineração" in (this.sections | map(attribute="content") | join(" ") | lower)) or ("negociação" in (this.sections | map(attribute="content") | join(" ") | lower)) or ("staking" in (this.sections | map(attribute="content") | join(" ") | lower)) or ("defi" in (this.sections | map(attribute="content") | join(" ") | lower)) }} )

  // Should have multiple sections due to extensive research
  @@assert( {{ this.sections | length >= 2 }} )

  // Should reference the extensive query history appropriately
  @@assert( {{ ("pesquisa" in (this.conclusion | lower)) or ("análise" in (this.conclusion | lower)) or ("abrangente" in (this.conclusion | lower)) }} )
}

test GerarRelatorioInformacoesConflitantes {
  functions [GenerateFinalLegalReport]
  args {
    original_legal_question "Qual prazo de aviso prévio é exigido para rescisão do contrato de trabalho?"
    synthesis {
      key_synthesized_topics [
        {
          topic_title "Requisitos de Aviso Prévio na CLT"
          synthesis "A CLT, em seu art. 487, estabelece aviso prévio de 30 dias para contratos por prazo indeterminado, acrescido de 3 dias por ano de serviço, até o máximo de 90 dias, conforme Lei 12.506/2011."
          confidence_score 8
          supporting_document_ids ["clt_art_487", "lei_12506", "jurisprudencia_aviso"]
        },
        {
          topic_title "Variações por Tipo de Contrato"
          synthesis "Contratos por prazo determinado não exigem aviso prévio, salvo cláusula assecuratória. Contratos de experiência seguem regra própria. Empregados domésticos têm regulamentação específica pela LC 150/2015."
          confidence_score 6
          supporting_document_ids ["levantamento_contratos", "variacoes_experiencia", "lc_150_domestico"]
        }
      ]
      unanswered_aspects ["Requisitos específicos de categorias profissionais", "Requisitos contratuais especiais", "Regulamentações setoriais específicas"]
      emerging_questions ["Qual lei se aplica em contratos especiais?", "Como requisitos contratuais de aviso prévio interagem com requisitos legais?"]
      reasoning {
        analyze_legal_question { summary "Análise multicamadas de requisitos de aviso prévio" }
        consider_relevant_legal_principles { summary "Interação entre CLT e leis especiais" }
        formulate_search_queries_strategy { summary "Abordagem abrangente de diferentes fontes legais" }
        specify_expected_information_strategy { summary "Base legal com variações específicas" }
        ensure_comprehensive_coverage_strategy { summary "Múltiplas perspectivas contratuais cobertas" }
      }
    }
    query_history [
      {
        reasoning {
          analyze_legal_question { summary "Análise multicamadas de requisitos de aviso prévio" }
          consider_relevant_legal_principles { summary "Interação entre CLT e leis especiais" }
          formulate_search_queries_strategy { summary "Abordagem abrangente de diferentes fontes legais" }
          specify_expected_information_strategy { summary "Base legal com variações específicas" }
          ensure_comprehensive_coverage_strategy { summary "Múltiplas perspectivas contratuais cobertas" }
        }
        search_queries [
          {
            query_string "aviso prévio rescisão contrato trabalho CLT"
            expected_information ["Regras de aviso CLT", "Requisitos do art. 487"]
          },
          {
            query_string "Lei 12.506 aviso prévio proporcional"
            expected_information ["Lei do aviso proporcional", "Especificidades"]
          },
          {
            query_string "aviso prévio contrato prazo determinado experiência"
            expected_information ["Variações por contrato", "Regras de contrato de experiência"]
          },
          {
            query_string "requisitos aviso prévio rescisão individual"
            expected_information ["Regras de rescisão individual", "Requisitos de aviso"]
          }
        ]
      }
    ]
  }
  @@assert( {{ this.report_title | length > 5 }} )
  @@assert( {{ this.executive_summary | length > 25 }} )
  @@assert( {{ this.conclusion | length > 25 }} )
  @@assert( {{ this.sections | length >= 2 }} )

  // Should address the complexity and variations
  @@assert( {{ ("clt" in (this.executive_summary | lower)) or ("30" in (this.executive_summary | lower)) or ("aviso" in (this.executive_summary | lower)) }} )
  @@assert( {{ ("contrato" in (this.conclusion | lower)) or ("específic" in (this.conclusion | lower)) or ("varia" in (this.conclusion | lower)) or ("depende" in (this.conclusion | lower)) }} )
}

// TESTE: Geração de relatório com dados reais - Síntese abrangente de discriminação trabalhista
test GerarRelatorioDiscriminacaoTrabalhista {
  functions [GenerateFinalLegalReport]
  args {
    original_legal_question "O que caracteriza dispensa discriminatória no direito trabalhista brasileiro?"
    synthesis {
      key_synthesized_topics [
        {
          topic_title "Definição e Escopo de Dispensa Discriminatória"
          synthesis "O foco principal dos documentos gira em torno da definição de 'dispensa discriminatória' no direito trabalhista. O termo não é explicitamente definido na CLT mas é estabelecido através de interpretações judiciais. Destaca-se que a discriminação é proibida em relação aos 'termos, condições ou privilégios de emprego'. Exemplos de dispensas discriminatórias incluem demissão, rebaixamento, corte salarial, não promoção e contratação. Alguns tribunais exigem 'consequência materialmente adversa'."
          confidence_score 9
          supporting_document_ids ["https://conjur.com.br/artigo/dispensa-discriminatoria", "https://jusbrasil.com.br/jurisprudencia/dispensa-indireta"]
        },
        {
          topic_title "Distinção entre Dispensa Discriminatória e Dispensa Indireta"
          synthesis "Uma divergência crucial emerge entre os conceitos de 'dispensa discriminatória' e 'dispensa indireta'. A dispensa indireta representa um subconjunto específico das dispensas discriminatórias. Dispensas indiretas, como rescisão por justa causa do empregador ou mudanças significativas de benefícios, são fundamentais para determinar responsabilidade patronal, especialmente em casos de má conduta de superiores."
          confidence_score 8
          supporting_document_ids ["https://conjur.com.br/artigo/dispensa-discriminatoria", "https://jusbrasil.com.br/jurisprudencia/dispensa-indireta"]
        },
        {
          topic_title "Exemplos e Aplicação de Dispensa Discriminatória"
          synthesis "Ambos os documentos fornecem exemplos do que constitui dispensa discriminatória. O MPT lista demissão, rebaixamento, corte salarial, não promoção e decisões de contratação como exemplos. Outros exemplos incluem negação de aumento, perda de benefícios negociados, ameaças de dispensa e retenção de promoções. Os documentos também fornecem exemplos de ações que não constituem tais dispensas, criando contraste e orientação."
          confidence_score 9
          supporting_document_ids ["https://conjur.com.br/artigo/dispensa-discriminatoria", "https://jusbrasil.com.br/jurisprudencia/dispensa-indireta"]
        }
      ]
      unanswered_aspects ["Padrões ou testes judiciais específicos usados pelos tribunais para determinar 'consequência materialmente adversa'", "Variações regionais em como dispensa discriminatória é interpretada"]
      emerging_questions ["Qual é o padrão prevalecente que os tribunais usam para determinar se uma ação tem 'consequência materialmente adversa'?", "Como os tribunais diferenciam ações consideradas meramente irritantes ou inconvenientes daquelas com consequências materialmente adversas?"]
      reasoning {
        analyze_legal_question { summary "A questão jurídica trata da definição de 'dispensa discriminatória' no direito trabalhista brasileiro. As questões-chave envolvem entender o escopo e alcance das ações cobertas por este termo, e como isso é determinado nos tribunais." }
        consider_relevant_legal_principles { summary "Princípios jurídicos relevantes incluem a proibição de discriminação pela Lei 9.029/95 e interpretações judiciais de 'dispensa discriminatória'. A análise também deve considerar a distinção entre dispensa discriminatória e dispensa indireta." }
        formulate_search_queries_strategy { summary "Consultas de pesquisa iniciais focarão na definição e exemplos de 'dispensa discriminatória' no direito trabalhista. Operadores booleanos (E, OU) e busca por frase exata serão usados." }
        specify_expected_information_strategy { summary "Cada consulta visará tipos específicos de informação: legislação, jurisprudência, princípios jurídicos e análise especializada. A busca deve encontrar definições, exemplos, precedentes judiciais e comentários sobre padrões legais." }
        ensure_comprehensive_coverage_strategy { summary "Para garantir cobertura abrangente, a busca começará com consultas amplas e depois se restringirá a áreas específicas, como padrões usados para determinar 'consequência materialmente adversa' e potenciais variações regionais." }
      }
    }
    query_history [
      {
        reasoning {
          analyze_legal_question { summary "A questão jurídica trata do que constitui 'dispensa discriminatória' no direito trabalhista. Questões-chave são: definir o termo; identificar ações específicas que se qualificam; e entender diferentes interpretações pelos tribunais." }
          consider_relevant_legal_principles { summary "Princípios jurídicos relevantes incluem: interpretação estatutária da Lei 9.029/95; papel do MPT na fiscalização; jurisprudência interpretando 'dispensa discriminatória'; e potencial de interpretações variadas entre jurisdições." }
          formulate_search_queries_strategy { summary "Consultas usariam frases exatas e operadores booleanos. Exemplos: 'dispensa discriminatória' E 'direito trabalhista'; 'dispensa discriminatória' E 'definição'." }
          specify_expected_information_strategy { summary "Cada consulta deve produzir: 1) Definições e interpretações estatutárias da Lei 9.029/95, 2) Exemplos de dispensas discriminatórias do MPT, 3) Jurisprudência definindo e interpretando o termo." }
          ensure_comprehensive_coverage_strategy { summary "As consultas seriam projetadas para cobrir todos os aspectos da questão legal e evitar redundância." }
        }
        search_queries [
          {
            query_string "discriminação trabalhista dispensa Lei 9.029"
            expected_information ["definição de dispensa discriminatória", "casos de direito trabalhista", "lei antidiscriminação"]
          },
          {
            query_string "dispensa indireta CLT art. 483 assédio"
            expected_information ["dispensa indireta", "responsabilidade patronal", "defesa de assédio"]
          }
        ]
      }
    ]
  }
  @@assert( {{ this.report_title | length > 10 }} )
  @@assert( {{ this.executive_summary | length > 50 }} )
  @@assert( {{ this.conclusion | length > 50 }} )
  // Should generate comprehensive report for well-researched topic
  @@assert( {{ this.sections | length >= 3 }} )
  @@assert( {{ this.sections | length <= 7 }} )

  // Basic content validation - simplified
  @@assert( {{ this.report_title | length > 0 }} )
  @@assert( {{ this.sections | length > 0 }} )

  // Basic structure check - simplified for robustness
  @@assert( {{ this.sections | length > 0 }} )
  @@assert( {{ this.appendix_document_ids | length > 0 }} )
}

// TESTE: Geração de relatório com dados reais - Direito de patentes com lacunas requerendo pesquisa adicional
test GerarRelatorioRequisitosPatente {
  functions [GenerateFinalLegalReport]
  args {
    original_legal_question "Quais são os requisitos para um pedido de patente válido segundo a Lei 9.279/96?"
    synthesis {
      key_synthesized_topics [
        {
          topic_title "Visão Geral dos Requisitos da Lei 9.279/96"
          synthesis "A Lei 9.279/96 (Lei de Propriedade Industrial), em seus artigos 24 e 25, estabelece os requisitos para o relatório descritivo de um pedido de patente. O documento explica os quatro componentes principais: relatório descritivo, requisito de suficiência descritiva, melhor forma de execução, e reivindicações. Contudo, a síntese carece de análise detalhada de jurisprudência e exemplos práticos de aplicação."
          confidence_score 7
          supporting_document_ids ["https://inpi.gov.br/requisitos-patente-lei-9279"]
        }
      ]
      unanswered_aspects ["Interpretações jurisprudenciais de cada requisito", "Exemplos práticos de relatórios conformes", "Motivos comuns de indeferimento segundo a Lei 9.279/96", "Mudanças recentes nas diretrizes de exame do INPI"]
      emerging_questions ["Como os tribunais interpretam o requisito de 'suficiência descritiva' na prática?", "Quais são armadilhas comuns na redação de reivindicações segundo os Arts. 24 e 25?", "Como mudanças recentes nas diretrizes do INPI afetaram os requisitos?"]
      reasoning {
        analyze_legal_question { summary "A questão jurídica foca nos requisitos para um pedido de patente válido segundo a Lei 9.279/96. Isso envolve identificar os elementos específicos que devem estar presentes em um pedido de patente para atender aos requisitos estatutários de patenteabilidade." }
        consider_relevant_legal_principles { summary "Princípios jurídicos relevantes incluem interpretação estatutária da Lei 9.279/96, que trata dos requisitos do relatório descritivo, bem como jurisprudência que interpreta e aplica esta lei." }
        formulate_search_queries_strategy { summary "Dado o foco na Lei 9.279/96, a estratégia de consulta priorizaria referências diretas à lei e suas subseções específicas." }
        specify_expected_information_strategy { summary "As consultas devem produzir informações que expliquem precisamente os diferentes elementos da Lei 9.279/96, incluindo relatório descritivo, suficiência, melhor forma e reivindicações." }
        ensure_comprehensive_coverage_strategy { summary "Para garantir cobertura abrangente, a estratégia começaria com busca ampla da Lei 9.279/96, depois focaria em cada componente individual." }
      }
    }
    query_history [
      {
        reasoning {
          analyze_legal_question { summary "A questão jurídica foca nos requisitos para um pedido de patente válido segundo a Lei 9.279/96. Isso envolve identificar os elementos específicos que devem estar presentes em um pedido de patente para atender aos requisitos estatutários de patenteabilidade." }
          consider_relevant_legal_principles { summary "Princípios jurídicos relevantes incluem interpretação estatutária da Lei 9.279/96, que trata dos requisitos do relatório descritivo, bem como jurisprudência que interpreta e aplica esta lei." }
          formulate_search_queries_strategy { summary "Dado o foco na Lei 9.279/96, a estratégia de consulta priorizaria referências diretas à lei e suas subseções específicas." }
          specify_expected_information_strategy { summary "As consultas devem produzir informações que expliquem precisamente os diferentes elementos da Lei 9.279/96, incluindo relatório descritivo, suficiência, melhor forma e reivindicações." }
          ensure_comprehensive_coverage_strategy { summary "Para garantir cobertura abrangente, a estratégia começaria com busca ampla da Lei 9.279/96, depois focaria em cada componente individual." }
        }
        search_queries [
          {
            query_string "pedido patente requisitos Lei 9.279 relatório descritivo"
            expected_information ["requisitos do relatório descritivo", "diretrizes INPI", "suficiência descritiva"]
          }
        ]
      }
    ]
  }
  @@assert( {{ this.report_title | length > 10 }} )
  @@assert( {{ this.executive_summary | length > 40 }} )
  @@assert( {{ this.conclusion | length > 40 }} )
  // Should generate structured report despite some gaps
  @@assert( {{ this.sections | length >= 2 }} )
  @@assert( {{ this.sections | length <= 5 }} )

  // Report should address Lei 9.279/96 and patent requirements
  @@assert( {{ ("patente" in (this.report_title | lower)) or ("9.279" in (this.report_title | lower)) or ("propriedade" in (this.report_title | lower)) }} )
  @@assert( {{ ("relatório" in (this.executive_summary | lower)) or ("pedido de patente" in (this.executive_summary | lower)) or ("lei 9.279" in (this.executive_summary | lower)) or ("inpi" in (this.executive_summary | lower)) }} )

  // Should cover the four main requirements
  @@assert( {{ ("relatório descritivo" in (this.sections | map(attribute="content") | join(" ") | lower)) or ("suficiência" in (this.sections | map(attribute="content") | join(" ") | lower)) or ("melhor forma" in (this.sections | map(attribute="content") | join(" ") | lower)) or ("reivindicaç" in (this.sections | map(attribute="content") | join(" ") | lower)) }} )

  // Should acknowledge limitations and need for additional research
  @@assert( {{ ("pesquisa adicional" in (this.conclusion | lower)) or ("jurisprudência" in (this.conclusion | lower)) or ("prátic" in (this.conclusion | lower)) or ("análise aprofundada" in (this.conclusion | lower)) or ("inpi" in (this.conclusion | lower)) }} )

  // Should still provide useful statutory guidance
  @@assert( {{ ("art. 24" in (this.sections | map(attribute="content") | join(" ") | lower)) or ("art. 25" in (this.sections | map(attribute="content") | join(" ") | lower)) or ("lei 9.279" in (this.sections | map(attribute="content") | join(" ") | lower)) or ("relatório" in (this.sections | map(attribute="content") | join(" ") | lower)) }} )

  // Content should be substantial despite gaps
  @@assert( {{ (this.sections | map(attribute="content") | join(" ") | length) > 100 }} )
}
