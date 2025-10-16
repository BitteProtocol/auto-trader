import { actionCreators } from "@near-js/transactions";
import { Account, KeyPair, keyStores, Near } from "near-api-js";
import type { Quote } from "./types";
import { INTENTS_CONTRACT_ID, NEAR_RPC_URL, TGas } from "./utils";
import { NEAR_PK } from "./env";

export async function getTokenBalance(
  account: Account,
  assetId: string,
): Promise<bigint> {
  try {
    const result = await account.viewFunction({
      contractId: INTENTS_CONTRACT_ID,
      methodName: "mt_balance_of",
      args: { token_id: assetId, account_id: account.accountId },
    });
    return BigInt(result as string);
  } catch (error) {
    console.warn(`Failed to fetch balance for ${assetId}:`, error);
    return BigInt(0);
  }
}

export async function initializeNearAccount(
  accountId: string,
): Promise<Account> {
  const keyPair = KeyPair.fromString(NEAR_PK);
  const keyStore = new keyStores.InMemoryKeyStore();
  keyStore.setKey("mainnet", accountId, keyPair);

  const near = new Near({
    networkId: "mainnet",
    keyStore,
    nodeUrl: NEAR_RPC_URL,
  });

  return new Account(near.connection, accountId);
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
        BigInt(1),
      ),
    ],
  };
}

const USDC_CONTRACT =
  "17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1";

export async function getUSDCBalance(account: Account): Promise<bigint> {
  try {
    const result = await account.viewFunction({
      contractId: USDC_CONTRACT,
      methodName: "ft_balance_of",
      args: { account_id: account.accountId },
    });
    return BigInt(result as string);
  } catch (error) {
    console.warn("Failed to fetch USDC balance:", error);
    return BigInt(0);
  }
}

export async function depositUSDC(account: Account, amount: bigint) {
  const result = await account.signAndSendTransaction({
    receiverId: USDC_CONTRACT,
    actions: [
      actionCreators.functionCall(
        "ft_transfer_call",
        {
          receiver_id: INTENTS_CONTRACT_ID,
          amount: amount.toString(),
          msg: account.accountId,
        },
        BigInt(TGas * 50),
        BigInt(1),
      ),
    ],
  });

  const hasSuccess = result.receipts_outcome.some((receipt) =>
    receipt.outcome.logs.some(
      (log) => log.includes("mt_mint") && log.includes(account.accountId),
    ),
  );

  const hasRefund = result.receipts_outcome.some((receipt) =>
    receipt.outcome.logs.some(
      (log) => log.includes("ft_transfer") && log.includes('"memo":"refund"'),
    ),
  );

  if (hasRefund || !hasSuccess) {
    throw new Error("Deposit failed - transaction was refunded");
  }

  return result;
}
