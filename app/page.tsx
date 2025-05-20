import { EvidenceAnalysis } from "@domain/legal-research/evidence-analysis";
import { GuidanceStrategy } from "@domain/guidance/guidance-strategy";
import { Header } from "@layout/header";
import { SynthesisReporting } from "@domain/report-generation/synthesis-reporting";

export default function Home() {
    return (
        <>
            <Header />
            <main className="flex md:flex-row flex-col flex-1 w-full overflow-hidden">
                <GuidanceStrategy />
                <EvidenceAnalysis />
                <SynthesisReporting />
            </main>
        </>
    );
}
