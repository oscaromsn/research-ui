/**
 * BNP Query Translator Tests
 */

import { describe, expect, it } from "vitest";
import type { SearchQueryItem } from "@/baml_client/types";
import { translateQueryToBnpFilter } from "./bnpQueryTranslator";

describe("bnpQueryTranslator", () => {
  describe("sanitization of boolean operators", () => {
    it("should remove AND operator", () => {
      const query: SearchQueryItem = {
        query_string: '"engenheiro agrônomo" AND "responsabilidade criminal"',
        expected_information: [],
      };

      const result = translateQueryToBnpFilter(query);

      expect(result.buscaGeral).toBe(
        "engenheiro agrônomo responsabilidade criminal"
      );
      expect(result.buscaGeral).not.toContain("AND");
    });

    it("should remove OR operator", () => {
      const query: SearchQueryItem = {
        query_string: '"dano ambiental" OR "crime ambiental"',
        expected_information: [],
      };

      const result = translateQueryToBnpFilter(query);

      expect(result.buscaGeral).toBe("dano ambiental crime ambiental");
      expect(result.buscaGeral).not.toContain("OR");
    });

    it("should remove NOT operator", () => {
      const query: SearchQueryItem = {
        query_string: 'engenheiro NOT "civil"',
        expected_information: [],
      };

      const result = translateQueryToBnpFilter(query);

      expect(result.buscaGeral).toBe("engenheiro civil");
      expect(result.buscaGeral).not.toContain("NOT");
    });

    it("should remove NEAR operator", () => {
      const query: SearchQueryItem = {
        query_string: '"dano ambiental" NEAR/5 "agrônomo"',
        expected_information: [],
      };

      const result = translateQueryToBnpFilter(query);

      expect(result.buscaGeral).toBe("dano ambiental agrônomo");
      expect(result.buscaGeral).not.toContain("NEAR");
    });

    it("should handle multiple operators in one query", () => {
      const query: SearchQueryItem = {
        query_string:
          '"artigo 20" "Código Penal" AND "profissional liberal" AND "engenheiro agrônomo"',
        expected_information: [],
      };

      const result = translateQueryToBnpFilter(query);

      expect(result.buscaGeral).toBe(
        "artigo 20 Código Penal profissional liberal engenheiro agrônomo"
      );
      expect(result.buscaGeral).not.toContain("AND");
    });

    it("should remove all quotes", () => {
      const query: SearchQueryItem = {
        query_string: '"Lei 9.605/98" AND "agrônomo" AND "dano"',
        expected_information: [],
      };

      const result = translateQueryToBnpFilter(query);

      expect(result.buscaGeral).not.toContain('"');
      expect(result.buscaGeral).toBe("Lei 9.605/98 agrônomo dano");
    });

    it("should normalize whitespace", () => {
      const query: SearchQueryItem = {
        query_string: '  "engenheiro"    AND    "responsabilidade"  ',
        expected_information: [],
      };

      const result = translateQueryToBnpFilter(query);

      expect(result.buscaGeral).toBe("engenheiro responsabilidade");
      expect(result.buscaGeral).not.toMatch(/\s{2,}/); // No double spaces
    });

    it("should handle simple queries without operators", () => {
      const query: SearchQueryItem = {
        query_string: "adicional de periculosidade",
        expected_information: [],
      };

      const result = translateQueryToBnpFilter(query);

      expect(result.buscaGeral).toBe("adicional de periculosidade");
    });
  });

  describe("default filter values", () => {
    it("should set default pagination to page 1", () => {
      const query: SearchQueryItem = {
        query_string: "test query",
        expected_information: [],
      };

      const result = translateQueryToBnpFilter(query);

      expect(result.pagina).toBe(1);
    });

    it("should set default ordering to Textual", () => {
      const query: SearchQueryItem = {
        query_string: "test query",
        expected_information: [],
      };

      const result = translateQueryToBnpFilter(query);

      expect(result.ordenacao).toBe("Textual");
    });

    it("should exclude cancelled precedents by default", () => {
      const query: SearchQueryItem = {
        query_string: "test query",
        expected_information: [],
      };

      const result = translateQueryToBnpFilter(query);

      expect(result.cancelados).toBe(false);
    });

    it("should not set orgaos or tipos arrays", () => {
      const query: SearchQueryItem = {
        query_string: "test query",
        expected_information: [],
      };

      const result = translateQueryToBnpFilter(query);

      // These should be undefined (not empty arrays)
      expect(result.orgaos).toBeUndefined();
      expect(result.tipos).toBeUndefined();
    });
  });

  describe("real-world examples from logs", () => {
    it("should sanitize complex environmental law query", () => {
      const query: SearchQueryItem = {
        query_string:
          '"engenheiro agrônomo" AND "responsabilidade criminal" AND "dano ambiental"',
        expected_information: [],
      };

      const result = translateQueryToBnpFilter(query);

      expect(result.buscaGeral).toBe(
        "engenheiro agrônomo responsabilidade criminal dano ambiental"
      );
    });

    it("should sanitize NEAR operator query", () => {
      const query: SearchQueryItem = {
        query_string:
          '"dano ao meio ambiente" NEAR/5 "engenheiro agrônomo" AND "jurisprudência"',
        expected_information: [],
      };

      const result = translateQueryToBnpFilter(query);

      expect(result.buscaGeral).toBe(
        "dano ao meio ambiente engenheiro agrônomo jurisprudência"
      );
    });
  });
});
