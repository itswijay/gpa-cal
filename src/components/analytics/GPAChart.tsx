import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'

interface GPAData {
  semester: string
  gpa: number
  credits: number
}

interface GPAChartProps {
  data: GPAData[]
  onClose: () => void
}

export function GPAChart({ data, onClose }: GPAChartProps) {
  // Transform data for chart display
  const chartData = data.map((item) => ({
    semester: item.semester,
    GPA: parseFloat(item.gpa.toString()),
  }))

  // Calculate statistics
  const gpas = data.map((d) => d.gpa)
  const avgGPA = (gpas.reduce((a, b) => a + b, 0) / gpas.length).toFixed(3)
  const maxGPA = Math.max(...gpas).toFixed(3)
  const minGPA = Math.min(...gpas).toFixed(3)
  const totalCredits = data.reduce((sum, d) => sum + d.credits, 0)

  // Determine trend
  const trend =
    chartData.length > 1
      ? chartData[chartData.length - 1].GPA > chartData[0].GPA
        ? 'up'
        : chartData[chartData.length - 1].GPA < chartData[0].GPA
        ? 'down'
        : 'stable'
      : 'stable'

  // Calculate trend line using linear regression
  const calculateTrendLine = () => {
    if (chartData.length < 2) return null

    const n = chartData.length
    let sumX = 0,
      sumY = 0,
      sumXY = 0,
      sumX2 = 0

    chartData.forEach((point, index) => {
      sumX += index
      sumY += point.GPA
      sumXY += index * point.GPA
      sumX2 += index * index
    })

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    // Calculate trend line data
    const trendData = chartData.map((point, index) => ({
      ...point,
      Trend: parseFloat((slope * index + intercept).toFixed(3)),
    }))

    return { trendData, slope, intercept }
  }

  const trendLineData = calculateTrendLine()
  const chartDataWithTrend = trendLineData?.trendData || chartData

  const trendColor =
    trend === 'up'
      ? 'text-green-500'
      : trend === 'down'
      ? 'text-red-500'
      : 'text-blue-500'
  const trendLabel =
    trend === 'up'
      ? '📈 Improving'
      : trend === 'down'
      ? '📉 Declining'
      : '➡️ Stable'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="w-full mt-8 p-4 sm:p-6 bg-card border border-border rounded-lg shadow-sm"
    >
      {/* Header with Close Button */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg sm:text-xl font-bold">GPA Progress Analytics</h2>
        <button
          onClick={onClose}
          className="p-1 hover:bg-muted rounded-md transition-colors"
          title="Close analytics"
        >
          <X className="w-5 h-5 text-muted-foreground hover:text-foreground" />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-muted/50 p-3 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Average GPA</p>
          <p className="text-lg sm:text-xl font-bold text-primary">{avgGPA}</p>
        </div>
        <div className="bg-muted/50 p-3 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Highest GPA</p>
          <p className="text-lg sm:text-xl font-bold text-green-500">
            {maxGPA}
          </p>
        </div>
        <div className="bg-muted/50 p-3 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Lowest GPA</p>
          <p className="text-lg sm:text-xl font-bold text-red-500">{minGPA}</p>
        </div>
        <div className="bg-muted/50 p-3 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Total Credits</p>
          <p className="text-lg sm:text-xl font-bold text-blue-500">
            {totalCredits}
          </p>
        </div>
      </div>

      {/* Trend Indicator */}
      <div
        className={`mb-6 flex justify-center items-center gap-2 text-sm sm:text-base font-medium ${trendColor}`}
      >
        <span>{trendLabel}</span>
      </div>

      {/* Chart */}
      <div className="w-full h-80 sm:h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartDataWithTrend}
            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--muted-foreground) / 0.2)"
              vertical={true}
              horizontal={true}
            />
            <XAxis
              dataKey="semester"
              stroke="hsl(var(--muted-foreground) / 0.5)"
              style={{ fontSize: '13px', fontWeight: '500' }}
              type="category"
              padding={{ left: 30, right: 30 }}
              tick={{ fill: 'hsl(var(--muted-foreground) / 0.7)' }}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground) / 0.5)"
              style={{ fontSize: '13px', fontWeight: '500' }}
              domain={[0, 4]}
              padding={{ top: 20, bottom: 20 }}
              tick={{ fill: 'hsl(var(--muted-foreground) / 0.7)' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
              }}
              labelStyle={{ color: 'var(--foreground)' }}
              formatter={(value) => {
                if (typeof value === 'number') {
                  return [value.toFixed(3), 'GPA']
                }
                return ['N/A', 'GPA']
              }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Line
              type="monotone"
              dataKey="GPA"
              stroke="var(--primary)"
              strokeWidth={2.5}
              dot={{
                fill: 'hsl(217 91% 60%)',
                stroke: 'var(--primary)',
                strokeWidth: 2,
                r: 6,
              }}
              activeDot={{
                r: 8,
                fill: 'hsl(217 91% 50%)',
                stroke: 'var(--primary)',
                strokeWidth: 2.5,
              }}
              isAnimationActive={true}
              animationDuration={800}
            />
            {trendLineData && (
              <Line
                type="monotone"
                dataKey="Trend"
                stroke={
                  trendLineData.slope > 0.05
                    ? 'hsl(142 76% 36%)'
                    : trendLineData.slope < -0.05
                    ? 'hsl(0 84% 60%)'
                    : 'hsl(226 71% 40%)'
                }
                strokeWidth={2.5}
                strokeDasharray="5 5"
                dot={false}
                isAnimationActive={true}
                animationDuration={800}
                name="Trend Line"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Insights Text */}
      <div className="mt-6 p-3 bg-muted/30 rounded-lg">
        <p className="text-center text-xs sm:text-sm text-muted-foreground">
          {chartData.length} semester{chartData.length > 1 ? 's' : ''} of data •
          Track your academic journey over time
        </p>
      </div>
    </motion.div>
  )
}
