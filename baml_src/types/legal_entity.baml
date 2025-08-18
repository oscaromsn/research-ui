class LegalEntity {
  name string
  type "Case" | "Statute" | "Regulation" | "Person" | "Organization" | "LegalConcept" | "Jurisdiction"
  details string? @description("Further details, e.g., citation for a case/statute, role of a person.")
}
