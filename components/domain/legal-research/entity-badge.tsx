import type { ClientLegalEntity } from "@/lib/state/researchAtoms";
import { cn } from "@/lib/utils";

interface EntityBadgeProps {
  entity: ClientLegalEntity;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  showConfidence?: boolean;
  onClick?: (entity: ClientLegalEntity) => void;
  className?: string;
}

// Internal function for entity styling - no longer exported to fix knip warning
function getEntityStyle(type: string): string {
  const styles = {
    Case: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    Statute:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    Regulation:
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    Person:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    Organization:
      "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    LegalConcept:
      "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
    Jurisdiction:
      "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
    default: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
  };
  return styles[type as keyof typeof styles] || styles.default;
}

export function EntityBadge({
  entity,
  size = "md",
  interactive = true,
  showConfidence = false,
  onClick,
  className = "",
}: EntityBadgeProps) {
  const entityStyle = getEntityStyle(entity.type);

  const sizeClasses = {
    sm: "px-1.5 py-0.5 text-xs",
    md: "px-2 py-1 text-sm",
    lg: "px-3 py-1.5 text-base",
  };

  const handleClick = () => {
    if (interactive && onClick) {
      onClick(entity);
    }
  };

  if (interactive) {
    return (
      <button
        type="button"
        className={cn(
          "inline-flex items-center rounded-full border-0 font-medium transition-opacity",
          entityStyle,
          sizeClasses[size],
          "cursor-pointer hover:opacity-80",
          className
        )}
        title={entity.details}
        onClick={handleClick}
      >
        <span>{entity.name}</span>
        {showConfidence && entity.confidence && (
          <span className="ml-1 text-xs opacity-75">
            {Math.round(entity.confidence * 100)}%
          </span>
        )}
      </button>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        entityStyle,
        sizeClasses[size],
        className
      )}
      title={entity.details}
    >
      <span>{entity.name}</span>
      {showConfidence && entity.confidence && (
        <span className="ml-1 text-xs opacity-75">
          {Math.round(entity.confidence * 100)}%
        </span>
      )}
    </span>
  );
}
