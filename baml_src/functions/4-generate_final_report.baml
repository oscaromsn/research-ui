// 4. Generate Final Legal Report
//    Purpose: Creates the final, comprehensive report based on all synthesized information.
function GenerateFinalLegalReport(
  original_legal_question: string,
  synthesis: OverallSynthesis,
  query_history: LegalQueryAnalysis[] // Could be a list if there were multiple refinement rounds
) -> FinalLegalReport {
  client GenerateFinalReport // A powerful model for high-quality writing
  prompt #"
Você é um analista jurídico sênior encarregado de redigir um relatório de pesquisa jurídica. Você receberá a questão jurídica original, uma síntese das descobertas e o histórico de geração de consultas. Sua tarefa é construir um relatório com base nessas informações que seja proporcional à pesquisa disponível.

Primeiro, revise as seguintes informações:

1. Questão Jurídica Original:
<original_question>
{{ original_legal_question }}
</original_question>

2. Síntese Geral das Descobertas:
<synthesis>
    Tópicos Chave Sintetizados:
    {% for topic in synthesis.key_synthesized_topics %}
    - {{ topic.topic_title }}: {{ topic.synthesis }} (IDs de Apoio: {{ topic.supporting_document_ids | join(", ") }})
    {% endfor %}
    Aspectos não respondidos: {{ synthesis.unanswered_aspects | default(["Nenhum."]) | join("; ") }}
    Questões Emergentes: {{ synthesis.emerging_questions | default(["Nenhum."]) | join("; ") }}
</synthesis>

3. Histórico de Geração de Consultas:
<query_history>
    {% for query_analysis in query_history %}
      Rodada {{ loop.index }}:
      {{ query_analysis.reasoning }}
      Consultas:
      {% for query in query_analysis.search_queries %}
      - "{{ query.query_string }}" esperando: {{ query.expected_information | join(", ") }}
      {% endfor %}
    {% endfor %}
</query_history>

Agora, use essas informações para criar um relatório de pesquisa jurídica que seja proporcional às informações disponíveis. Siga estas diretrizes:

**Diretrizes de Escopo do Relatório:**
- Se a síntese contiver 1-2 tópicos com documentos de apoio limitados: Crie um relatório conciso com 1-3 seções focando no que pode ser estabelecido definitivamente.
- Se a síntese contiver 3+ tópicos com extensos documentos de apoio: Crie um relatório abrangente com 3-6 seções fornecendo uma análise detalhada.
- Sempre reconheça as limitações quando a pesquisa for mínima ou incompleta.

**Estrutura do Relatório:**
1. Crie um título de relatório adequado que encapsule o tópico principal da pesquisa.

2. Escreva um resumo executivo que reflita o escopo das descobertas disponíveis (use palavras como "limitado", "pesquisa adicional necessária" ou "complexo" quando a síntese for mínima).

3. Estruture as principais descobertas em seções lógicas proporcionais às informações disponíveis. Garanta a citação adequada usando IDs de documentos ou nomes de casos, se disponíveis na síntese.

4. Formule uma conclusão que reconheça a completude da pesquisa (use palavras como "mais", "adicional", "pesquisa", "análise" ou "necessário" quando houver lacunas).

5. Inclua limitações da pesquisa ou ressalvas às descobertas, especialmente quando o material de origem for limitado.

6. Liste os IDs dos principais documentos do apêndice, se aplicável.

Seu relatório deve ser bem fundamentado e escrito em um tom jurídico profissional, mas dimensionado apropriadamente para corresponder à profundidade e amplitude das informações de pesquisa disponíveis.

Apresente seu relatório em formato JSON usando o seguinte esquema:

    {{ ctx.output_format }}

Sua saída final deve consistir apenas no relatório formatado em JSON. Não inclua nenhum comentário ou explicação adicional fora desta estrutura JSON.
  "#
}
