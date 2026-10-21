import { StatCard } from '@/components/ui/StatCard'

export interface ProductionKpiCardProps {
  label: string
  value: React.ReactNode
  sublabel?: React.ReactNode
  icon?: React.ReactNode
  isDestructive?: boolean
  className?: string
  onInfoClick?: () => void
}

export function ProductionKpiCard({
  label,
  value,
  sublabel,
  icon,
  isDestructive = false,
  className = '',
  onInfoClick
}: ProductionKpiCardProps) {
  return (
    <StatCard
      label={label}
      value={value}
      sublabel={sublabel}
      icon={icon}
      variant={isDestructive ? 'destructive' : 'default'}
      className={className}
      onInfoClick={onInfoClick}
    />
  )
}
