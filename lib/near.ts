import { Account, KeyPair, keyStores, Near } from "near-api-js"
import { INTENTS_CONTRACT_ID, NEAR_RPC_URL, TGas } from "./utils"
import { actionCreators } from "@near-js/transactions"
import { Quote } from "./types"

export async function getTokenBalance(account: Account, assetId: string): Promise<bigint> {
    try {
      const result = await account.viewFunction({
        contractId: INTENTS_CONTRACT_ID,
        methodName: "mt_balance_of",
        args: { token_id: assetId, account_id: account.accountId }
      })
      return BigInt(result as string)
    } catch (error) {
      console.warn(`Failed to fetch balance for ${assetId}:`, error)
      return BigInt(0)
    }
  }


export async function initializeNearAccount(accountId: string): Promise<Account> {
    const nearPrivateKey = process.env.NEAR_PK as `ed25519:${string}`
    if (!nearPrivateKey) {
      throw new Error('NEAR_PK is not set')
    }
    const keyPair = KeyPair.fromString(nearPrivateKey!)
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
          "mt_transfer",
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