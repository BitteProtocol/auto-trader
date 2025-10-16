import { NextResponse } from "next/server";
import { BALANCE_UPDATE_DELAY, logTradingAgentData } from "@/lib/utils";
import { storeTrade, storePortfolioSnapshot } from "@/lib/api-helpers";
import { buildTransactionPayload, initializeNearAccount } from "@/lib/near";
import { buildAgentContext } from "@/lib/agent-context";
import { callAgent } from "@bitte-ai/agent-sdk";
import { ToolResult } from "@/lib/types";
import { ACCOUNT_ID } from "@/lib/env";
import { withCronSecret } from "@/lib/api-auth";

async function tradeHandler(): Promise<NextResponse> {
  try {
    const agentId = "trading-agent-kappa.vercel.app";

    const account = await initializeNearAccount(ACCOUNT_ID);

    const context = await buildAgentContext(ACCOUNT_ID, account);

    const { content, toolResults } = await callAgent(
      ACCOUNT_ID,
      context.systemPrompt,
      agentId,
    );

    const quoteResult = (toolResults as ToolResult[]).find(
      (callResult) => callResult.result?.data?.data?.quote,
    );
    const quote = quoteResult?.result?.data?.data?.quote;

    logTradingAgentData({
      context,
      content,
      pnlUsd: context.totalPnl,
      quoteResult,
    });

    if (quote) {
      const tx = await account.signAndSendTransaction(
        buildTransactionPayload(quote),
      );
      console.log("Trade executed:", tx.transaction.hash);
      await new Promise((resolve) => setTimeout(resolve, BALANCE_UPDATE_DELAY));
      await storeTrade(quote);

      const updatedContext = await buildAgentContext(ACCOUNT_ID, account);

      await storePortfolioSnapshot(
        updatedContext.positionsWithPnl,
        updatedContext.totalUsd,
        context.totalUsd,
        content,
      );
    } else {
      await storePortfolioSnapshot(
        context.positionsWithPnl,
        context.totalUsd,
        context.totalUsd,
        content,
      );
    }
    return NextResponse.json({ content });
  } catch (error) {
    console.error("Error in trading endpoint:", error);
    return NextResponse.json(
      { error: "Failed to process trading request" },
      { status: 500 },
    );
  }
}

export const GET = withCronSecret(tradeHandler);
