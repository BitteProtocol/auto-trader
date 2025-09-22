import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatRelativeTime } from "@/lib/time-utils"

const donations = [
  {
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    person: "CryptoFan88",
    amount: 25.0,
  },
  {
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
    person: "TradingBro",
    amount: 10.0,
  },
  {
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    person: "MoonWalker",
    amount: 50.0,
  },
  {
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    person: "DiamondHands",
    amount: 15.0,
  },
]

export function DonationsTable() {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-6">
        <CardTitle className="text-xl font-semibold">Recent Donations</CardTitle>
      </CardHeader>
      <CardContent className="p-0 px-6 pb-6">
        <Table>
          <TableHeader>
            <TableRow className="border-b">
              <TableHead className="text-xs font-medium">Time</TableHead>
              <TableHead className="text-xs font-medium">Person</TableHead>
              <TableHead className="text-xs font-medium text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {donations.map((donation, index) => (
              <TableRow key={index} className="hover:bg-muted/50 transition-colors">
                <TableCell className="font-medium py-3 text-sm">{formatRelativeTime(donation.timestamp)}</TableCell>
                <TableCell className="py-3 font-medium">{donation.person}</TableCell>
                <TableCell className="py-3 text-right font-semibold text-green-500">
                  ${donation.amount.toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
