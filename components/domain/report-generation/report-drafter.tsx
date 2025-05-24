import { Download, FileText, Save, Share2 } from "lucide-react";
export function ReportDrafter() {
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                    <input
                        type="text"
                        defaultValue="Maritime Salvage Rights Analysis"
                        className="bg-transparent border-none focus:outline-none font-semibold text-[#1a1f2e] dark:text-white text-lg"
                    />
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        type="button"
                        className="hover:bg-[#f1f5f9] dark:hover:bg-[#242a3d] p-2 rounded text-[#64748b] dark:text-[#94a3b8]"
                    >
                        <Save size={16} />
                    </button>
                    <button
                        type="button"
                        className="hover:bg-[#f1f5f9] dark:hover:bg-[#242a3d] p-2 rounded text-[#64748b] dark:text-[#94a3b8]"
                    >
                        <Download size={16} />
                    </button>
                    <button
                        type="button"
                        className="hover:bg-[#f1f5f9] dark:hover:bg-[#242a3d] p-2 rounded text-[#64748b] dark:text-[#94a3b8]"
                    >
                        <Share2 size={16} />
                    </button>
                </div>
            </div>
            <div className="flex space-x-4">
                <div className="flex-shrink-0 bg-white dark:bg-[#1e2436] p-4 border border-[#e1e5eb] dark:border-[#2a3148] rounded-lg w-64">
                    <h3 className="mb-3 font-medium text-[#2d3748] dark:text-[#e2e8f0] text-sm">
                        Document Structure
                    </h3>
                    <div className="space-y-2">
                        {[
                            {
                                title: "Executive Summary",
                                complete: true,
                            },
                            {
                                title: "Background",
                                complete: true,
                            },
                            {
                                title: "Legal Analysis",
                                complete: false,
                            },
                            {
                                title: "Recommendations",
                                complete: false,
                            },
                            {
                                title: "Conclusion",
                                complete: false,
                            },
                        ].map((section) => (
                            <div
                                key={`section-${section.title}`}
                                className={`p-2 text-xs rounded cursor-pointer ${section.complete ? "bg-[#f1f5f9] dark:bg-[#242a3d] text-[#3a7bb7]" : "text-[#64748b] dark:text-[#94a3b8] hover:bg-[#f8fafc] dark:hover:bg-[#1a2234]"}`}
                            >
                                <div className="flex items-center">
                                    <FileText size={12} className="mr-2" />
                                    {section.title}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex-grow bg-white dark:bg-[#1e2436] p-4 border border-[#e1e5eb] dark:border-[#2a3148] rounded-lg">
                    <div className="dark:prose-invert max-w-none prose prose-sm">
                        <h2>Executive Summary</h2>
                        <p>
                            This report analyzes the legal framework surrounding
                            maritime salvage rights in the context of the
                            &apos;Oceanic&apos; case. The analysis focuses on
                            three key areas: jurisdictional considerations,
                            applicable maritime law, and precedential cases
                            <span className="inline-block bg-[#4a5568] dark:bg-[#a0aec0] w-0.5 h-3 ml-0.5 animate-caret-blink" style={{ verticalAlign: 'text-top' }} />
                        </p>
                        <h2>Background</h2>
                        <p>
                            The case involves complex questions of maritime
                            salvage rights arising from...
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
