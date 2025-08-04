'use client'

import { useEffect, useState } from 'react'
import { SimpleGrid, Card, Text, Group, RingProgress, Badge, Skeleton, ThemeIcon, Stack, NumberFormatter } from '@mantine/core'
import { IconAlertTriangle, IconClock, IconCash, IconTarget, IconTrendingUp, IconTrendingDown } from '@tabler/icons-react'
import { loadMetrics } from '@/lib/dataLoader'

interface MetricsGridProps {
  data: any[] | null
}

interface MetricCardProps {
  title: string
  value: number
  subtitle: string
  icon: React.ReactNode
  color: 'red' | 'orange' | 'green' | 'blue'
  progress?: number
  trend?: 'up' | 'down' | 'neutral'
  format?: 'currency' | 'percentage' | 'number'
}

function MetricCard({ title, value, subtitle, icon, color, progress, trend, format = 'number' }: MetricCardProps) {
  const formatValue = () => {
    switch (format) {
      case 'currency':
        return <NumberFormatter value={value} prefix="$" thousandSeparator decimalScale={2} fixedDecimalScale />
      case 'percentage':
        return `${value.toFixed(1)}%`
      default:
        return value.toLocaleString()
    }
  }

  const getTrendIcon = () => {
    if (trend === 'up') return <IconTrendingUp size={16} className="text-red-500" />
    if (trend === 'down') return <IconTrendingDown size={16} className="text-green-500" />
    return null
  }

  return (
    <Card 
      className="animate-scale-in hover:shadow-lg transition-all duration-300 border-l-4 border-l-gray-200 hover:border-l-blue-400"
      p="lg"
    >
      <Group justify="space-between" mb="md">
        <ThemeIcon 
          size="lg" 
          variant="gradient"
          gradient={
            color === 'red' ? { from: 'red', to: 'pink' } :
            color === 'orange' ? { from: 'orange', to: 'yellow' } :
            color === 'green' ? { from: 'green', to: 'teal' } :
            { from: 'blue', to: 'cyan' }
          }
          className="shadow-md"
        >
          {icon}
        </ThemeIcon>
        {progress !== undefined && (
          <RingProgress
            size={60}
            thickness={6}
            sections={[{ value: progress, color }]}
            label={
              <Text size="xs" ta="center" fw={700}>
                {progress.toFixed(0)}%
              </Text>
            }
          />
        )}
      </Group>

      <Stack gap="xs">
        <Text size="sm" c="dimmed" tt="uppercase" fw={600} lts="0.05em">
          {title}
        </Text>
        
        <Group gap="xs" align="center">
          <Text size="xl" fw={700} className="text-slate-800">
            {formatValue()}
          </Text>
          {getTrendIcon()}
        </Group>

        <Text size="sm" c="dimmed">
          {subtitle}
        </Text>

        {color === 'red' && (
          <Badge variant="light" color="red" size="sm">
            Needs Attention
          </Badge>
        )}
        {color === 'green' && (
          <Badge variant="light" color="green" size="sm">
            Opportunity
          </Badge>
        )}
      </Stack>
    </Card>
  )
}

export default function MetricsGrid({ data }: MetricsGridProps) {
  const [metrics, setMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (data) {
      console.log('MetricsGrid received data:', data.length, 'records')
      console.log('First record fields:', Object.keys(data[0] || {}))
      
      try {
        const calculatedMetrics = loadMetrics(data)
        console.log('Calculated metrics:', calculatedMetrics)
        setMetrics(calculatedMetrics)
      } catch (error) {
        console.error('Error calculating metrics:', error)
      } finally {
        setLoading(false)
      }
    }
  }, [data])

  if (loading || !metrics) {
    return (
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} p="lg">
            <Skeleton height={20} mb="md" />
            <Skeleton height={30} mb="sm" />
            <Skeleton height={15} />
          </Card>
        ))}
      </SimpleGrid>
    )
  }

  return (
    <div className="animate-fade-in">
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
        <MetricCard
          title="Process Issues Detected"
          value={metrics.misdiagnosisRate}
          subtitle={`${metrics.totalMisdiagnosis} cases requiring attention`}
          icon={<IconAlertTriangle size={20} />}
          color="red"
          progress={metrics.misdiagnosisRate}
          trend="up"
          format="percentage"
        />

        <MetricCard
          title="Efficiency Impact"
          value={metrics.totalEfficiencyLoss}
          subtitle="Process optimization potential"
          icon={<IconClock size={20} />}
          color="orange"
          progress={75}
          format="currency"
        />

        <MetricCard
          title="Total System Loss"
          value={metrics.totalEstimatedLoss}
          subtitle="Comprehensive impact analysis"
          icon={<IconCash size={20} />}
          color="red"
          trend="up"
          format="currency"
        />

        <MetricCard
          title="Improvement Potential"
          value={metrics.potentialSavings}
          subtitle="With systematic corrections"
          icon={<IconTarget size={20} />}
          color="green"
          progress={85}
          trend="down"
          format="currency"
        />
      </SimpleGrid>

      {/* Additional Performance Indicators */}
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg" mt="xl">
        <Card className="glass border-l-4 border-l-blue-400" p="md">
          <Group justify="space-between">
            <div>
              <Text size="sm" c="dimmed" fw={600}>First-Time Fix Rate</Text>
              <Text size="lg" fw={700} c="blue">
                {metrics.firstTimeFixRate.toFixed(1)}%
              </Text>
            </div>
            <RingProgress
              size={50}
              thickness={4}
              sections={[{ value: metrics.firstTimeFixRate, color: 'blue' }]}
            />
          </Group>
        </Card>

        <Card className="glass border-l-4 border-l-green-400" p="md">
          <Group justify="space-between">
            <div>
              <Text size="sm" c="dimmed" fw={600}>Revenue per Hour</Text>
              <Text size="lg" fw={700} c="green">
                <NumberFormatter value={metrics.revenuePerHour} prefix="$" decimalScale={2} fixedDecimalScale thousandSeparator />
              </Text>
            </div>
            <ThemeIcon variant="light" color="green" size="lg">
              <IconTrendingUp size={20} />
            </ThemeIcon>
          </Group>
        </Card>

        <Card className="glass border-l-4 border-l-purple-400" p="md">
          <Group justify="space-between">
            <div>
              <Text size="sm" c="dimmed" fw={600}>Productivity Index</Text>
              <Text size="lg" fw={700} c="grape">
                {metrics.productivityIndex.toFixed(0)}/100
              </Text>
            </div>
            <RingProgress
              size={50}
              thickness={4}
              sections={[{ value: metrics.productivityIndex, color: 'grape' }]}
            />
          </Group>
        </Card>
      </SimpleGrid>
    </div>
  )
}
