import {
    CheckSquare,
    Compass,
    Lightbulb,
    Loader2,
    Pen,
    Search,
} from "lucide-react";

export function ResearchLifecycle() {
    const stages = [
        {
            name: "Ideate",
            icon: <Lightbulb size={16} />,
            status: "completed",
        },
        {
            name: "Plan",
            icon: <Compass size={16} />,
            status: "completed",
        },
        {
            name: "Research",
            icon: <Search size={16} />,
            status: "completed",
        },
        {
            name: "Analyze",
            icon: <div style={{ width: 16, height: 16 }} />,
            status: "active",
        },
        {
            name: "Review",
            icon: <CheckSquare size={16} />,
            status: "pending",
        },
        {
            name: "Draft",
            icon: <Pen size={16} />,
            status: "pending",
        },
    ];
    return (
        <div className="flex items-center">
            <div className="flex items-center">
                {stages.map((stage, index) => (
                    <div
                        key={stage.name}
                        className="group flex flex-col items-center mx-1"
                    >
                        <div
                            className={`
              flex items-center justify-center w-8 h-8 rounded-full
              ${stage.status === "active" ? "bg-[#3a7bb7] text-white" : stage.status === "completed" ? "bg-[#2a3148] text-[#a0aec0]" : "bg-[#242a3d] text-[#6b7280]"}
              ${index !== stages.length - 1 ? "relative" : ""}
            `}
                        >
                            {stage.status === "active" ? (
                                <div className="relative w-full h-full flex items-center justify-center">
                                    <div className="absolute z-10">
                                        {stage.icon}
                                    </div>
                                    <Loader2
                                        size={22}
                                        className="absolute opacity-40 animate-spin"
                                    />
                                </div>
                            ) : (
                                stage.icon
                            )}
                            {index !== stages.length - 1 && (
                                <div
                                    className={`absolute left-8 top-1/2 -translate-y-1/2 w-6 h-[1px] ${stage.status === "pending" ? "bg-[#242a3d]" : "bg-[#2a3148]"}`}
                                />
                            )}
                        </div>
                        <span
                            className={`text-xs mt-2 ${stage.status === "active" ? "text-[#3a7bb7] font-medium" : stage.status === "completed" ? "text-[#a0aec0]" : "text-[#6b7280]"}`}
                        >
                            {stage.name}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
