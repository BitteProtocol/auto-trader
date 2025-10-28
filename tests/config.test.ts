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
    process.env.DEPLOYMENT_CONFIG = JSON.stringify(expected)
    expect(loadConfig()).toStrictEqual(expected)
  })
})
