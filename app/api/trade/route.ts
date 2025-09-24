import { callChatApi, getMessageParts, type UIMessage } from "@ai-sdk/ui-utils";
import { type ChatRequest, generateId, type ToolInvocation } from "ai";
import type { Account } from "near-api-js";
import { type NextRequest, NextResponse } from "next/server";
import { buildAgentContext } from "@/lib/agent-context";
import {
  ensureDatabaseSetup,
  storeActualTrade,
  storePortfolioSnapshot,
} from "@/lib/memory";
import { buildTransactionPayload, initializeNearAccount } from "@/lib/near";
import type { AgentContext, Quote, QuoteToolResult } from "@/lib/types";
import {
  AGENT_ID,
  BALANCE_UPDATE_DELAY,
  BITTE_CHAT_API_URL,
  logTradingAgentData,
  NEAR_ACCOUNT_ID,
} from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    if (process.env.CRON_SECRET) {
      const authHeader = request.headers.get("Authorization");
      if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    if (!NEAR_ACCOUNT_ID) {
      return NextResponse.json(
        { error: "accountId is required" },
        { status: 400 }
      );
    }

    await ensureDatabaseSetup();

    const account = await initializeNearAccount(NEAR_ACCOUNT_ID);
    const context = await buildAgentContext(NEAR_ACCOUNT_ID, account);

    const lastMessage: UIMessage = {
      id: generateId(),
      role: "assistant",
      content: "",
      parts: [],
    };

    const agentMessage: UIMessage = {
      id: generateId(),
      role: "user",
      content: "",
      parts: [
        {
          type: "text",
          text: context.systemPrompt,
        },
      ],
    };

    const chatRequestBody: ChatRequest["body"] = {
      id: generateId(),
      config: {
        mode: "debug",
        agentId: AGENT_ID,
      },
      accountId: NEAR_ACCOUNT_ID,
      messages: [agentMessage],
    };

    const combinedMessages: UIMessage[] = [agentMessage];
    const toolInvocations: ToolInvocation[] = [];
    const toolResults: QuoteToolResult[] = [];

    await callChatApi({
      api: BITTE_CHAT_API_URL,
      body: chatRequestBody,
      streamProtocol: "data",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.BITTE_API_KEY}`,
      },
      abortController: () => new AbortController(),
      restoreMessagesOnFailure: () => {},
      onResponse: async () => {},
      onUpdate: () => {},
      onFinish: (message) => {
        const modelMessage = {
          ...message,
          parts: message.parts || [
            {
              type: "text",
              text: message.content,
            },
          ],
        };

        combinedMessages.push(modelMessage);

        const allMessageParts = combinedMessages.flatMap(getMessageParts);

        for (const part of allMessageParts) {
          // append tool invocations
          if (part.type === "tool-invocation") {
            toolInvocations.push(part.toolInvocation);
            // append tools with results separately
            if (part.toolInvocation.state === "result") {
              toolResults.push(part.toolInvocation.result);
            }
          }
        }
      },
      onToolCall: () => {
        // console.log("tool call", toolCall.toolName);
      },
      generateId: generateId,
      fetch: fetch,
      lastMessage,
      requestType: "generate",
    });

    const lastMessageParts = getMessageParts(lastMessage);
    const lastMessageContent =
      lastMessageParts.find((part) => part.type === "text")?.text ||
      lastMessage.content ||
      "";
    const reasoning = lastMessageParts.find(
      (part) => part.type === "reasoning"
    )?.reasoning;

    // handle tool results by tool name
    for (const toolResult of toolResults) {
      switch (toolResult.toolName) {
        case "quote": {
          console.log("found quote tool!", JSON.stringify(toolResult));
          const quoteData = toolResult?.result?.data?.data?.quote;
          console.log("quoteData", quoteData);
          if (!quoteData) continue;
          await executeAndStoreTrade({
            quote: quoteData,
            account,
            context,
            reasoning,
          });
          break;
        }
        default: {
          console.warn("unhandled tool result:", JSON.stringify(toolResult));
          break;
        }
      }
    }

    logTradingAgentData({
      context,
      content: lastMessageContent,
      pnlUsd: context.totalPnl,
      quoteResult: toolResults.find((result) => result.toolName === "quote"),
    });

    return NextResponse.json({
      toolInvocations,
      toolResults,
      lastMessage,
      reasoning,
    });
  } catch (error) {
    console.error("Error in trading endpoint:", error);
    return NextResponse.json(
      { error: "Failed to process trading request" },
      { status: 500 }
    );
  }
}

const executeAndStoreTrade = async ({
  quote,
  account,
  context,
  reasoning,
}: {
  quote: Quote;
  account: Account;
  context: AgentContext;
  reasoning?: string;
}) => {
  try {
    const tx = await account.signAndSendTransaction(
      buildTransactionPayload(quote)
    );
    console.log("Trade executed:", tx.transaction.hash);
    await new Promise((resolve) => setTimeout(resolve, BALANCE_UPDATE_DELAY));
    await storeActualTrade(NEAR_ACCOUNT_ID, quote);

    const updatedContext = await buildAgentContext(NEAR_ACCOUNT_ID, account);

    await storePortfolioSnapshot(
      NEAR_ACCOUNT_ID,
      updatedContext.positionsWithPnl,
      updatedContext.totalUsd,
      context.totalUsd,
      reasoning
    );
  } catch (error) {
    console.error("Error executing trade:", error);
  }
};
