import { actionCreators } from '@near-js/transactions'
import { Account, KeyPair, keyStores, Near } from 'near-api-js'
import type { Quote } from './types'
import { INTENTS_CONTRACT_ID, NEAR_RPC_URL, TGas, USDC_CONTRACT } from './utils'
import { getEnvVar } from './env'

const FIFTY_TGAS = BigInt(TGas * 50)
const ONE_YOCTO = BigInt(1)

export async function getTokenBalance(account: Account, assetId: string): Promise<bigint> {
  try {
    const result = await account.viewFunction({
      contractId: INTENTS_CONTRACT_ID,
      methodName: 'mt_balance_of',
      args: { token_id: assetId, account_id: account.accountId },
    })
    return BigInt(result as string)
  } catch (error) {
    console.warn(`Failed to fetch balance for ${assetId}:`, error)
    return BigInt(0)
  }
}

export async function initializeNearAccount(accountId: string): Promise<Account> {
  const keyPair = KeyPair.fromString(getEnvVar('NEAR_PK') as `ed25519:${string}`)
  const keyStore = new keyStores.InMemoryKeyStore()
  keyStore.setKey('mainnet', accountId, keyPair)

  const near = new Near({
    networkId: 'mainnet',
    keyStore,
    nodeUrl: NEAR_RPC_URL,
  })

  return new Account(near.connection, accountId)
}

export function buildTransactionPayload(quote: Quote) {
  return {
    receiverId: INTENTS_CONTRACT_ID,
    actions: [
      actionCreators.functionCall(
        'mt_transfer',
        {
          token_id: quote.originAsset,
          receiver_id: quote.depositAddress,
          amount: quote.amountIn,
        },
        BigInt(TGas * 30),
        BigInt(1)
      ),
    ],
  }
}

export async function getUSDCBalance(account: Account): Promise<bigint> {
  try {
    const result = await account.viewFunction({
      contractId: USDC_CONTRACT,
      methodName: 'ft_balance_of',
      args: { account_id: account.accountId },
    })
    return BigInt(result as string)
  } catch (error) {
    console.warn('Failed to fetch USDC balance:', error)
    return BigInt(0)
  }
}

export async function intentsUSDCBalance(account: Account): Promise<bigint> {
  return intentsBalance(account, USDC_CONTRACT)
}

export async function intentsBalance(account: Account, token: string): Promise<bigint> {
  try {
    const result = await account.viewFunction({
      contractId: INTENTS_CONTRACT_ID,
      methodName: 'mt_balance_of',
      args: { token_id: `nep141:${token}`, account_id: account.accountId },
    })
    return BigInt(result as string)
  } catch (error) {
    console.warn('Failed to fetch USDC balance:', error)
    return BigInt(0)
  }
}

export async function depositUSDC(account: Account, amount: bigint) {
  const result = await account.signAndSendTransaction({
    receiverId: USDC_CONTRACT,
    actions: [
      actionCreators.functionCall(
        'ft_transfer_call',
        {
          receiver_id: INTENTS_CONTRACT_ID,
          amount: amount.toString(),
          msg: account.accountId,
        },
        FIFTY_TGAS,
        ONE_YOCTO
      ),
    ],
  })

  const hasSuccess = result.receipts_outcome.some((receipt) =>
    receipt.outcome.logs.some((log) => log.includes('mt_mint') && log.includes(account.accountId))
  )

  const hasRefund = result.receipts_outcome.some((receipt) =>
    receipt.outcome.logs.some(
      (log) => log.includes('ft_transfer') && log.includes('"memo":"refund"')
    )
  )

  if (hasRefund || !hasSuccess) {
    throw new Error('Deposit failed - transaction was refunded')
  }

  return result
}

export async function withdrawUSDC(account: Account, amount: bigint) {
  return withdrawToken(account, USDC_CONTRACT, amount)
}

export async function withdrawToken(account: Account, token: string, amount: bigint) {
  const result = await account.signAndSendTransaction({
    receiverId: INTENTS_CONTRACT_ID,
    actions: [
      actionCreators.functionCall(
        'ft_withdraw',
        {
          token,
          amount: amount.toString(),
          receiver_id: account.accountId,
          // Docs suggest refund is not necessarily possible if msg is specified!
          // https://docs.near-intents.org/near-intents/market-makers/verifier/deposits-and-withdrawals/withdrawals#refunds-on-failed-withdrawals-warning
          // msg: null
        },
        FIFTY_TGAS,
        ONE_YOCTO
      ),
    ],
  })

  const hasSuccess = result.receipts_outcome.some((receipt) =>
    receipt.outcome.logs.some(
      (log) => log.includes('ft_transfer') && log.includes(account.accountId)
    )
  )
  const hasRefund = result.receipts_outcome.some((receipt) =>
    receipt.outcome.logs.some(
      (log) => log.includes('ft_transfer') && log.includes('"memo":"refund"')
    )
  )

  if (hasRefund || !hasSuccess) {
    throw new Error(`Withdraw failed - transaction was refunded ${result.transaction.hash}`)
  }

  return result
}
