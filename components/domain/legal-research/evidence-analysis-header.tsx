interface EvidenceAnalysisHeaderProps {
  className?: string;
}

export function EvidenceAnalysisHeader({
  className = "",
}: EvidenceAnalysisHeaderProps) {
  return (
    <div
      className={`border-[#e1e5eb] border-b p-4 dark:border-[#2a3148] ${className}`}
    >
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-semibold text-[#1a1f2e] text-lg dark:text-white">
          Evidências e Análise
        </h2>
        <div className="flex space-x-2">
          <button
            type="button"
            className="rounded p-1 hover:bg-[#f1f5f9] dark:hover:bg-[#242a3d]"
            aria-label="Opções do menu"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-[#64748b] dark:text-[#94a3b8]"
              role="img"
              aria-labelledby="menuIconTitle"
            >
              <title id="menuIconTitle">Menu</title>
              <line x1="4" y1="9" x2="20" y2="9" />
              <line x1="4" y1="15" x2="20" y2="15" />
              <line x1="10" y1="3" x2="8" y2="21" />
              <line x1="16" y1="3" x2="14" y2="21" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
