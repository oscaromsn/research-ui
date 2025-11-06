// 2. Analyze Individual Search Result
//    Purpose: Takes raw text from a retrieved document and extracts structured insights.
function AnalyzeSingleDocument(document: SearchResultItem, original_legal_question: string) -> AnalyzedDocument {
  client DocumentAnalysis
  prompt #"
Você é um analista jurídico encarregado de analisar um documento em relação a uma questão jurídica específica. Seu objetivo é fornecer uma análise abrangente seguindo uma abordagem estruturada. Aqui estão suas instruções:

1. Primeiro, leia atentamente a seguinte questão jurídica:

<legal_question>
{{ original_legal_question }}
</legal_question>

2. Agora, leia atentamente o documento a ser analisado:

<document>
    Document ID: {{ document.id }}
    Title: {{ document.title }}
    Source: {{ document.source_name }}
    Snippet: {{ document.snippet | default('N/A') }}
    // NB: Se document.full_text for muito longo, considere truncá-lo no código da sua aplicação
    // antes de passá-lo para esta função BAML, ou garanta que seu LLM possa lidar com o comprimento total.
    // Por exemplo, você pode passar uma versão pré-truncada: document.processed_full_text
    Full Text: {{ document.full_text | default('Nenhum texto completo disponível') }}
    Metadata: {{ document.metadata | default({}) }}
</document>

3. Realize uma análise detalhada do documento em relação à questão jurídica. Siga estes passos:

   a) Avalie a relevância do documento para a questão jurídica em uma escala de 1 a 10.
   b) Forneça uma pontuação de confiança para sua avaliação de relevância em uma escala de 1 a 10.
   c) Resuma as principais conclusões ou decisões pertinentes à questão.
   d) Extraia os principais argumentos jurídicos, raciocínios judiciais ou interpretações estatutárias.
   e) Identifique e liste as principais entidades jurídicas (casos, estatutos, pessoas, organizações, conceitos).
   f) Extraia citações diretas que sejam altamente relevantes.
   g) Anote quaisquer contra-argumentos ou nuances importantes.
   h) Forneça seu raciocínio detalhado para esta análise, seguindo o processo de 5 etapas descrito no esquema.

4. Apresente sua análise em formato JSON usando o seguinte esquema:

    {{ ctx.output_format }}

5. É crucial que você siga o processo de raciocínio de 5 etapas em detalhes, fornecendo resumos abrangentes e itens específicos considerados para cada etapa.

IMPORTANTE: Você deve definir o campo search_result_id para exatamente: {{ document.id }}

Sua saída final deve consistir apenas no objeto JSON contendo sua análise. Não inclua nenhum texto adicional ou explicações fora da estrutura JSON.
  "#
}
