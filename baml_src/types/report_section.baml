// For the final report
class LegalReportSection {
  section_title string
  content string @description("Conteúdo detalhado para esta seção do relatório, devidamente formatado com citações quando apropriado (por exemplo, [SearchResultItem.id] ou nome do caso/estatuto).") @stream.with_state
  // We can add sub-sections recursively if needed: sub_sections LegalReportSection[]?
}
