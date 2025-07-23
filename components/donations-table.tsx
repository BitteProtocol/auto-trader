import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatRelativeTime } from "@/lib/time-utils"

const donations = [
  {
    timestamp: "2023-08-18T10:00:00Z",
    person: "Alice Smith",
    amount: 500.0,
  },
  {
    timestamp: "2023-08-17T22:15:30Z",
    person: "Bob Johnson",
    amount: 1000.0,
  },
  {
    timestamp: "2023-08-17T15:45:00Z",
    person: "Charlie Brown",
    amount: 250.0,
  },
  {
    timestamp: "2023-08-16T09:00:00Z",
    person: "Diana Prince",
    amount: 750.0,
  },
]

export function DonationsTable() {
  return (
    <Card className="p-6">
      <CardHeader className="p-0 mb-4">
        <CardTitle className="text-lg font-semibold">Recent Donations</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Person</TableHead>
              <TableHead>Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {donations.map((donation, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{formatRelativeTime(donation.timestamp)}</TableCell>
                <TableCell>{donation.person}</TableCell>
                <TableCell>${donation.amount.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
