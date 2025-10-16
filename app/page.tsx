"use client";

import { DEPLOYMENT_URL, ACCOUNT_ID } from "@/lib/env";
import { useEffect, useState } from "react";

export default function Page() {
  const [deployed, setDeployed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const baseUrl = "https://bitte-autonomous-agent-dashboard.vercel.app";

  useEffect(() => {
    fetch(`${baseUrl}/api/deployment/check?accountId=${ACCOUNT_ID}`)
      .then((res) => res.json())
      .then((data) => {
        setDeployed(data.deployed);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="container">
      <div className="content">
        <h1 className="title">Deployment Complete</h1>

        {loading ? (
          <p className="description">Checking status...</p>
        ) : deployed === true ? (
          <>
            <p className="description">
              Your agent is registered and ready. Next step: deposit USDC to
              start trading.
            </p>
            <a href={`${baseUrl}/deposit-usdc`} className="button">
              Deposit USDC
            </a>
          </>
        ) : (
          <>
            <p className="description">
              You&apos;ve completed the deployment step. Now you need to
              register your agent.
            </p>
            <a
              href={`${baseUrl}/deploy-url?url=${encodeURIComponent(DEPLOYMENT_URL)}`}
              className="button"
            >
              Register Agent
            </a>
          </>
        )}
      </div>
    </div>
  );
}
