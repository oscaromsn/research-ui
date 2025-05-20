import { EvidenceAnalysis } from "@/components/EvidenceAnalysis";
import { GuidanceStrategy } from "@/components/GuidanceStrategy";
import { Header } from "@/components/Header";
import { SynthesisReporting } from "@/components/SynthesisReporting";

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
