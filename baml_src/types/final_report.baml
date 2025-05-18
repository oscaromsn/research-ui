class FinalLegalReport {
  report_title string @description("A comprehensive title for the legal research report.")
  executive_summary string @description("A concise overview of the findings.") @stream.with_state
  sections LegalReportSection[] @description("The main sections of the report, logically structured.")
  conclusion string @description("The overall conclusion based on the research.") @stream.with_state
  limitations_and_caveats string[]? @description("Any limitations of the research or caveats to the findings.")
  appendix_document_ids string[]? @description("IDs of key SearchResultItems referenced in the report.")
}