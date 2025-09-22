"use client"

import { Line, LineChart, ResponsiveContainer, Tooltip, YAxis, XAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface StatsChartProps {
  data?: any[]
  totalValue?: number
}

export function StatsChart({ data: propData, totalValue }: StatsChartProps) {
  const data = propData && propData.length > 0 ? propData : [
    { date: "Loading", value: totalValue || 1000 },
  ]

  // Calculate dynamic Y-axis domain for better scaling
  const values = data.map(d => d.value || 0)
  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)
  const valueRange = maxValue - minValue
  
  // If the range is small (less than 5% of total value), create a tighter scale
  const shouldUseTightScale = valueRange < (totalValue || maxValue) * 0.05
  
  let yAxisDomain: [number, number] | ['auto', 'auto'] = ['auto', 'auto']
  
  if (shouldUseTightScale && valueRange > 0) {
    // Create a tight scale with some padding
    const padding = valueRange * 0.1
    yAxisDomain = [
      Math.max(0, minValue - padding),
      maxValue + padding
    ]
  }

  // Format Y-axis ticks
  const formatYAxisTick = (value: number) => {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}k`
    }
    return `$${value.toFixed(0)}`
  }

  // Show more data points (up to 100 instead of 50)
  const chartData = data.slice(0, 100)

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-4 px-4 md:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <CardTitle className="text-lg md:text-xl font-semibold">Account Value Over Time</CardTitle>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {valueRange > 0 && (
              <>
                <span>Range: ${valueRange.toFixed(2)}</span>
                <span>{chartData.length} points</span>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-[250px] md:h-[300px] px-2 md:px-6">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10 }}
              interval="preserveStartEnd"
              className="text-xs text-muted-foreground"
            />
            <YAxis 
              domain={yAxisDomain}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10 }}
              tickFormatter={formatYAxisTick}
              className="text-xs text-muted-foreground"
              width={50}
            />
            <Tooltip
              cursor={{ strokeDasharray: "3 3", stroke: "#22c55e", strokeWidth: 1 }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload
                  return (
                    <div className="rounded-lg border bg-background/95 backdrop-blur-sm p-3 shadow-lg">
                      <div className="grid grid-cols-1 gap-2">
                        <div className="flex flex-col">
                          <span className="text-xs uppercase text-muted-foreground">Value</span>
                          <span className="font-bold text-lg">${Number(payload[0].value).toFixed(2)}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs uppercase text-muted-foreground">Time</span>
                          <span className="font-medium">{data.date}</span>
                        </div>
                        {data.pnl !== undefined && data.pnl !== null && typeof data.pnl === 'number' && (
                          <div className="flex flex-col">
                            <span className="text-xs uppercase text-muted-foreground">PnL</span>
                            <span className={`font-medium ${data.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {data.pnl >= 0 ? '+' : ''}${Number(data.pnl).toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                }
                return null
              }}
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#22c55e" 
              strokeWidth={2} 
              dot={false}
              connectNulls={false}
              activeDot={{ 
                r: 4, 
                fill: "#22c55e", 
                stroke: "#fff", 
                strokeWidth: 2,
                filter: "drop-shadow(0px 2px 4px rgba(0,0,0,0.2))"
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

