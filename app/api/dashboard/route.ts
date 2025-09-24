import { type NextRequest, NextResponse } from "next/server";
import { buildDashboardData } from "@/lib/memory";
import { NEAR_ACCOUNT_ID } from "@/lib/utils";

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const accountId = searchParams.get("accountId") || NEAR_ACCOUNT_ID;

	try {
    console.log("using accountId for dashboard", accountId);
		const data = await buildDashboardData(accountId);
		console.log("buildDashboardData done");
		return NextResponse.json(data);
	} catch (error) {
		console.error("Dashboard API error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch dashboard data" },
			{ status: 500 },
		);
	}
}
