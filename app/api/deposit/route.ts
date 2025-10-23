import { NextRequest, NextResponse } from "next/server";
import { BALANCE_UPDATE_DELAY } from "@/lib/utils";
import { initializeNearAccount, depositUSDC, getUSDCBalance } from "@/lib/near";
import { formatUnits } from "@/lib/viem";
import { withCronSecret } from "@/lib/api-auth";
import { getEnvVar } from "@/lib/env";

async function depositHandler(request: NextRequest) {
  try {
    const accountId = getEnvVar("NEXT_PUBLIC_ACCOUNT_ID");
    const { searchParams } = new URL(request.url);
    const depositStr = searchParams.get("amount");
    if (!depositStr) {
      return NextResponse.json(
        { error: "unspecified amount" },
        { status: 400 }
      );
    }

    const depositAmount = BigInt(depositStr);

    const account = await initializeNearAccount(accountId);

    const usdcBalance = await getUSDCBalance(account);

    if (usdcBalance < depositAmount) {
      return NextResponse.json(
        {
          error: `Insufficient USDC balance (required: $${depositAmount}, available: $${usdcBalance})`,
        },
        { status: 400 }
      );
    }

    const tx = await depositUSDC(account, depositAmount);

    await new Promise((resolve) => setTimeout(resolve, BALANCE_UPDATE_DELAY));

    const uiAmount = formatUnits(depositAmount, 6);

    return NextResponse.json({
      message: `Successfully deposited $${uiAmount} USDC`,
      transactionHash: tx.transaction.hash,
      amount: uiAmount,
    });
  } catch (error) {
    console.error("Error in deposit endpoint:", error);
    return NextResponse.json(
      { error: "Failed to process deposit request" },
      { status: 500 }
    );
  }
}

export const GET = withCronSecret(depositHandler);
