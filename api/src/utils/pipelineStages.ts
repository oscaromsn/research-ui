import { b } from "../../baml_client";
import type {
  AnalyzedDocument,
  FinalLegalReport,
  LegalQueryAnalysis,
  OverallSynthesis,
  ResearchAssessment,
  SearchResultItem,
} from "../../baml_client/types";
import { config } from "../config";

/**
 * Pipeline Stages Implementation
 * Each stage is implemented as a pure function that can be tested in isolation
 */

/**
 * Stage 1: Generate Legal Search Queries
 * Takes a legal question and generates structured search queries using BAML
 */
export async function generateQueriesStage(
  legalQuestion: string
): Promise<LegalQueryAnalysis> {
  // Validate input
  if (!legalQuestion || legalQuestion.trim().length === 0) {
    throw new Error("Legal question is required and cannot be empty");
  }

  try {
    console.log(`🔍 Generating queries for: "${legalQuestion}"`);
    
    const queryAnalysis = await b.GenerateLegalSearchQueries(legalQuestion);
    
    console.log(`✅ Generated ${queryAnalysis.search_queries.length} search queries`);
    
    return queryAnalysis;
  } catch (error) {
    console.error("Query generation failed:", error);
    throw new Error(
      `Failed to generate search queries: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Stage 2: Fetch Documents from Search Queries
 * Takes search queries and retrieves relevant documents using external search API
 */
export async function fetchDocumentsStage(
  queries: LegalQueryAnalysis["search_queries"]
): Promise<SearchResultItem[]> {
  // Import Exa search utility dynamically to avoid circular dependencies
  const { executeExaSearch } = await import("./exaSearch");
  
  if (!queries || queries.length === 0) {
    throw new Error("No search queries provided for document fetching");
  }

  const allResults: SearchResultItem[] = [];
  const maxQueries = config.research.maxQueriesPerIteration;
  const resultsPerQuery = config.research.maxDocumentsPerQuery;
  
  console.log(`📚 Fetching documents for ${Math.min(queries.length, maxQueries)} queries`);
  
  for (let i = 0; i < Math.min(queries.length, maxQueries); i++) {
    const query = queries[i];
    if (!query) continue;
    
    try {
      console.log(`🔎 Searching: "${query.query_string}"`);
      
      const results = await executeExaSearch(
        query,
        resultsPerQuery,
        true,
        config.research.maxRetries
      );
      
      console.log(`📄 Found ${results.length} documents for query: "${query.query_string}"`);
      allResults.push(...results);
    } catch (error) {
      console.error(`Search failed for query "${query.query_string}":`, error);
      // Continue with other queries even if one fails
    }
  }
  
  // Remove duplicates based on URL
  const uniqueResults = allResults.filter((doc, index, array) => 
    array.findIndex(d => d.url === doc.url) === index
  );
  
  console.log(`✅ Fetched ${uniqueResults.length} unique documents`);
  
  return uniqueResults;
}

/**
 * Stage 3: Analyze Documents
 * Takes documents and analyzes them for relevance to the legal question
 */
export async function analyzeDocumentsStage(
  legalQuestion: string,
  documents: SearchResultItem[]
): Promise<AnalyzedDocument[]> {
  if (!legalQuestion || legalQuestion.trim().length === 0) {
    throw new Error("Legal question is required for document analysis");
  }
  
  if (!documents || documents.length === 0) {
    throw new Error("No documents provided for analysis");
  }

  const analyzed: AnalyzedDocument[] = [];
  
  console.log(`🔍 Analyzing ${documents.length} documents`);
  
  for (let i = 0; i < documents.length; i++) {
    const doc = documents[i];
    if (!doc) continue;
    
    try {
      console.log(`📖 Analyzing document ${i + 1}/${documents.length}: ${doc.title || "Untitled"}`);
      
      const analysis = await b.AnalyzeSingleDocument(doc, legalQuestion);
      analyzed.push(analysis);
      
      console.log(`✅ Analyzed "${doc.title || "Untitled"}" - Relevance: ${analysis.relevance_score}/10`);
    } catch (error) {
      console.error(`Analysis failed for document "${doc.title || doc.id}":`, error);
      // Continue with other documents even if one fails
    }
  }
  
  console.log(`✅ Successfully analyzed ${analyzed.length}/${documents.length} documents`);
  
  return analyzed;
}

/**
 * Stage 4: Synthesize Findings
 * Takes analyzed documents and synthesizes them into coherent topics
 */
export async function synthesizeFindingsStage(
  legalQuestion: string,
  analyzedDocuments: AnalyzedDocument[]
): Promise<OverallSynthesis> {
  if (!legalQuestion || legalQuestion.trim().length === 0) {
    throw new Error("Legal question is required for synthesis");
  }
  
  if (!analyzedDocuments || analyzedDocuments.length === 0) {
    throw new Error("No analyzed documents provided for synthesis");
  }

  try {
    console.log(`🧩 Synthesizing findings from ${analyzedDocuments.length} documents`);
    
    const synthesis = await b.SynthesizeAllFindings(analyzedDocuments, legalQuestion);
    
    console.log(`✅ Synthesized ${synthesis.key_synthesized_topics.length} key topics`);
    
    return synthesis;
  } catch (error) {
    console.error("Synthesis failed:", error);
    throw new Error(
      `Failed to synthesize findings: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Stage 5: Assess Research Sufficiency
 * Determines if research is sufficient or if more iteration is needed
 */
export async function assessResearchStage(
  legalQuestion: string,
  queryAnalysis: LegalQueryAnalysis,
  synthesis: OverallSynthesis
): Promise<ResearchAssessment> {
  if (!legalQuestion || legalQuestion.trim().length === 0) {
    throw new Error("Legal question is required for research assessment");
  }
  
  if (!queryAnalysis || !synthesis) {
    throw new Error("Query analysis and synthesis are required for assessment");
  }

  try {
    console.log("🎯 Assessing research sufficiency...");
    
    const assessment = await b.AssessResearchAndPlanNextSteps(
      legalQuestion,
      queryAnalysis,
      synthesis
    );
    
    console.log(`✅ Assessment complete - Next action: ${assessment.next_action}`);
    
    return assessment;
  } catch (error) {
    console.error("Assessment failed:", error);
    throw new Error(
      `Failed to assess research: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Stage 6: Generate Final Report
 * Creates a comprehensive legal report based on synthesis and analysis
 */
export async function generateReportStage(
  legalQuestion: string,
  synthesis: OverallSynthesis,
  queryAnalysis: LegalQueryAnalysis
): Promise<FinalLegalReport> {
  if (!legalQuestion || legalQuestion.trim().length === 0) {
    throw new Error("Legal question is required for report generation");
  }
  
  if (!synthesis || !queryAnalysis) {
    throw new Error("Synthesis and query analysis are required for report generation");
  }

  try {
    console.log("📝 Generating final legal report...");
    
    const finalReport = await b.GenerateFinalLegalReport(
      legalQuestion,
      synthesis,
      [queryAnalysis]
    );
    
    console.log(`✅ Report generated: "${finalReport.report_title}"`);
    
    return finalReport;
  } catch (error) {
    console.error("Report generation failed:", error);
    throw new Error(
      `Failed to generate report: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}