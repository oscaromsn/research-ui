import type { ClientLegalEntity } from "@/lib/state/researchAtoms"

interface EntityBadgeProps {
  entity: ClientLegalEntity
  className?: string
}

export function getEntityStyle(type: string): string {
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
  }
  return styles[type as keyof typeof styles] || styles.default
}

export function EntityBadge({ entity, className = "" }: EntityBadgeProps) {
  const entityStyle = getEntityStyle(entity.type)

  return (
    <span
      className={`rounded px-1.5 py-0.5 text-[10px] ${entityStyle} ${className}`}
      title={entity.details}
    >
      {entity.name}
    </span>
  )
}
