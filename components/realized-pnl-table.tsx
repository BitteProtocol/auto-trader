import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatRelativeTime } from "@/lib/time-utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const tokensUrl = 'https://storage.googleapis.com/bitte-public/intents/tokens'
const chainsUrl = 'https://storage.googleapis.com/bitte-public/intents/chains'

const TOKEN_ICONS: Record<string, string> = {
  BTC: `${tokensUrl}/btc_token.svg`,
  ETH: `${tokensUrl}/eth_token.svg`,
  NEAR: `${chainsUrl}/near.svg`,
  WNEAR: `${chainsUrl}/near.svg`,
  USDC: `${tokensUrl}/usdc_token.svg`,
  USDT: `${tokensUrl}/usdt_token.svg`,
  XDAI: `${tokensUrl}/xdai_token.svg`,
  DAI: `${tokensUrl}/xdai_token.svg`,
  SOL: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png',
  REF: 'https://assets.coingecko.com/coins/images/18279/small/ref.png',
  FRAX: 'https://assets.coingecko.com/coins/images/13422/small/FRAX_icon.png',
  AURORA: '/aurora.svg',
  JAMBO: 'https://plum-necessary-chameleon-942.mypinata.cloud/ipfs/QmVBgYM7SoEwsg1pZgi8gW6ZNPgo8pzSDSZrQw',
  ARB: 'https://s2.coinmarketcap.com/static/img/coins/128x128/11841.png',
  DOGE: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png',
  XRP: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png',
  KNC: 'https://assets.coingecko.com/coins/images/947/small/kyber-logo.png',
  GMX: 'https://assets.coingecko.com/coins/images/18323/small/arbit.png',
  AAVE: 'https://assets.coingecko.com/coins/images/12645/small/AAVE.png',
  UNI: 'https://assets.coingecko.com/coins/images/12504/small/uniswap-uni.png',
  LINK: 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png',
  SHIB: 'https://assets.coingecko.com/coins/images/11939/small/shiba.png',
  PEPE: 'https://assets.coingecko.com/coins/images/29850/small/pepe-token.jpeg',
  TRX: 'https://assets.coingecko.com/coins/images/1094/small/tron-logo.png',
  ZEC: 'https://assets.coingecko.com/coins/images/486/small/circle-zcash-color.png',
  SUI: 'https://s2.coinmarketcap.com/static/img/coins/64x64/20947.png',
  ADA: 'https://assets.coingecko.com/coins/images/975/standard/cardano.png?1696502090',
  BLACKDRAGON: '/black_dragon.webp',
  SHITZU: '/shitzu.webp',
  PURGE: '/purge.png',
  ABG: '/abg.jpeg',
  KAITO: '/kaito.png',
  XBTC: `${tokensUrl}/btc_token.svg`,
  TURBO: `https://assets.coingecko.com/coins/images/30117/standard/TurboMark-QL_200.png?1708079597`,
  TRUMP: `https://assets.coingecko.com/coins/images/53746/standard/trump.png?1737171561`,
  MELANIA: `https://assets.coingecko.com/coins/images/53775/standard/melania-meme.png?1737329885`,
  $WIF: "https://assets.coingecko.com/coins/images/33566/standard/dogwifhat.jpg?1702499428",
  WBTC: `${tokensUrl}/btc_token.svg`,
  CBBTC: `${tokensUrl}/btc_token.svg`,
  BRETT: 'https://assets.coingecko.com/coins/images/35529/standard/1000050750.png?1709031995',
  SWEAT: 'https://assets.coingecko.com/coins/images/25057/standard/fhD9Xs16_400x400.jpg?1696524208',
  USD1: 'https://assets.coingecko.com/coins/images/54977/standard/USD1_1000x1000_transparent.png?1749297002',
  MOG: 'https://assets.coingecko.com/coins/images/31059/standard/MOG_LOGO_200x200.png?1696529893',
  USDF: 'https://assets.coingecko.com/coins/images/54558/standard/ff_200_X_200.png?1740741076',
  GNO: 'https://assets.coingecko.com/coins/images/662/standard/logo_square_simple_300px.png?1696501854',
  SAFE: 'https://assets.coingecko.com/coins/images/27032/standard/Artboard_1_copy_8circle-1.png?1696526084',
  COW: 'https://assets.coingecko.com/coins/images/24384/small/cow.png',
  WETH: 'https://assets.coingecko.com/coins/images/2518/standard/weth.png?1696501626',
  RHEA: 'https://s2.coinmarketcap.com/static/img/coins/64x64/37529.png',
  BNB: `https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png`,
  POL: `https://s2.coinmarketcap.com/static/img/coins/64x64/3890.png`,
  OP: `https://s2.coinmarketcap.com/static/img/coins/64x64/11840.png`,
  AVAX: `https://s2.coinmarketcap.com/static/img/coins/64x64/5805.png`,
  TON: 'https://s2.coinmarketcap.com/static/img/coins/64x64/11419.png',
  PUBLIC: 'https://ref-new-1.s3.amazonaws.com/token/a7bac0ba58cbef0d117c76d9869bc2e0.svg',
  APT: "https://s2.coinmarketcap.com/static/img/coins/64x64/21794.png",
}

interface RealizedPnLTableProps {
  trades?: any[]
}

export function RealizedPnLTable({ trades: propTrades }: RealizedPnLTableProps) {
  const trades = propTrades || []
  
  // Filter for only SELL trades (realized P&L) and trades with actual P&L values
  const realizedTrades = trades
    .filter(trade => trade.type === 'SELL' && trade.pnl !== undefined && Number(trade.pnl) !== 0)
    .slice(0, 10)
  
  const isLoading = !propTrades
  const hasNoRealizedTrades = propTrades && realizedTrades.length === 0
  
  // Calculate total realized P&L
  const totalRealizedPnL = realizedTrades.reduce((sum, trade) => sum + Number(trade.pnl || 0), 0)
  
  return (
    <Card className="h-full max-h-[600px] flex flex-col shadow-sm">
      <CardHeader className="pb-4 px-4 md:px-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg md:text-xl font-semibold">Realized P&L</CardTitle>
            <span className={`px-2 py-1 rounded-md text-xs font-semibold ${
              totalRealizedPnL >= 0 ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
            }`}>
              {totalRealizedPnL >= 0 ? '+' : ''}${totalRealizedPnL.toFixed(2)}
            </span>
          </div>
          <span className="text-sm text-muted-foreground">
            {realizedTrades.length > 0 ? `${realizedTrades.length} closed positions` : 'No closed positions yet'}
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto h-full custom-scrollbar">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10 border-b">
              <TableRow>
                <TableHead className="text-xs font-medium whitespace-nowrap px-2 md:px-4">Time</TableHead>
                <TableHead className="text-xs font-medium whitespace-nowrap px-2 md:px-4">Asset</TableHead>
                <TableHead className="text-xs font-medium whitespace-nowrap px-2 md:px-4 hidden md:table-cell">Qty</TableHead>
                <TableHead className="text-xs font-medium whitespace-nowrap px-2 md:px-4 hidden sm:table-cell">Price</TableHead>
                <TableHead className="text-xs font-medium whitespace-nowrap px-2 md:px-4">P&L</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Loading realized trades...
                  </TableCell>
                </TableRow>
              ) : hasNoRealizedTrades ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No realized trades yet
                  </TableCell>
                </TableRow>
              ) : (
                realizedTrades.map((trade, index) => (
                  <TableRow key={trade.id || index} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium py-2 md:py-3 text-xs px-2 md:px-4">
                      <div className="whitespace-nowrap">{formatRelativeTime(trade.timestamp)}</div>
                    </TableCell>
                    <TableCell className="font-semibold py-2 md:py-3 px-2 md:px-4">
                      <div className="flex items-center gap-1 md:gap-2">
                        {TOKEN_ICONS[trade.asset] && (
                          <img 
                            src={TOKEN_ICONS[trade.asset]} 
                            alt={trade.asset} 
                            className="w-4 h-4 md:w-5 md:h-5 rounded-full flex-shrink-0"
                          />
                        )}
                        <span className="text-xs md:text-sm truncate">{trade.asset}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-2 md:py-3 text-xs px-2 md:px-4 hidden md:table-cell">
                      {Number(trade.quantity).toFixed(4)}
                    </TableCell>
                    <TableCell className="py-2 md:py-3 text-xs px-2 md:px-4 hidden sm:table-cell">
                      <div className="whitespace-nowrap">
                        ${Number(trade.price).toFixed(Number(trade.price) < 0.01 ? 8 : 2)}
                      </div>
                    </TableCell>
                    <TableCell className={`py-2 md:py-3 font-semibold text-xs px-2 md:px-4 ${trade.pnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                      <div className="flex flex-col">
                        <span className="whitespace-nowrap font-bold">
                          {trade.pnl >= 0 ? '+' : ''}${Math.abs(Number(trade.pnl)).toFixed(2)}
                        </span>
                        <div className="flex flex-col text-xs text-muted-foreground md:hidden mt-1">
                          <span>{Number(trade.quantity).toFixed(2)}</span>
                          <span>${Number(trade.price).toFixed(Number(trade.price) < 0.01 ? 6 : 2)}</span>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
