// For the final report
class LegalReportSection {
  section_title string
  content string @description("Detailed content for this section of the report, properly formatted with citations where appropriate (e.g., [SearchResultItem.id] or case/statute name).") @stream.with_state
  // We can add sub-sections recursively if needed: sub_sections LegalReportSection[]?
}