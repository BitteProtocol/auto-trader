import { NextRequest, NextResponse } from "next/server";
import { CRON_SECRET } from "./env";

type AuthenticatedCallHandler = (req: NextRequest) => Promise<NextResponse>;

export function withCronSecret(handler: AuthenticatedCallHandler) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const authHeader = req.headers.get("Authorization");
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return handler(req);
  };
}
