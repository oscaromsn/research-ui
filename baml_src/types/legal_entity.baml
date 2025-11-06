class LegalEntity {
  name string
  type "Case" | "Statute" | "Regulation" | "Person" | "Organization" | "LegalConcept" | "Jurisdiction"
  details string? @description("Mais detalhes, por exemplo, citação de um caso/estatuto, papel de uma pessoa.")
}
