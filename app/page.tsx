import { GuidanceStrategy } from "@domain/guidance/guidance-strategy"
import { EvidenceAnalysis } from "@domain/legal-research/evidence-analysis"
import { SynthesisReporting } from "@domain/report-generation/synthesis-reporting"
import { Header } from "@layout/header"

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex w-full flex-1 flex-col overflow-hidden md:flex-row">
        <GuidanceStrategy />
        <EvidenceAnalysis />
        <SynthesisReporting />
      </main>
    </>
  )
}
