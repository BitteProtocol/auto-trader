import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatRelativeTime } from "@/lib/time-utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card" // Import Card components

const trades = [
  {
    timestamp: "2023-08-18T14:30:00Z",
    asset: "BTC",
    type: "BUY",
    quantity: 0,
    price: 29500.0,
    pnl: 150.25,
  },
  {
    timestamp: "2023-08-18T14:35:15Z",
    asset: "ETH",
    type: "SELL",
    quantity: 0.75,
    price: 1850.5,
    pnl: -50.1,
  },
  {
    timestamp: "2023-08-18T14:40:30Z",
    asset: "ADA",
    type: "BUY",
    quantity: 100,
    price: 0.28,
    pnl: 10.0,
  },
  {
    timestamp: "2023-08-18T14:45:00Z",
    asset: "BTC",
    type: "SELL",
    quantity: 0.02,
    price: 29600.0,
    pnl: 200.5,
  },
  {
    timestamp: "2023-08-18T14:50:00Z",
    asset: "SOL",
    type: "BUY",
    quantity: 5,
    price: 22.0,
    pnl: -10.0,
  },
  {
    timestamp: "2023-08-18T14:55:00Z",
    asset: "XRP",
    type: "BUY",
    quantity: 500,
    price: 0.55,
    pnl: 25.0,
  },
  {
    timestamp: "2023-08-18T15:00:00Z",
    asset: "LTC",
    type: "SELL",
    quantity: 2,
    price: 70.0,
    pnl: -15.0,
  },
  {
    timestamp: "2023-08-18T15:05:00Z",
    asset: "DOGE",
    type: "BUY",
    quantity: 1000,
    price: 0.07,
    pnl: 5.0,
  },
  {
    timestamp: "2023-08-18T15:10:00Z",
    asset: "BNB",
    type: "SELL",
    quantity: 0.1,
    price: 250.0,
    pnl: 30.0,
  },
  {
    timestamp: "2023-08-18T15:15:00Z",
    asset: "DOT",
    type: "BUY",
    quantity: 10,
    price: 5.5,
    pnl: -2.0,
  },
  {
    timestamp: "2023-08-18T15:20:00Z",
    asset: "AVAX",
    type: "BUY",
    quantity: 2,
    price: 12.0,
    pnl: 8.0,
  },
  {
    timestamp: "2023-08-18T15:25:00Z",
    asset: "UNI",
    type: "SELL",
    quantity: 3,
    price: 6.0,
    pnl: -3.0,
  },
  {
    timestamp: "2023-08-18T15:30:00Z",
    asset: "LINK",
    type: "BUY",
    quantity: 5,
    price: 7.0,
    pnl: 12.0,
  },
  {
    timestamp: "2023-08-18T15:35:00Z",
    asset: "TRX",
    type: "SELL",
    quantity: 200,
    price: 0.08,
    pnl: -1.0,
  },
  {
    timestamp: "2023-08-18T15:40:00Z",
    asset: "MATIC",
    type: "BUY",
    quantity: 50,
    price: 0.75,
    pnl: 7.5,
  },
]

export function TradeLogTable() {
  return (
    <Card className="h-full flex flex-col p-6">
      <CardHeader className="p-0 pb-4">
        <CardTitle className="text-lg font-semibold">Live Trade Log</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-y-auto custom-scrollbar">
        <Table>
          <TableHeader className="sticky top-0 bg-card backdrop-blur-sm z-10">
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Asset</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>PnL</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trades.splice(0,9).map((trade, index) => (
              <TableRow key={index} className="hover:bg-accent/20 transition-colors">
                <TableCell className="font-medium">{formatRelativeTime(trade.timestamp)}</TableCell>
                <TableCell>{trade.asset}</TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      trade.type === "BUY" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {trade.type}
                  </span>
                </TableCell>
                <TableCell>{trade.quantity}</TableCell>
                <TableCell>${trade.price.toFixed(2)}</TableCell>
                <TableCell className={trade.pnl >= 0 ? "text-green-400" : "text-red-400"}>
                  ${trade.pnl.toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
