import { NextRequest, NextResponse } from "next/server";
import { BALANCE_UPDATE_DELAY, USDC_CONTRACT } from "@/lib/utils";
import {
  initializeNearAccount,
  withdrawToken,
  intentsBalance,
} from "@/lib/near";
import { formatUnits } from "@/lib/viem";

const bigIntMin = (a: bigint, b: bigint) => (a < b ? a : b);
const ZERO = BigInt(0);

export async function GET(request: NextRequest) {
  try {
    if (process.env.CRON_SECRET) {
      const authHeader = request.headers.get("Authorization");
      if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const { searchParams } = new URL(request.url);
    const withdrawStr = searchParams.get("amount");
    if (!withdrawStr) {
      return NextResponse.json(
        { error: "unspecified amount" },
        { status: 400 },
      );
    }
    const token = searchParams.get("token") || USDC_CONTRACT;

    const accountId = process.env.NEXT_PUBLIC_ACCOUNT_ID;
    if (!accountId) {
      return NextResponse.json(
        { error: "accountId is not configured" },
        { status: 500 },
      );
    }

    const requestedWithdrawAmount = BigInt(withdrawStr);

    const account = await initializeNearAccount(accountId);

    const usdcBalance = await intentsBalance(account, token);
    const withdrawAmount = bigIntMin(requestedWithdrawAmount, usdcBalance);

    if (withdrawAmount == ZERO) {
      return NextResponse.json(
        { message: "Nothing to withdraw" },
        { status: 200 },
      );
    }

    const tx = await withdrawToken(account, token, withdrawAmount);

    await new Promise((resolve) => setTimeout(resolve, BALANCE_UPDATE_DELAY));

    const uiAmount = formatUnits(withdrawAmount, 6);

    return NextResponse.json({
      message: `Successfully withdrew $${uiAmount} USDC`,
      transactionHash: tx.transaction.hash,
      amount: uiAmount,
    });
  } catch (error) {
    console.error("Error in deposit endpoint:", error);
    return NextResponse.json(
      { error: "Failed to process deposit request" },
      { status: 500 },
    );
  }
}
