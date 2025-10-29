import { DEFAULT_STRATEGY, loadConfig, ServerConfig } from '@/lib/config'

describe('loadCOnfig', () => {
  it('fails on empty/null DeploymentConfig - with single env fallback', async () => {
    const expected: ServerConfig = {
      strategy: DEFAULT_STRATEGY,
      cronSecret: 'secret',
      bitteKey: 'bitteKey',
      nearPk: 'ed25519:abc',
    }
    process.env.BITTE_API_KEY = expected.bitteKey
    process.env.NEAR_PK = expected.nearPk
    process.env.CRON_SECRET = expected.cronSecret
    expect(loadConfig()).toStrictEqual(expected)
  })

  it('loads DeploymentConfig directly from stringified env', async () => {
    const expected: ServerConfig = {
      strategy: DEFAULT_STRATEGY,
      cronSecret: 'secret',
      bitteKey: 'bitteKey',
      nearPk: 'ed25519:9999999999999999999999999999999999999999999',
    }
    process.env.SERVER_CONFIG = JSON.stringify(expected)
    expect(loadConfig()).toStrictEqual(expected)
  })

  it('loads Config directly copied from ATA front end', async () => {
    process.env.SERVER_CONFIG =
      '{"nearPk":"ed25519:FAKEFAKEFAKEFAKEFAKEFAKEFAKEFAKEFAKEFAKEFAKEFAKEFAKEFAKEFAKEFAKEFAKEFAKEFAKEFAKEFAKEFAKE","cronSecret":"6969696969696969696969696969696969696969696969696969696969696969","bitteKey":"bitte_AIAIAIAIAIAIAIAIAIAIAI","strategy":"{\"riskParams\":{\"profitTarget\":3,\"stopLoss\":-2,\"maxPositions\":5,\"positionSize\":\"10-20% of USDC\"},\"step1Rules\":\"Quick exits: SELL at +3% profit OR -2% loss. Move fast on both winners and losers. Dont close positions with raw balance below 1000.\",\"step2Rules\":\"Hunt momentum: Price moves >5% with volume spikes, extreme Fear/Greed readings (<20 or >80). Use 1 tool max if needed. Only trade strong directional momentum.\",\"step3Rules\":\"Aggressive sizing: 10-20% per position. Size: Min($15, Max($10, USDC_balance * 0.15)). Allow up to 5 concurrent positions for diversification.\"}"}'
    expect(loadConfig()).toBeDefined()
  })
})
