// 3. Synthesize Findings from Multiple Analyzed Documents
//    Purpose: Combines insights from several analyzed documents into coherent themes.
function SynthesizeAllFindings(analyzed_docs: AnalyzedDocument[], original_legal_question: string) -> OverallSynthesis {
  client FindingsSynthetizing
  prompt #"
Você é um pesquisador jurídico sênior encarregado de sintetizar análises de múltiplos documentos relacionados a uma questão jurídica. Seu objetivo é criar uma compreensão coerente das informações fornecidas.

Aqui está a questão jurídica original:
<legal_question>
{{ original_legal_question }}
</legal_question>

Aqui estão os documentos analisados, incluindo resumos e pontos-chave:
<analyzed_documents>
    {% for doc in analyzed_docs %}
    --- Document ID: {{ doc.search_result_id }} ---
    Relevância: {{ doc.relevance_score }}/10
    // Se doc.summary for potencialmente longo, e você precisar garantir que seja conciso para esta etapa de síntese,
    // pode ser melhor que a função AnalyzeSingleDocument produza uma versão bem breve,
    // ou pré-processe-o no código da sua aplicação antes de passar para esta função de síntese.
    Resumo: {{ doc.summary }}
    Argumentos Chave:
    {% for arg in doc.key_arguments_and_reasoning %}
    - {{ arg }}
    {% endfor %}
    Entidades Chave:
    {% for entity in doc.extracted_entities %}
    - {{ entity.name }} ({{ entity.type }})
    {% endfor %}
    {% endfor %}
</analyzed_documents>

Sua tarefa é sintetizar essas descobertas em uma análise abrangente. Siga estes passos:

1. Identifique de 3 a 5 temas, princípios ou tópicos jurídicos abrangentes que emergem dos documentos analisados.
2. Para cada tema/tópico, forneça uma síntese que explique convergências, divergências e principais conclusões, referenciando os IDs dos documentos de apoio.
3. Identifique quaisquer aspectos da questão jurídica original que permaneçam sem resposta ou mal abordados.
4. Liste quaisquer novas questões ou caminhos de pesquisa que tenham surgido.
5. Forneça seu raciocínio detalhado para esta síntese.

Orientações importantes:
- Cada tópico deve abordar um aspecto ou faceta diferente da questão jurídica.
- Procure por temas convergentes (onde os documentos concordam) e perspectivas divergentes.
- Considere criar tópicos separados para diferentes elementos jurídicos, jurisdições ou princípios.
- Ao atribuir pontuações de confiança para tópicos sintetizados:
  * Se a maioria dos documentos de apoio tiver pontuações de relevância baixas (abaixo de 5/10), a confiança deve ser baixa (1-4).
  * Se os documentos de apoio tiverem relevância mista, a confiança deve ser moderada (4-7).
  * Atribua alta confiança (8-10) apenas quando os documentos de apoio forem altamente relevantes (7+/10).
  * Considere a qualidade e a completude das informações ao determinar a confiança.

Sua resposta deve estar em formato JSON, seguindo este esquema:

{{ ctx.output_format }}

Sua saída final deve consistir apenas no objeto JSON descrito acima, sem nenhum texto ou explicação adicional.
  "#
}
