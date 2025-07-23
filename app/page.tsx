import { StatsChart } from "@/components/stats-chart"
import { TradeLogTable } from "@/components/trade-log-table"
import { AssetDistributionChart } from "@/components/asset-distribution-chart"
import { DonationsTable } from "@/components/donations-table"
import { AgentThinkingTerminal } from "@/components/agent-thinking-terminal" // Import the new component

export default function Page() {


  return (
    <div className="min-h-screen bg-neutral-900 text-foreground p-6 flex flex-col gap-6">
      {/* Agent Thinking Terminal - spans full width */}
      

      {/* Header - spans all columns */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
           <div className="text-4x1 font-bold flex items-center gap-2">
            <h1 className="text-4xl font-bold">Agent Portfolio: $74,892</h1>

            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
            </span>
            <span className="text-sm text-muted-foreground">LIVE</span>
          </div>
          <div className="text-lg text-green-400 font-semibold flex items-center gap-2">
            Accrued Yield: +$20,892 (+1.2%)
           
          </div>
        </div>
      </div>
      <AgentThinkingTerminal />
      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-[1.2fr_3fr] gap-6 flex-1">
   
        {/* Left Panel: Trade Log */}
        <aside className={`flex flex-col`}>
          <TradeLogTable />
        </aside>

        {/* Right Content Area */}
        <main className="flex flex-col gap-6">
          <StatsChart />
          <div className="grid gap-6 lg:grid-cols-2">
            <AssetDistributionChart />
            <DonationsTable />
          </div>
        </main>
      </div>
    </div>
  )
}
