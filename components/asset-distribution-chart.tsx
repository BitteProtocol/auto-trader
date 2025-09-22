"use client"

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const COLORS = [
  "#3b82f6", // Blue
  "#10b981", // Green  
  "#f59e0b", // Yellow
  "#ef4444", // Red
  "#8b5cf6", // Purple
  "#06b6d4", // Cyan
  "#f97316", // Orange
  "#84cc16", // Lime
  "#ec4899", // Pink
  "#6b7280"  // Gray
]

interface AssetDistributionChartProps {
  assets?: any[]
}

export function AssetDistributionChart({ assets }: AssetDistributionChartProps) {
  const data = assets && assets.length > 0 
    ? assets.map(asset => ({ name: asset.symbol, value: asset.value }))
    : [{ name: "Loading...", value: 100 }]
  
  const totalValue = data.reduce((sum, item) => sum + item.value, 0)

  // Custom label function to show asset names inside pie slices
  const renderLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, name, percent } = props
    if (percent < 0.05) return null // Don't show labels for very small slices
    
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="12"
        fontWeight="600"
      >
        {name}
      </text>
    )
  }
  
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-4 px-4 md:px-6">
        <CardTitle className="text-lg md:text-xl font-semibold">Asset Distribution</CardTitle>
      </CardHeader>
      <CardContent className="h-[250px] md:h-[300px] px-2 md:px-6">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie 
              data={data} 
              cx="50%" 
              cy="50%" 
              labelLine={false}
              label={renderLabel}
              outerRadius={90} 
              fill="#8884d8" 
              dataKey="value"
              paddingAngle={2}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]}
                  style={{ 
                    filter: "drop-shadow(0px 2px 4px rgba(0,0,0,0.1))",
                    cursor: "pointer"
                  }}
                />
              ))}
            </Pie>
            <Tooltip
              cursor={{ fill: "transparent" }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-lg border bg-background/95 backdrop-blur-sm p-3 shadow-lg">
                      <div className="space-y-1">
                        <div className="font-semibold text-base">{payload[0].name}</div>
                        <div className="text-sm text-muted-foreground">
                          Value: <span className="font-medium">${Number(payload[0].value).toFixed(2)}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium">{((payload[0].value / totalValue) * 100).toFixed(1)}%</span> of portfolio
                        </div>
                      </div>
                    </div>
                  )
                }
                return null
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
