import { StatCard } from '@/components/ui/StatCard'

export interface KpiCardProps {
  label: string
  value: string | number
  sublabel?: string
  icon?: React.ReactNode
  className?: string
  onInfoClick?: () => void
}

export function KpiCard({
  label,
  value,
  sublabel,
  icon,
  className = '',
  onInfoClick
}: KpiCardProps) {
  return (
    <StatCard
      label={label}
      value={value}
      sublabel={sublabel}
      icon={icon}
      className={className}
      onInfoClick={onInfoClick}
    />
  )
}
