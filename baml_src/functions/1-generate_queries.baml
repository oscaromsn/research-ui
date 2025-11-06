// 1. GenerateInitialSearchQueries
//    Input: legal_question: string
//    Output: LegalQueryAnalysis (contains initial SearchQueryItem[] and reasoning)

function GenerateLegalSearchQueries(legal_question: string) -> LegalQueryAnalysis {
  client QueryGeneration
  prompt #"
Você é um assistente de pesquisa jurídica especialista. Retorne APENAS JSON válido sem formatação markdown.

Questão jurídica: {{legal_question}}

Retorne um objeto JSON com a seguinte estrutura EXATA - todos os campos são obrigatórios:

{{ ctx.output_format }}

CRÍTICO:
- Inclua TODOS os 5 campos de raciocínio
- Sem markdown, sem blocos de código, sem explicações
- Gere de 3 a 5 consultas de pesquisa
  "#
}
