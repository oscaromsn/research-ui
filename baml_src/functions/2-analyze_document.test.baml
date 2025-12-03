// ----- Testes Abrangentes para AnalyzeSingleDocument - Contexto Jurídico Brasileiro -----

test AnalisarCasoAltamenteRelevante {
  functions [AnalyzeSingleDocument]
  args {
    original_legal_question "O que caracteriza dispensa discriminatória no direito trabalhista brasileiro, segundo a Súmula 443 do TST?"
    document {
      id "caso_tst_123"
      url "https://jurisprudencia.tst.jus.br/RR-1000123-45.2020.5.02.0001"
      source_name "Portal TST"
      title "TST-RR-1000123-45.2020.5.02.0001 - Maria Silva vs. Empresa ABC Ltda."
      snippet "O Tribunal Superior do Trabalho esclarece o conceito de dispensa discriminatória, aplicando a Súmula 443, decidindo que a dispensa de empregada portadora de doença grave que suscite estigma ou preconceito gera presunção de discriminação."
      full_text #"
        Processo: TST-RR-1000123-45.2020.5.02.0001
        Relatora: Ministra Maria Helena Costa
        Ementa:
        A reclamante Maria Silva ajuizou ação trabalhista contra Empresa ABC Ltda., alegando dispensa discriminatória. A questão central é se a dispensa de empregada portadora de HIV, sem justa causa, configura discriminação.
        O juízo de primeiro grau julgou procedente o pedido. Mantemos a decisão.
        Conforme a Súmula 443 do TST: "Presume-se discriminatória a despedida de empregado portador do vírus HIV ou de outra doença grave que suscite estigma ou preconceito. Inválido o ato, o empregado tem direito à reintegração no emprego."
        Entendemos que a dispensa pode ser considerada discriminatória mesmo sem prova direta de intenção discriminatória, bastando que o empregado demonstre ser portador de doença grave no momento da dispensa.
        O conceito jurídico de 'dispensa discriminatória' é fundamental no direito trabalhista brasileiro.
        Jurisdição: TST - Tribunal Superior do Trabalho.
      "#
      retrieval_date "2024-07-16T10:00:00Z"
      metadata {
        court "Tribunal Superior do Trabalho"
        date_decided "2023-10-15"
      }
    }
  }
  // Assertions on the output (this)
  @@assert( {{ this.search_result_id == "caso_tst_123" }} )
  @@assert( {{ this.relevance_score >= 7 }} ) // Expecting high relevance
  @@assert( {{ this.confidence_score >= 6 }} )
  @@assert( {{ (this.summary | default("")) | length > 20 }} ) // Summary should be populated
  @@assert( {{ this.key_arguments_and_reasoning | length > 0 }} ) // Should find arguments
  @@assert( {{ this.extracted_entities | length > 0 }} ) // Should find entities like "Súmula 443", "TST"
  // Example: Check if a specific entity type was found
  @@assert( {{ (this.extracted_entities | selectattr("type", "equalto", "Case") | list | length) > 0 }} )
  @@assert( {{ (this.extracted_entities | selectattr("type", "equalto", "Jurisdiction") | list | length) > 0 }} )
  @@assert( {{ this.extracted_quotes | length > 0 }} ) // Should extract quotes
  // Check that reasoning structure was attempted
  @@assert( {{ this.reasoning.analyze_legal_question is not none }} )
  @@assert( {{ this.reasoning.consider_relevant_legal_principles is not none }} )
  @@assert( {{ this.reasoning.formulate_search_queries_strategy is not none }} )
  @@assert( {{ this.reasoning.specify_expected_information_strategy is not none }} )
  @@assert( {{ this.reasoning.ensure_comprehensive_coverage_strategy is not none }} )
}

// TESTE: Artigo jurídico sobre discriminação trabalhista
test AnalisarArtigoDiscriminacaoTrabalhista {
  functions [AnalyzeSingleDocument]
  args {
    original_legal_question "O que caracteriza dispensa discriminatória no direito trabalhista brasileiro?"
    document {
      id "https://conjur.com.br/artigo/dispensa-discriminatoria-direito-trabalho-brasileiro"
      url "https://conjur.com.br/artigo/dispensa-discriminatoria-direito-trabalho-brasileiro"
      source_name "Conjur"
      title "Dispensa Discriminatória no Direito do Trabalho Brasileiro: Análise da Súmula 443 do TST"
      snippet "Além dos casos claros de dispensa discriminatória, como demissão por motivo de raça, gênero ou religião, a jurisprudência trabalhista brasileira desenvolveu entendimento ampliado sobre o conceito, especialmente em casos envolvendo doenças graves."
      full_text #"
        Dispensa Discriminatória no Direito do Trabalho Brasileiro: Análise da Súmula 443 do TST
        Publicado em: 22 de novembro de 2023
        Autor: Dr. Pedro Henrique Advocacia

        Quando um empregado sofre discriminação ou retaliação no ambiente de trabalho, isso frequentemente assume a forma de ações significativas, como demissão, rebaixamento ou suspensão, todas claramente representando "dispensa discriminatória" segundo a legislação antidiscriminação brasileira. Porém, muitas vezes a discriminação assume formas mais sutis.

        Padrões legais para comprovação de discriminação trabalhista:
        Para estabelecer um caso prima facie de discriminação no emprego baseada em discriminação intencional, o empregado deve demonstrar que:
        - É membro de um grupo protegido;
        - Sofreu uma ação prejudicial no emprego;
        - Atendia às expectativas legítimas do empregador no momento da ação;
        - Foi tratado diferentemente de empregados em situação similar fora de seu grupo protegido.

        A Lei 9.029/95 proíbe a exigência de atestados de gravidez e esterilização, e outras práticas discriminatórias, para efeitos admissionais ou de permanência da relação jurídica de trabalho.

        A CLT, em seu artigo 373-A, estabelece vedações específicas à discriminação contra a mulher no mercado de trabalho.

        O Ministério Público do Trabalho, responsável pela fiscalização, esclarece que dispensas discriminatórias incluem, mas não se limitam a:
        - Dispensa por motivo de gravidez
        - Dispensa por orientação sexual
        - Dispensa por doença grave
        - Dispensa por filiação sindical
        - Dispensa por ajuizamento de reclamação trabalhista

        Alguns tribunais regionais do trabalho interpretam a Súmula 443 como exigindo que a dispensa resulte em "consequência materialmente adversa" ao trabalhador.
      "#
      published_date "2023-11-22T00:00:00Z"
      author "Dr. Pedro Henrique Advocacia"
      retrieval_date "2025-05-30T07:58:46.259Z"
      metadata {
        exa_internal_id "https://conjur.com.br/artigo/dispensa-discriminatoria-direito-trabalho-brasileiro"
      }
    }
  }
  @@assert( {{ this.search_result_id == "https://conjur.com.br/artigo/dispensa-discriminatoria-direito-trabalho-brasileiro" }} )
  @@assert( {{ this.relevance_score >= 8 }} ) // Very high relevance - directly addresses the question
  @@assert( {{ this.confidence_score >= 7 }} ) // High confidence due to comprehensive content
  @@assert( {{ (this.summary | default("")) | length > 50 }} ) // Should generate substantial summary
  @@assert( {{ ("discriminat" in (this.summary | default("") | lower)) }} ) // Key term should appear in summary
  @@assert( {{ this.key_arguments_and_reasoning | length >= 3 }} ) // Multiple key arguments expected
  @@assert( {{ this.extracted_entities | length >= 3 }} ) // Should extract multiple entities including CLT
  @@assert( {{ (this.extracted_entities | selectattr("type", "equalto", "Statute") | list | length) > 0 }} ) // Should find Lei 9.029/95 or CLT
  @@assert( {{ this.extracted_quotes | length >= 2 }} ) // Should extract multiple relevant quotes
  @@assert( {{ this.reasoning.analyze_legal_question.summary | length > 20 }} ) // Reasoning should be detailed
}

// TESTE: Jurisprudência sobre dispensa indireta
test AnalisarDispensaIndireta {
  functions [AnalyzeSingleDocument]
  args {
    original_legal_question "O que caracteriza dispensa discriminatória no direito trabalhista brasileiro?"
    document {
      id "https://jusbrasil.com.br/jurisprudencia/dispensa-indireta-clt"
      url "https://jusbrasil.com.br/jurisprudencia/dispensa-indireta-clt"
      source_name "JusBrasil"
      title "Dispensa Indireta - Art. 483 da CLT"
      snippet "Nos casos específicos em que o empregado alega assédio moral ou tratamento discriminatório, se não houver rescisão indireta configurada, o empregador-reclamado pode alegar em defesa que: (1) exerceu medidas razoáveis para prevenir e corrigir o assédio; e (2) o empregado deixou de utilizar as oportunidades preventivas ou corretivas oferecidas."
      full_text #"
        A dispensa indireta constitui uma mudança significativa na situação de emprego, como contratação, demissão, não promoção, transferência com responsabilidades significativamente diferentes, ou decisão que cause mudança significativa nos benefícios. A dispensa indireta é elemento fundamental nas ações trabalhistas, podendo responsabilizar o empregador pelos atos do superior hierárquico.

        Por exemplo, o TST tem entendido que a negação de aumento pode constituir situação ensejadora de dispensa indireta. Outros tribunais também consideraram as seguintes situações como configuradoras de rescisão indireta:
        - Perda de benefícios especificamente negociados no contrato de trabalho, como sala privativa;
        - Ameaças de dispensa por superior para coagir empregados a cumprir demandas do supervisor;
        - Retenção de promoção ou benefícios por recusar aceitar avanços sexuais de superior.

        Por outro lado, condições como transferência para outro escritório ou avaliações de desempenho rebaixadas, por si só, não configuram rescisão indireta. Ver: REsp 1.234.567/SP - Requisitos da dispensa indireta

        Nos casos específicos em que o empregado alega assédio moral conforme o art. 483 da CLT, se não houver rescisão indireta configurada, o empregador pode apresentar defesa demonstrando que: (1) exerceu cuidado razoável para prevenir e corrigir o assédio; e (2) o empregado falhou injustificadamente em utilizar as oportunidades preventivas ou corretivas oferecidas.

        Por fim, a dispensa indireta por conduta do empregador pode também qualificar como rescisão indireta pela qual o empregador é estritamente responsável conforme a CLT. Contudo, o reclamante deve provar: (1) os elementos da dispensa indireta, e (2) que um ato oficial do empregador fundamenta a dispensa indireta.
      "#
      published_date "2022-07-25T00:00:00.000Z"
      retrieval_date "2025-05-30T07:58:46.260Z"
      metadata {
        exa_internal_id "https://jusbrasil.com.br/jurisprudencia/dispensa-indireta-clt"
      }
    }
  }
  @@assert( {{ this.search_result_id == "https://jusbrasil.com.br/jurisprudencia/dispensa-indireta-clt" }} )
  @@assert( {{ this.relevance_score >= 6 and this.relevance_score <= 8 }} ) // Moderately high - related but specifically about "dispensa indireta"
  @@assert( {{ this.confidence_score >= 6 }} )
  @@assert( {{ (this.summary | default("")) | length > 30 }} )
  @@assert( {{ ("dispensa indireta" in (this.summary | default("") | lower)) or ("rescisão indireta" in (this.summary | default("") | lower)) or ("discriminat" in (this.summary | default("") | lower)) }} )
  @@assert( {{ this.key_arguments_and_reasoning | length >= 2 }} )
  @@assert( {{ this.extracted_entities | length >= 3 }} )
  @@assert( {{ (this.extracted_entities | selectattr("type", "equalto", "Statute") | list | length) > 0 }} ) // Should find CLT Art. 483
  @@assert( {{ this.counter_arguments_or_nuances is not none }} ) // Should note the distinction between concepts
  @@assert( {{ this.reasoning.consider_relevant_legal_principles.summary | length > 15 }} )
}

// TESTE: Artigo sobre requisitos de patente no Brasil
test AnalisarArtigoPatenteBrasil {
  functions [AnalyzeSingleDocument]
  args {
    original_legal_question "Quais são os requisitos para um pedido de patente válido segundo a Lei de Propriedade Industrial (Lei 9.279/96)?"
    document {
      id "https://inpi.gov.br/guia-patentes-requisitos"
      url "https://inpi.gov.br/guia-patentes-requisitos"
      source_name "INPI"
      title "Guia de Requisitos para Pedido de Patente - Lei 9.279/96"
      snippet "O relatório descritivo deve conter a descrição clara e suficiente do objeto, de modo a possibilitar sua realização por técnico no assunto, e indicar, quando for o caso, a melhor forma de execução."
      full_text #"
        A Lei 9.279/96 (Lei de Propriedade Industrial), em seus artigos 24 e 25, estabelece os requisitos para o relatório descritivo e as reivindicações de um pedido de patente. Esta seção é fundamental pois define o que o inventor deve incluir em seu pedido para obter a patente.

        Art. 24 - Relatório Descritivo: O pedido deve conter relatório descritivo da invenção, em linguagem clara e precisa, de forma a permitir que um técnico no assunto possa reproduzi-la. Isso garante que o público possa se beneficiar do conhecimento da invenção após a expiração da patente.

        Requisito de Suficiência Descritiva: O relatório deve descrever a maneira e o processo de fabricação e utilização da invenção em termos completos, claros, concisos e exatos, de modo a permitir que qualquer técnico no assunto possa fabricá-la e utilizá-la. Este é o requisito de suficiência descritiva.

        Melhor Forma de Execução: O pedido deve indicar, quando for o caso, a melhor forma de execução contemplada pelo inventor para realizar a invenção. Diferentemente de outras jurisdições, este requisito é interpretado de forma mais flexível pelo INPI.

        Art. 25 - Reivindicações: O pedido deve concluir com uma ou mais reivindicações que definam clara e precisamente a matéria objeto da proteção. As reivindicações devem ser fundamentadas no relatório descritivo.

        Segundo o Art. 25, as reivindicações "devem definir, de modo claro e preciso, a matéria objeto da proteção." Reivindicações que não atendem ao requisito de clareza e precisão são inválidas por indefinição.
      "#
      published_date "2024-05-19T15:39:19.000Z"
      author "Coordenação-Geral de Patentes - INPI"
      retrieval_date "2025-05-30T07:58:49.008Z"
      metadata {
        exa_internal_id "https://inpi.gov.br/guia-patentes-requisitos"
      }
    }
  }
  @@assert( {{ this.search_result_id == "https://inpi.gov.br/guia-patentes-requisitos" }} )
  @@assert( {{ this.relevance_score >= 8 }} ) // Very high relevance - directly addresses Lei 9.279/96 requirements
  @@assert( {{ this.confidence_score >= 7 }} ) // High confidence due to authoritative legal source
  @@assert( {{ (this.summary | default("")) | length > 40 }} ) // Should generate comprehensive summary
  @@assert( {{ ("relatório" in (this.summary | default("") | lower)) or ("patente" in (this.summary | default("") | lower)) }} ) // Key terms expected
  @@assert( {{ this.key_arguments_and_reasoning | length >= 4 }} ) // Multiple requirements (relatório descritivo, suficiência, melhor forma, reivindicações)
  @@assert( {{ this.extracted_entities | length >= 4 }} ) // Should extract statute, requirements, etc.
  @@assert( {{ (this.extracted_entities | selectattr("type", "equalto", "Statute") | list | length) > 0 }} ) // Should find Lei 9.279/96
  @@assert( {{ this.extracted_quotes | length >= 1 }} ) // Should extract relevant quotes about requirements
  @@assert( {{ this.reasoning.analyze_legal_question.summary | length > 25 }} ) // Detailed reasoning expected
}

test AnalisarTextoDeLei {
  functions [AnalyzeSingleDocument]
  args {
    original_legal_question "Quais são os requisitos para um pedido de patente válido no Brasil?"
    document {
      id "lei_9279_arts_24_25"
      url "https://www.planalto.gov.br/ccivil_03/leis/l9279.htm"
      source_name "Planalto"
      title "Lei 9.279/96 - Arts. 24 e 25 - Relatório Descritivo e Reivindicações"
      snippet "O relatório deverá descrever clara e suficientemente o objeto, de modo a possibilitar sua realização por técnico no assunto e indicar, quando for o caso, a melhor forma de execução."
      full_text #"
        Art. 24. O relatório deverá descrever clara e suficientemente o objeto, de modo a possibilitar sua realização por técnico no assunto e indicar, quando for o caso, a melhor forma de execução.
        Parágrafo único. No caso de material biológico essencial à realização prática do objeto do pedido, que não possa ser descrito na forma deste artigo e que não estiver acessível ao público, o relatório será suplementado por depósito do material em instituição autorizada pelo INPI ou indicada em acordo internacional.
        Art. 25. As reivindicações deverão ser fundamentadas no relatório descritivo, caracterizando as particularidades do pedido e definindo, de modo claro e preciso, a matéria objeto da proteção.
        Esta seção, artigos 24 e 25 da Lei 9.279/96, estabelece os requisitos para relatórios descritivos de patentes.
      "#
      retrieval_date "2024-07-16T10:05:00Z"
      metadata {
        code "Lei 9.279/96"
        section "Arts. 24-25"
      }
    }
  }
  @@assert( {{ this.search_result_id == "lei_9279_arts_24_25" }} )
  @@assert( {{ this.relevance_score >= 7 and this.relevance_score <= 10 }} ) // Highly relevant as it directly covers patent application requirements
  @@assert( {{ (this.summary | default("")) | length > 10 }} )
  @@assert( {{ this.key_arguments_and_reasoning | length > 0 }} ) // Should extract requirements
  @@assert( {{ (this.extracted_entities | selectattr("type", "equalto", "Statute") | list | length) > 0 }} )
  // Check reasoning structure
  @@assert( {{ this.reasoning.analyze_legal_question.summary | length > 0 }} )
}

test AnalisarDocumentoIrrelevante {
  functions [AnalyzeSingleDocument]
  args {
    original_legal_question "Quais são os elementos de um contrato válido?"
    document {
      id "doc_aleatorio_789"
      url "https://noticias.sp.gov.br/padaria-vence-concurso-pao-queijo"
      source_name "Portal de Notícias SP"
      title "Padaria de Belo Horizonte Vence Concurso de Pão de Queijo"
      snippet "O concurso anual de pão de queijo teve um novo campeão hoje quando a padaria 'Pão de Queijo Mineiro' levou o grande prêmio por seu pão de queijo tradicional."
      full_text #"
        Belo Horizonte - A querida padaria da cidade 'Pão de Queijo Mineiro', administrada pelo Chef João, recebeu a fita azul no concurso anual de culinária mineira.
        Seu pão de queijo tradicional, uma receita secreta de família, impressionou os jurados com seu equilíbrio perfeito de queijo e textura crocante.
        O Chef João mencionou que o conceito legal por trás de sua vitória foi 'deliciosidade'.
      "#
      retrieval_date "2024-07-16T10:10:00Z"
      metadata {
        category "Notícias Locais"
      }
    }
  }
  @@assert( {{ this.search_result_id == "doc_aleatorio_789" }} )
  @@assert( {{ this.relevance_score <= 3 }} ) // Expecting low relevance
  // Summary might still be generated but should reflect irrelevance
  @@assert( {{ (this.summary | default("")) | length > 5 }} )
  // Depending on LLM, it might find "conceito legal" as an entity due to the text, or find none.
  @@assert( {{ this.extracted_entities | length >= 0 }} )
  @@assert( {{ this.reasoning.analyze_legal_question.summary | length > 0 }} )
}

test AnalisarDocumentoSemTextoCompleto {
  functions [AnalyzeSingleDocument]
  args {
    original_legal_question "Qual é o prazo prescricional para ações de responsabilidade civil no direito brasileiro?"
    document {
      id "doc_incompleto_001"
      url "https://direito.com.br/responsabilidade-civil-visao-geral"
      source_name "Direito.com.br"
      title "Responsabilidade Civil no Brasil - Visão Geral"
      snippet "Uma breve visão geral da responsabilidade civil no Brasil, incluindo os prazos prescricionais típicos para danos pessoais e danos patrimoniais segundo o Código Civil."
      // full_text is null or empty
      full_text null // or ""
      retrieval_date "2024-07-16T10:15:00Z"
      metadata {
        jurisdiction "Brasil"
      }
    }
  }
  @@assert( {{ this.search_result_id == "doc_incompleto_001" }} )
  // Relevance might be moderate based on title/snippet, but confidence might be lower due to missing text
  @@assert( {{ this.relevance_score >= 3 and this.relevance_score <= 8 }} )
  @@assert( {{ (this.summary | default("")) | length > 5 }} ) // LLM should attempt a summary based on snippet/title
  // Key arguments might be sparse or non-existent
  @@assert( {{ this.key_arguments_and_reasoning | length >= 0 }} )
  // Check reasoning structure
  @@assert( {{ this.reasoning.analyze_legal_question.summary | length > 0 }} )
}
