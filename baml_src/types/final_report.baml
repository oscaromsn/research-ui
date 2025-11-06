class FinalLegalReport {
  report_title string @description("Um título abrangente para o relatório de pesquisa jurídica.")
  executive_summary string @description("Uma visão geral concisa das descobertas.") @stream.with_state
  sections LegalReportSection[] @description("As seções principais do relatório, estruturadas de forma lógica.")
  conclusion string @description("A conclusão geral com base na pesquisa.") @stream.with_state
  limitations_and_caveats string[]? @description("Quaisquer limitações da pesquisa ou ressalvas às descobertas.")
  appendix_document_ids string[]? @description("IDs dos principais SearchResultItem referenciados no relatório.")
}
