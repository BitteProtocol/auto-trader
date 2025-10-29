import { z } from 'zod'
import { getEnvVar } from './env'

const StrategyConfigSchema = z.object({
  overview: z.string(),
  riskParams: z.object({
    profitTarget: z.number(),
    stopLoss: z.number(),
    maxPositions: z.number(),
    positionSize: z.string(),
  }),
  step1Rules: z.string(),
  step2Rules: z.string(),
  step3Rules: z.string(),
})

export const DEFAULT_STRATEGY: StrategyConfig = {
  overview:
    'Wall Street 3-Step: Data-driven day trading with clear profit/loss targets and risk management',
  riskParams: {
    profitTarget: 2,
    stopLoss: -1.5,
    maxPositions: 4,
    positionSize: '5-15% of USDC',
  },
  step1Rules:
    "Risk targets: SELL at +2% profit OR -1.5% loss. Close losing positions faster than winners (cut losses, let profits run). Don't close positions with raw balance below 1000.",
  step2Rules:
    'Screen for high-probability setups: Price momentum >3% with volume confirmation, Fear/Greed extremes, Order book imbalances. Use 1 analysis tool only if market data insufficient. Only trade clear directional moves.',
  step3Rules:
    'Dynamic sizing: 5-15% per trade (scales with account). Size calculation: Min($10, Max($5, USDC_balance * 0.10)). Account for slippage: Minimum $8 positions. Max 3-4 open positions at once.',
}

const ed25519Pattern = /^ed25519:[1-9A-HJ-NP-Za-km-z]{43,87}$/

export const ed25519String = z
  .string()
  .regex(ed25519Pattern, 'Invalid NEAR private key: must be ed25519:<base58>')
  .transform((val) => val as `ed25519:${string}`)

export const ServerConfigSchema = z.object({
  strategy: StrategyConfigSchema.optional().default(DEFAULT_STRATEGY),
  cronSecret: z.string(),
  bitteKey: z.string(),
  nearPk: ed25519String,
})

export type StrategyConfig = z.infer<typeof StrategyConfigSchema>
export type ServerConfig = z.infer<typeof ServerConfigSchema>

export function parseConfig(configString: string): ServerConfig {
  return ServerConfigSchema.parse(JSON.parse(configString))
}

export function loadConfig(): ServerConfig {
  try {
    return parseConfig(getEnvVar('SERVER_CONFIG'))
  } catch (error: unknown) {
    console.warn('Failed to parse SERVER_CONFIG, trying individual env vars', String(error))
    return {
      strategy: JSON.parse(getEnvVar('STRATEGY', JSON.stringify(DEFAULT_STRATEGY))),
      cronSecret: getEnvVar('CRON_SECRET'),
      bitteKey: getEnvVar('BITTE_API_KEY'),
      nearPk: getEnvVar('NEAR_PK') as `ed25519:${string}`,
    }
  }
}
