// For assessing research sufficiency and planning next steps
enum NextActionType {
  REFINE_QUERIES
  NEW_QUERIES
  DEEPER_ANALYSIS_OF_EXISTING_DOCS
  GENERATE_REPORT
  REQUEST_HUMAN_REVIEW
}

// 4. Assess Research Sufficiency and Plan Next Iteration
//    Purpose: Decides if more research is needed or if the agent can proceed to report generation.
function AssessResearchAndPlanNextSteps(
  original_legal_question: string,
  initial_queries_analysis: LegalQueryAnalysis,
  current_synthesis: OverallSynthesis?
) -> ResearchAssessment {
  client DecidesNextStep // Using a potentially faster/cheaper client for decision-making
  prompt #"
Você é um pesquisador jurídico gerente supervisionando um projeto de pesquisa. Sua tarefa é revisar o progresso, avaliar se as informações atuais são suficientes para responder à questão jurídica original e planejar os próximos passos. Siga estas instruções cuidadosamente:

1. Revise a questão jurídica original:
<original_legal_question>
    {{ original_legal_question }}
</original_legal_question>

2. Revise o raciocínio inicial de geração de consulta:
<initial_query_generation_reasoning>
    1. Resumo da Análise da Questão Jurídica: {{ initial_queries_analysis.reasoning.analyze_legal_question.summary | default("N/A") }}
    2. Resumo da Consideração de Princípios Jurídicos Relevantes: {{ initial_queries_analysis.reasoning.consider_relevant_legal_principles.summary | default("N/A") }}
    3. Resumo da Estratégia de Formulação de Consultas de Pesquisa: {{ initial_queries_analysis.reasoning.formulate_search_queries_strategy.summary | default("N/A") }}
    4. Resumo da Estratégia de Especificação de Informações Esperadas: {{ initial_queries_analysis.reasoning.specify_expected_information_strategy.summary | default("N/A") }}
    5. Resumo da Estratégia para Garantir Cobertura Abrangente: {{ initial_queries_analysis.reasoning.ensure_comprehensive_coverage_strategy.summary | default("N/A") }}
</initial_query_generation_reasoning>

3. Revise a síntese atual das descobertas:
<current_synthesis_of_findings>
    {% if current_synthesis %}
      Tópicos Chave Sintetizados:
      {% for topic in current_synthesis.key_synthesized_topics %}
      {#
        Removido | truncate(150).
        Se topic.synthesis for muito longo, o OverallSynthesis idealmente deveria conter
        um resumo mais breve por tópico, ou o código da sua aplicação deveria preparar isso.
        Alternativamente, instrua a função SynthesizeAllFindings para tornar seu topic.synthesis conciso.
        Para este prompt de avaliação, um excerto muito curto ou apenas o título pode ser suficiente.
      #}
      - {{ topic.topic_title }}: (Confiança: {{ topic.confidence_score }}/10)
        Resumo: {{ topic.synthesis | default("Nenhum conteúdo de síntese.") }}
        Documentos de Apoio: {{ topic.supporting_document_ids | join(", ") }}
      {% else %}
      Nenhum tópico sintetizado ainda.
      {% endfor %}
      Aspectos não respondidos: {{ current_synthesis.unanswered_aspects | default(["Nenhum identificado."]) | join(", ") }}
      Questões Emergentes: {{ current_synthesis.emerging_questions | default(["Nenhum identificado."]) | join(", ") }}
    {% else %}
      Nenhuma síntese foi realizada ainda. Esta é provavelmente a primeira avaliação após a geração inicial de consultas ou se as pesquisas anteriores não renderam documentos relevantes.
    {% endif %}
</current_synthesis_of_findings>

4. Avalie a Suficiência:
OBRIGATÓRIO: Você DEVE avaliar cada critério explicitamente e indicar SIM ou NÃO para cada um:

a) Pontuações de Confiança: São 7+ para os tópicos principais? Resposta: [SIM/NÃO]
b) Aspectos não Respondidos: A lista está vazia ou contém apenas itens muito pequenos? Resposta: [SIM/NÃO]
c) Questões Emergentes: A lista está vazia ou contém apenas itens não críticos? Resposta: [SIM/NÃO]
d) Informação Acionável: A síntese fornece informações práticas e acionáveis para responder à questão principal? Resposta: [SIM/NÃO]

REGRA ESTRITA: Se TODAS AS QUATRO respostas forem "SIM", você DEVE definir is_sufficient = true e next_action = "GENERATE_REPORT".
NÃO questione esta regra. NÃO adicione requisitos adicionais além desses quatro critérios.

PADRÃO DE SUFICIÊNCIA CRÍTICO: Você é OBRIGADO a seguir APENAS os 4 critérios acima. NÃO adicione análises jurídicas adicionais além desses 4 critérios.

Se os 4 critérios forem atendidos (confiança 7+, aspectos não respondidos vazios, questões emergentes vazias, informação acionável), a pesquisa É SUFICIENTE, independentemente de quais detalhes adicionais você pessoalmente queira como advogado.

EXEMPLOS DE CENÁRIOS SUFICIENTES:
- Pontuações de confiança 8-9/10 + unanswered_aspects vazio + emerging_questions vazio + questão principal respondida = SUFICIENTE
- Regra jurídica básica fornecida + orientação de aplicação + alta confiança = SUFICIENTE

PROIBIDO: NÃO exija exceções adicionais, casos extremos, doutrinas de suspensão de prazo ou cobertura abrangente se os 4 critérios já foram atendidos. Seu trabalho é avaliar, não praticar advocacia.

5. Resuma a Avaliação:
Explique brevemente seu raciocínio para a suficiência/insuficiência. Isso será usado para preencher o campo assessment_summary.

IMPORTANTE: Quando a pesquisa FOR suficiente, seu assessment_summary DEVE incluir uma destas palavras: "suficiente", "abrangente" ou "adequada".

RECONHECIMENTO DE PESQUISA EXTENSA: Se os resumos do Raciocínio de Geração de Consulta Inicial contiverem indicadores de pesquisa prévia extensa (como "incompleta", "faltando", "cobertura parcial", "pesquisa atual incompleta", "precisa de abrangente", ou frases semelhantes sugerindo que uma pesquisa significativa já foi realizada), você DEVE reconhecer isso em seu assessment_summary usando palavras como "extensa", "múltipla", "anterior" ou "prévia" ao descrever os esforços de pesquisa que foram realizados.

6. Identifique Lacunas:
Se não for suficiente, liste as lacunas de informação específicas. Isso será usado para preencher o campo identified_gaps.

7. Recomende a Próxima Ação:
Siga esta árvore de decisão OBRIGATÓRIA passo a passo:

PASSO A: Verifique indicadores de pesquisa extensa
Observe os resumos do Raciocínio de Geração de Consulta Inicial. Eles contêm ALGUMA destas frases: "incomplete", "incompleta", "missing", "faltando", "partial coverage", "cobertura parcial", "current research incomplete", "pesquisa atual incompleta", "need comprehensive", "precisa de abrangente", "homestead focus but missing", "foco em homestead mas faltando", ou similar?
- Se SIM → Vá para o PASSO B
- Se NÃO → Vá para o PASSO C

PASSO B: Pesquisa extensa detectada - APENAS OPÇÕES LIMITADAS
Você pode APENAS escolher entre:
- DEEPER_ANALYSIS_OF_EXISTING_DOCS (se Documentos de Apoio existirem)
- REQUEST_HUMAN_REVIEW (se a complexidade sugerir que os limites da pesquisa foram atingidos)
- GENERATE_REPORT (se de alguma forma for suficiente apesar das lacunas)
VOCÊ ESTÁ PROIBIDO de escolher REFINE_QUERIES ou NEW_QUERIES

PASSO C: Processo de decisão normal
Primeiro, avalie a eficácia da consulta inicial:

VERIFIQUE: Os resumos do Raciocínio de Geração de Consulta Inicial contêm algum destes indicadores de ineficácia?
- "too broad", "muito amplo", "ineffective", "ineficaz", "completely missed", "completamente errado", "wrong approach", "abordagem errada", "fundamentally flawed", "fundamentalmente falho", "inappropriate strategy", "estratégia inadequada"
- Se SIM → Escolha NEW_QUERIES

VERIFIQUE: Os resumos do Raciocínio de Geração de Consulta Inicial sugerem que pequenas melhorias são necessárias?
- "need adjustment", "precisa de ajuste", "slightly off", "um pouco fora", "partially effective", "parcialmente eficaz", "good direction but", "boa direção mas", "mostly correct but", "majoritariamente correto mas"
- Se SIM → Escolha REFINE_QUERIES

Se nenhum dos acima se aplicar, escolha entre:
- DEEPER_ANALYSIS_OF_EXISTING_DOCS: Escolha esta opção se Documentos de Apoio estiverem listados E qualquer uma destas condições: (1) pontuações de confiança abaixo de 6/10, (2) a síntese menciona "superficial" ou frases semelhantes, (3) o raciocínio menciona "precisa de análise detalhada", (4) pesquisa extensa foi realizada, mas lacunas permanecem e existem documentos para reanálise. Não escolha esta opção se a questão envolver complexidade que exija conhecimento especializado.
- GENERATE_REPORT: Se as informações coletadas forem suficientes.
- REQUEST_HUMAN_REVIEW: Priorize esta opção para questões complexas multijurisdicionais, estruturas legais conflitantes, decisões de negócios estratégicas ou quando o raciocínio inicial indicar "complexidade além da análise automatizada". Escolha também esta opção quando uma pesquisa extensa foi realizada, mas lacunas significativas permanecem e a complexidade sugere que a pesquisa automatizada atingiu seus limites.

8. Forneça Detalhes Condicionais:
- Se next_action for REFINE_QUERIES ou NEW_QUERIES, forneça uma lista de objetos SearchQueryItem para suggested_queries_for_refinement.
- Se next_action for DEEPER_ANALYSIS_OF_EXISTING_DOCS, forneça IDs de documentos específicos de "Documentos de Apoio" para document_ids_for_deeper_analysis.
- Para outros tipos de next_action, omita esses campos.

9. Raciocínio:
Forneça seu processo de pensamento detalhado para esta avaliação e plano. Explique por que você escolheu a próxima ação e como identificou lacunas ou formulou novas consultas/planos. Use a estrutura ReasoningStep para cada uma destas etapas:
a) analyze_legal_question
b) consider_relevant_legal_principles
c) formulate_search_queries_strategy
d) specify_expected_information_strategy
e) ensure_comprehensive_coverage_strategy

10. Formato de Saída:
Forneça sua saída final em formato JSON usando o seguinte esquema:

{{ ctx.output_format }}

Sua saída final deve consistir apenas no objeto JSON no esquema descrito acima. Não inclua nenhum texto, explicações ou formatação adicional fora desta estrutura JSON.
  "#
}
